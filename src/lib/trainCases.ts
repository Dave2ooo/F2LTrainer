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
	#time: number | undefined = undefined;

	constructor(
		groupId: GroupId,
		caseId: number,
		side: Side,
		crossColor: StickerColor | 'random',
		frontColor: StickerColor | 'random'
	) {
		this.#groupId = groupId;
		this.#caseId = caseId;
		this.#side = side;
		this.#crossColor = 'white';
		this.#frontColor = 'red';
		this.#scrambleSelection = 0;
		this.#auf = '';

		this.#stickerHidden = casesStatic[groupId][caseId].pieceToHide;

		this.setRandomScramble();
		this.setAuf();
		this.setCrossAndFrontColor(crossColor, frontColor);
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
		crossColor: StickerColor | 'random',
		frontColor: StickerColor | 'random'
	) {
		if (crossColor === 'random' && frontColor !== 'random') {
			// If front color is specific but cross color is random,
			// we need to find a valid cross color that works with the specified front color
			const validCrossColors = STICKER_COLORS.filter((color) => {
				return SIDE_COLOR[color]?.[frontColor] !== undefined;
			});

			if (validCrossColors.length > 0) {
				this.#crossColor = validCrossColors[Math.floor(Math.random() * validCrossColors.length)];
				this.#frontColor = frontColor;
			} else {
				// If no valid combination found (shouldn't happen with correct color names)
				this.#crossColor = 'white';
				this.#frontColor = 'red';
			}
		} else {
			// Set cross color first if it's not random or if front color is also random
			this.#crossColor =
				crossColor === 'random'
					? STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)]
					: crossColor;

			// Then set front color
			if (frontColor === 'random') {
				// Get valid colors that work with the selected cross color
				const validColors = STICKER_COLORS.filter((color) => {
					return SIDE_COLOR[this.#crossColor]?.[color] !== undefined;
				});

				if (validColors.length > 0) {
					this.#frontColor = validColors[Math.floor(Math.random() * validColors.length)];
				} else {
					// Fallback to a safe default if no valid colors found
					this.#frontColor = 'red';
					if (this.#crossColor === 'red' || this.#crossColor === OPPOSITE_COLOR['red']) {
						this.#frontColor = 'blue';
					}
				}
			} else {
				// If specific front color requested, verify it's valid
				const sideColorEntry = SIDE_COLOR[this.#crossColor]?.[frontColor];
				if (sideColorEntry !== undefined) {
					this.#frontColor = frontColor;
				} else {
					// If not valid with current cross color, fall back to a safe default
					this.#frontColor = 'red';
					if (this.#crossColor === 'red' || this.#crossColor === OPPOSITE_COLOR['red']) {
						this.#frontColor = 'blue';
					}
				}
			}
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
	set time(value: number | undefined) {
		this.#time = value;
	}
}
