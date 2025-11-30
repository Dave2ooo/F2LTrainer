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

import type { Solve } from './types/statisticsState';

export function gernerateTrainCases(): TrainCase[] {
	console.log('gernerateTrainCases() called');
	const result: TrainCase[] = [];

	const trainGroupSelection = globalState.trainGroupSelection;
	const trainStateSelection = globalState.trainStateSelection;
	const trainSideSelection = globalState.trainSideSelection;
	// console.log("trainGroupSelection", trainGroupSelection, "trainStateSelection", trainStateSelection, "trainSideSelection", trainSideSelection);

	const crossColor = globalState.crossColor;
	const frontColor = globalState.frontColor;

	for (const groupId of Object.keys(GROUP_DEFINITIONS) as GroupId[]) {
		// 1. check if this group is selected
		if (!trainGroupSelection[groupId]) {
			// console.log("groupId", groupId, "not selected");
			continue;
		}

		const groupCaseStates = casesState[groupId];

		for (const caseIdStr of Object.keys(groupCaseStates)) {
			const caseId = Number(caseIdStr);
			// console.log("groupId", groupId, "caseId", caseId);
			if (Number.isNaN(caseId)) continue;

			const caseState = groupCaseStates[caseId];
			const caseTrainState = caseState.trainState;

			if (!trainStateSelection[caseTrainState]) continue;

			// console.log("groupId", groupId, "caseId", caseId);
			if (trainSideSelection.right)
				result.push(new TrainCase(groupId, caseId, 'right', crossColor, frontColor));
			if (trainSideSelection.left)
				result.push(new TrainCase(groupId, caseId, 'left', crossColor, frontColor));
			// console.log("result temp", result);
		}
	}
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
	#solveId: number | undefined = undefined;

	constructor(
		groupId: GroupId,
		caseId: number,
		side: Side,
		crossColors: StickerColor[],
		frontColors: StickerColor[],
		options?: {
			scrambleSelection?: number;
			auf?: Auf;
			solveId?: number;
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

	private setCrossAndFrontColor(
		crossColors: StickerColor[],
		frontColors: StickerColor[]
	) {
		// Generate all valid pairs
		const validPairs: [StickerColor, StickerColor][] = [];

		for (const cross of crossColors) {
			// If frontColors is empty, consider ALL valid neighbors
			const potentialFrontColors =
				frontColors.length > 0
					? frontColors
					: (Object.keys(SIDE_COLOR[cross]) as StickerColor[]);

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
	set solveId(value: number | undefined) {
		this.#solveId = value;
	}
}
