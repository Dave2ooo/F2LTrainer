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

export function jumpToSolve(solveId: number) {
	// 1. Check if the solve is already in the queue
	const queueIndex = trainCaseQueue.findIndex((c) => c.solveId === solveId);
	if (queueIndex !== -1) {
		trainState.index = queueIndex;
		trainState.current = trainCaseQueue[queueIndex];
		return;
	}

	// 2. If not in queue, find it in statistics
	const solveIndex = statistics.findIndex((s) => s.id === solveId);
	if (solveIndex === -1) {
		console.warn(`Solve with ID ${solveId} not found in statistics`);
		return;
	}

	// 3. We need to load this solve AND all solves between it and the current head of the queue (if any)
	// However, simply loading the target solve and prepending it is enough if we assume the user might not need the intermediate ones immediately,
	// BUT to maintain continuity if they hit "next", we should probably try to link it up.
	// Actually, the simplest robust approach for "jump" is:
	// Find the target solve.
	// Also find where the current head of the queue is in history.
	// If the current head is a new case (no solveId), then we are at the "latest" point.
	// If the current head has a solveId, we can find it in statistics.
	
	// Let's just load the target solve and prepend it. If the user goes "next", they might jump to the old head or we might need to fill the gap.
	// To keep it simple and consistent with `advanceToPreviousTrainCase`:
	// We will prepend the target solve.
	// BUT, if we just prepend one, `advanceToNext` might not work as expected if there's a gap.
	// Let's see: `advanceToNext` just increments index.
	// So if we have [TargetSolve, OldHead, ...], hitting next goes to OldHead.
	// This implies TargetSolve is immediately before OldHead in history.
	// If we jump way back, we might have [TargetSolve (id 100), OldHead (id 200)].
	// Hitting next would go from 100 to 200, skipping 101-199.
	// This might be acceptable, OR we should fill the gap.
	// Filling the gap seems better for a "history" view.
	
	// Find the solveId of the current head of the queue
	const headCase = trainCaseQueue[0];
	let headSolveIndex = -1;
	
	if (headCase && headCase.solveId !== undefined) {
		headSolveIndex = statistics.findIndex(s => s.id === headCase.solveId);
	} else {
		// Head is new, so it's "after" the last solve in statistics
		headSolveIndex = statistics.length;
	}

	// We want to load solves from solveIndex up to (but not including) headSolveIndex
	// statistics is ordered by time (oldest first? No, wait).
	// Let's check statisticsState.svelte.
	// Usually statistics are appended, so index 0 is oldest, length-1 is newest.
	// `advanceToPreviousTrainCase` takes `statistics.length - 1` as the "previous" to a new case.
	// So yes, higher index = newer.
	
	if (solveIndex < headSolveIndex) {
		// We need to add solves from solveIndex to headSolveIndex - 1
		// We want them in the queue in order: [Solve(solveIndex), Solve(solveIndex+1), ... Solve(headSolveIndex-1), OldHead]
		// So we need to prepend them in reverse order (or splice them in).
		
		const solvesToAdd = [];
		for (let i = solveIndex; i < headSolveIndex; i++) {
			solvesToAdd.push(statistics[i]);
		}
		
		// Convert to TrainCases
		const newCases = solvesToAdd.map(s => TrainCase.fromSolve(
			s,
			globalState.crossColor,
			globalState.frontColor
		));
		
		// Prepend to queue
		// We want the queue to look like: [Solve(solveIndex), ..., Solve(headSolveIndex-1), OldHead, ...]
		// So we unshift the whole block.
		trainCaseQueue.unshift(...newCases);
		
		// Set index to 0 (which is now Solve(solveIndex))
		trainState.index = 0;
		trainState.current = trainCaseQueue[0];
	} else {
		// The target solve is "newer" than the head? This shouldn't happen if we only jump backwards in history
		// unless the queue is somehow "behind" the latest stats (e.g. after a refresh?).
		// Or if we are jumping "forward" in history (which is just navigating the queue usually).
		// If it's not in the queue but is in statistics and is newer than head... that implies head is old history.
		// But we checked "if in queue" first.
		// If we are deep in history, say queue is [Solve(100), Solve(101)], and we jump to Solve(105).
		// Solve(105) should be in the queue if we navigated there?
		// Not necessarily if we cleared the queue or something.
		// But `trainCaseQueue` usually holds the "future" or "current session".
		// If we are browsing history, we are prepending.
		// So if we are at Solve(100) and want to go to Solve(105), it implies Solve(105) IS in the queue (at a higher index).
		// But we checked `findIndex` in queue.
		
		// If it's not in queue, but is newer than head... maybe we popped it off?
		// Or maybe we are in a state where queue only has old stuff?
		// Let's assume for now we just handle the "back in time" case which is the primary use case.
		console.warn("Target solve seems to be newer than queue head but not in queue. This is unexpected for history navigation.");
	}
}

export function jumpToFirstUnsolved() {
	const index = trainCaseQueue.findIndex((c) => c.solveId === undefined);
	if (index !== -1) {
		trainState.index = index;
		trainState.current = trainCaseQueue[index];
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
