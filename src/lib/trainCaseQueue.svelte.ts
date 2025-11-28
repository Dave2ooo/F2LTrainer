export function getNumberOfSelectedCasesFromSelections(
	trainGroupSelection: Record<string, boolean>,
	trainStateSelection: Record<string, boolean>
): number {
	let count = 0;
	for (const groupId of Object.keys(GROUP_DEFINITIONS) as GroupId[]) {
		if (!trainGroupSelection[groupId]) continue;
		const groupCaseStates = casesState[groupId];
		for (const caseIdStr of Object.keys(groupCaseStates)) {
			const caseId = Number(caseIdStr);
			if (Number.isNaN(caseId)) continue;
			const caseState = groupCaseStates[caseId];
			const caseTrainState = caseState.trainState;
			// Optionally, filter by side if needed (not present in original logic)
			if (trainStateSelection[caseTrainState]) count++;
		}
	}
	return count;
}
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

import { statistics } from '$lib/statisticsState.svelte';

export function advanceToPreviousTrainCase() {
	const prev = trainState.index - 1;
	if (prev >= 0) {
		trainState.index = prev;
		trainState.current = trainCaseQueue[trainState.index];
	} else {
		// We are at the start of the queue (index 0)
		// Try to load previous solve from history
		const currentCase = trainState.current;
		if (!currentCase) return;

		let previousSolveIndex = -1;

		if (currentCase.solveId !== undefined) {
			// Find the current solve in statistics
			const currentSolveIndex = statistics.findIndex((s) => s.id === currentCase.solveId);
			if (currentSolveIndex > 0) {
				previousSolveIndex = currentSolveIndex - 1;
			}
		} else {
			// Current case is new (not solved yet), so previous is the last one in statistics
			if (statistics.length > 0) {
				previousSolveIndex = statistics.length - 1;
			}
		}

		if (previousSolveIndex !== -1) {
			const previousSolve = statistics[previousSolveIndex];
			// Create a TrainCase from the solve
			// Use current global colors as we don't store colors in history
			const newCase = TrainCase.fromSolve(
				previousSolve,
				globalState.crossColor,
				globalState.frontColor
			);
			
			// Prepend to queue
			trainCaseQueue.unshift(newCase);
			
			// Index stays 0, but current updates to the new head
			trainState.index = 0;
			trainState.current = newCase;
			
			// console.log('Loaded previous solve from history:', previousSolve.id);
		} else {
			// No history available
			trainState.index = 0;
		}
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
