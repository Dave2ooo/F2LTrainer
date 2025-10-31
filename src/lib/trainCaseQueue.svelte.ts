import type { n } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';
import { casesState } from './casesState.svelte';
import { globalState } from './globalState.svelte';
import TrainCase, { gernerateTrainCases } from './trainCases';
import { GROUP_DEFINITIONS, type GroupId } from './types/group';

export let trainCaseQueue: TrainCase[] = [];

function createInitialTrainCase(): TrainCase | undefined {
	trainCaseQueue = gernerateTrainCases();
	// If no train cases were generated, throw a clear error or return a fallback.
	if (trainCaseQueue.length === 0) {
		console.warn('createInitialTrainCase found no train cases');
		console.log('trainCaseQueue', trainCaseQueue);
		return undefined;
	}
	return trainCaseQueue[0];
}

// Export a single $state object — mutate its properties instead of reassigning the variable.
export const trainState: { index: number; current: TrainCase | undefined } = $state({
	index: 0,
	current: createInitialTrainCase()
});

export function regenerateTrainCaseQueue(): number {
	trainCaseQueue = gernerateTrainCases();
	trainState.index = 0;
	if (trainCaseQueue.length > 0) {
		trainState.current = trainCaseQueue[0];
	} else {
		// keep current unchanged or set to a known fallback
		console.warn('regenerateTrainCaseQueue produced no cases');
	}
	return trainCaseQueue.length;
}

export function advanceToNextTrainCase() {
	const next = trainState.index + 1;
	if (next >= trainCaseQueue.length) {
		const newTrainCases = gernerateTrainCases();
		if (newTrainCases.length > 0) {
			trainCaseQueue.push(...newTrainCases);
			trainState.index = next;
		} else {
			// No further cases; clamp to last valid index
			trainState.index = Math.max(0, trainCaseQueue.length - 1);
			return;
		}
	} else {
		trainState.index = next;
	}
	trainState.current = trainCaseQueue[trainState.index];
}

export function advanceToPreviousTrainCase() {
	const prev = trainState.index - 1;
	if (prev >= 0) {
		trainState.index = prev;
		trainState.current = trainCaseQueue[trainState.index];
	} else {
		// already at start, no-op
		trainState.index = 0;
	}
}

export function getNumberOfSelectedCases(): number {
	let count = 0;

	const trainGroupSelection = globalState.trainGroupSelection;
	const trainStateSelection = globalState.trainStateSelection;
	const trainSideSelection = globalState.trainSideSelection;

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

			if (trainStateSelection[caseTrainState]) count++;
		}
	}
	return count;
}
