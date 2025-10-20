import TrainCase, { gernerateTrainCases } from "./trainCases";

export let trainCaseQueue: TrainCase[] = [];

function createInitialTrainCase(): TrainCase {
    trainCaseQueue = gernerateTrainCases();
    // If no train cases were generated, throw a clear error or return a fallback.
    if (trainCaseQueue.length === 0) {
        console.warn("createInitialTrainCase found no train cases");
        console.log("trainCaseQueue", trainCaseQueue)
    }
    return trainCaseQueue[0];
}

// Export a single $state object — mutate its properties instead of reassigning the variable.
export const trainState: { index: number; current: TrainCase } = $state({
    index: 0,
    current: createInitialTrainCase(),
});

export function regenerateTrainCaseQueue() {
    trainCaseQueue = gernerateTrainCases();
    trainState.index = 0;
    if (trainCaseQueue.length > 0) {
        trainState.current = trainCaseQueue[0];
    } else {
        // keep current unchanged or set to a known fallback
        console.warn("regenerateTrainCaseQueue produced no cases");
    }
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