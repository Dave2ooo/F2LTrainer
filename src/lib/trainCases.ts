import { GROUP_DEFINITIONS, type GroupId } from './types/group';
import {
	OPPOSITE_COLOR,
	STICKER_COLORS,
	SIDE_COLOR,
	type StickerColor,
	type StickerHidden
} from './types/stickering';
import { casesStatic } from './casesStatic';
import { casesState, getCaseScramblePool } from './casesState.svelte';
import type { Side } from '$lib/types/Side';
import { globalState } from './globalState.svelte';
import { AUF, type Auf } from './types/trainCase';
import shuffleArray from './utils/shuffleArray';

import { statisticsState } from './statisticsState.svelte';
import type { Solve } from './types/statisticsState';
import { sessionState } from '$lib/sessionState.svelte';

export function gernerateTrainCases(): TrainCase[] {
	// console.log('gernerateTrainCases() called');
	const result: TrainCase[] = [];

	const sessionSettings = sessionState.activeSession?.settings;

	// Fallback to globalState proxies if sessionSettings not available (though globalState proxies to session anyway)
	// But for new properties like caseMode, we need to access settings directly.

	const trainGroupSelection = globalState.trainGroupSelection;
	const trainStateSelection = globalState.trainStateSelection;
	const trainSideSelection = globalState.trainSideSelection;
	const trainSmartFrequencySolved = globalState.trainSmartFrequencySolved;
	const trainSmartFrequencyTime = globalState.trainSmartFrequencyTime;

	const crossColor = globalState.crossColor;
	const frontColor = globalState.frontColor;

	const caseMode = sessionSettings?.caseMode || 'group';
	const selectedCases = sessionSettings?.selectedCases || {};
	const frequencyMode = sessionSettings?.frequencyMode || 'smart';

	// Collect all candidates first
	const candidates: { groupId: GroupId; caseId: number; side: Side }[] = [];

	for (const groupId of Object.keys(GROUP_DEFINITIONS) as GroupId[]) {
		// In Group mode, we skip entire groups if unchecked.
		// In Individual mode, we might iterate all groups to find selected cases
		// (though we could optimize, iterating all is fine as there aren't that many).
		if (caseMode === 'group' && !trainGroupSelection[groupId]) continue;

		const groupCaseStates = casesState[groupId];

		for (const caseIdStr of Object.keys(groupCaseStates)) {
			const caseId = Number(caseIdStr);
			if (Number.isNaN(caseId)) continue;

			// Check Selection Logic
			if (caseMode === 'individual') {
				// Check if specifically selected
				// Key format: `${groupId}-${caseId}`
				if (!selectedCases[`${groupId}-${caseId}`]) continue;
			} else {
				// Group Mode Logic
				const caseState = groupCaseStates[caseId];
				const caseTrainState = caseState.trainState;
				if (!trainStateSelection[caseTrainState]) continue;
			}

			if (trainSideSelection.right) candidates.push({ groupId, caseId, side: 'right' });
			if (trainSideSelection.left) candidates.push({ groupId, caseId, side: 'left' });
		}
	}

	if (candidates.length === 0) return result;

	// Calculate weights
	let weights: number[] = new Array(candidates.length).fill(1);

	// Apply Smart Frequency ONLY if in 'smart' mode
	if (frequencyMode === 'smart' && (trainSmartFrequencySolved || trainSmartFrequencyTime)) {
		// Pre-calculate stats for candidates
		const candidateStats = candidates.map((c) => {
			const caseSolves = statisticsState.statistics.filter(
				(s) => s.groupId === c.groupId && s.caseId === c.caseId && s.side === c.side
			);
			return {
				solveCount: caseSolves.length,
				solves: caseSolves
			};
		});

		// 1. Solve Count Frequency
		let solveWeights = new Array(candidates.length).fill(1);
		if (trainSmartFrequencySolved) {
			const maxSolves = Math.max(...candidateStats.map((s) => s.solveCount));
			solveWeights = candidateStats.map((s) => {
				const solveDeficit = maxSolves - s.solveCount;
				// Every 3 solves difference adds 1 to weight, max 3 total
				return 1 + Math.min(2, solveDeficit / 3);
			});
		}

		// 2. Time Frequency
		let timeWeights = new Array(candidates.length).fill(1);
		if (trainSmartFrequencyTime) {
			// Calculate average time of the SELECTED candidates
			const candidateAvgTimes = candidateStats
				.map((s) => {
					const recentSolves = s.solves
						.filter((solve) => solve.time !== null && solve.time !== undefined)
						.slice(-5);
					if (recentSolves.length === 0) return null;
					return recentSolves.reduce((a, b) => a + (b.time ?? 0), 0) / recentSolves.length;
				})
				.filter((t): t is number => t !== null);

			const overallAvgTime =
				candidateAvgTimes.length > 0
					? candidateAvgTimes.reduce((a, b) => a + b, 0) / candidateAvgTimes.length
					: 0;

			timeWeights = candidateStats.map((s) => {
				if (s.solves.length === 0) return 1;

				const recentSolves = s.solves
					.filter((solve) => solve.time !== null && solve.time !== undefined)
					.slice(-5);

				if (recentSolves.length === 0) return 1;

				const caseAvgTime =
					recentSolves.reduce((a, b) => a + (b.time ?? 0), 0) / recentSolves.length;

				// Every 1 second (100 cs) slower than average adds 1 to weight
				return 1 + Math.min(2, Math.max(0, caseAvgTime - overallAvgTime) / 100);
			});
		}

		// Combine weights
		weights = solveWeights.map((sw, i) => {
			const tw = timeWeights[i];
			// Max of the two weights, capped at 3
			return Math.min(3, Math.max(sw, tw));
		});

		console.group('Smart Frequency Calculation');
		console.log('Candidates:', candidates.length);
		console.table(
			candidates.map((c, i) => {
				const timedSolves = candidateStats[i].solves.filter(
					(s) => s.time !== null && s.time !== undefined
				);
				return {
					case: `${c.groupId}-${c.caseId} (${c.side})`,
					solves: candidateStats[i].solveCount,
					avgTime:
						timedSolves.length > 0
							? (timedSolves.reduce((a, b) => a + (b.time ?? 0), 0) / timedSolves.length).toFixed(0)
							: 'N/A',
					solveWeight: solveWeights[i].toFixed(2),
					timeWeight: timeWeights[i].toFixed(2),
					finalWeight: weights[i].toFixed(2),
					count: Math.round(weights[i])
				};
			})
		);
		console.groupEnd();
	} else if (frequencyMode === 'recap') {
		// Recap Mode: Keep weights at 1. ensuring uniform distribution.
		// We might want to ensure we don't pick random scrambles if we want to cycle through them?
		// But "recap" usually just means "review these cases".
		// Since we shuffle at the end, standard weight=1 means 1 occurrence of each candidate per generation cycle.
		// That fits "Recap" well.
	}

	// Generate result array based on weights
	for (let i = 0; i < candidates.length; i++) {
		const candidate = candidates[i];
		const weight = Math.round(weights[i]);

		for (let k = 0; k < weight; k++) {
			result.push(
				new TrainCase(candidate.groupId, candidate.caseId, candidate.side, crossColor, frontColor)
			);
		}
	}

	console.log(`Generated ${result.length} cases from ${candidates.length} unique candidates.`);

	shuffleArray(result);
	return result;
}

export default class TrainCase {
	#groupId: GroupId;
	#caseId: number;
	#side: Side;
	#crossColor: StickerColor;
	#frontColor: StickerColor;
	#stickerHidden: StickerHidden;
	#scrambleSelection: number;
	#auf: Auf;
	#solved: boolean = false;
	#time: number | null | undefined = undefined;
	#solveId: string | undefined = undefined;

	constructor(
		groupId: GroupId,
		caseId: number,
		side: Side,
		crossColors: StickerColor[],
		frontColors: StickerColor[],
		options?: {
			scrambleSelection?: number;
			auf?: Auf;
			solveId?: string;
			time?: number | null;
		}
	) {
		this.#groupId = groupId;
		this.#caseId = caseId;
		this.#side = side;
		this.#crossColor = 'white';
		this.#frontColor = 'red';
		this.#scrambleSelection = 0;
		this.#auf = '';

		this.#stickerHidden = casesStatic[groupId][caseId].pieceToHide;

		if (options?.scrambleSelection !== undefined) {
			this.#scrambleSelection = options.scrambleSelection;
		} else {
			this.setRandomScramble();
		}

		if (options?.auf !== undefined) {
			this.#auf = options.auf;
		} else {
			this.setAuf();
		}

		if (options?.solveId !== undefined) {
			this.#solveId = options.solveId;
		}

		if (options?.time !== undefined) {
			this.#time = options.time;
		}

		this.setCrossAndFrontColor(crossColors, frontColors);
	}

	static fromSolve(
		solve: Solve,
		crossColors: StickerColor[] = ['white'],
		frontColors: StickerColor[] = ['red']
	): TrainCase {
		return new TrainCase(solve.groupId, solve.caseId, solve.side, crossColors, frontColors, {
			scrambleSelection: solve.scrambleSelection,
			auf: solve.auf,
			solveId: solve.id,
			time: solve.time // Time is already in centiseconds, no conversion needed
		});
	}

	private setRandomScramble() {
		const staticData = casesStatic[this.#groupId][this.#caseId];
		const scramblePool = getCaseScramblePool(staticData);
		this.#scrambleSelection = Math.floor(Math.random() * scramblePool.length);
	}

	private setAuf() {
		if (globalState.trainAddAuf === false) return; // Do nothing if user selected no AUF

		const staticData = casesStatic[this.#groupId][this.#caseId];
		if (staticData.ignoreAUF) return; // Do nothing if case doesn't need AUF

		const aufIndex = Math.floor(Math.random() * AUF.length);
		this.#auf = AUF[aufIndex];
	}

	private setCrossAndFrontColor(crossColors: StickerColor[], frontColors: StickerColor[]) {
		// Generate all valid pairs
		const validPairs: [StickerColor, StickerColor][] = [];

		for (const cross of crossColors) {
			// If frontColors is empty, consider ALL valid neighbors
			const potentialFrontColors =
				frontColors.length > 0 ? frontColors : (Object.keys(SIDE_COLOR[cross]) as StickerColor[]);

			for (const front of potentialFrontColors) {
				if (cross !== front && OPPOSITE_COLOR[cross] !== front) {
					validPairs.push([cross, front]);
				}
			}
		}

		if (validPairs.length > 0) {
			// Pick a random valid pair
			const [selectedCross, selectedFront] =
				validPairs[Math.floor(Math.random() * validPairs.length)];
			this.#crossColor = selectedCross;
			this.#frontColor = selectedFront;
		} else {
			// Fallback (should be prevented by validation)
			this.#crossColor = 'white';
			this.#frontColor = 'red';
		}
	}

	get groupId() {
		return this.#groupId;
	}
	get caseId() {
		return this.#caseId;
	}
	get side() {
		return this.#side;
	}
	get crossColor() {
		return this.#crossColor;
	}
	get frontColor() {
		return this.#frontColor;
	}
	get stickerHidden() {
		return this.#stickerHidden;
	}
	get scramble() {
		return this.#scrambleSelection;
	}
	get auf() {
		return this.#auf;
	}
	get solved() {
		return this.#solved;
	}
	set solved(value: boolean) {
		this.#solved = value;
	}
	get time() {
		return this.#time;
	}
	set time(value: number | null | undefined) {
		this.#time = value;
	}
	get solveId() {
		return this.#solveId;
	}
	set solveId(value: string | undefined) {
		this.#solveId = value;
	}
}
