import TrainCase, { gernerateTrainCases } from "./trainCases";

export const trainCaseQueue = gernerateTrainCases();

function createInitialTrainCase(): TrainCase | null {
    return trainCaseQueue.length > 0 ? trainCaseQueue[0] : null;
}

// Export a single $state object — mutate its properties instead of reassigning the variable.
export const trainState = $state({
    index: 0,
    current: createInitialTrainCase() as TrainCase | null,
});

export function advanceToNextTrainCase() {
    const next = trainState.index + 1;
    // bounds-check
    if (next > trainCaseQueue.length) {
        const newTrainCases = gernerateTrainCases();
        if (newTrainCases.length > 0) {
            trainCaseQueue.push(...newTrainCases);
        }
    }
    trainState.index = next;                 // mutate property — OK
    trainState.current = trainCaseQueue[next]; // mutate property — OK
}



// import TrainCase, { gernerateTrainCases } from "./trainCases";


// export const trainCaseQueue = gernerateTrainCases();

// function createInitialTrainCase() {
//     return trainCaseQueue.length > 0 ? trainCaseQueue[0] : null;
// }

// export let currentTrainIndex: number = 0;
// export let currentTrainCase: TrainCase | null = $state(createInitialTrainCase());

// export function advanceToNextTrainCase() {
//     currentTrainIndex++;
//     currentTrainCase = trainCaseQueue[currentTrainIndex];
// }

// class TrainCaseQueue {
//     #trainCaseQueue: TrainCase[];

//     constructor() {
//         this.#trainCaseQueue = gernerateTrainCases();
//     }

//     public getCurrentTrainCase(): TrainCase {
//         if (currentTrainIndex >= this.#trainCaseQueue.length) { }
//         return this.#trainCaseQueue[currentTrainIndex];
//     }

//     public getNextTrainCase(): TrainCase | undefined {
//         // Ensure there's at least one train case available
//         if (this.#trainCaseQueue.length === 0) {
//             this.generateNewTrainCases();
//             if (this.#trainCaseQueue.length === 0) return undefined;
//         }

//         // advance index
//         currentTrainIndex++;

//         // if we've passed the end, try to generate more and clamp if still out of range
//         if (currentTrainIndex >= this.#trainCaseQueue.length) {
//             this.generateNewTrainCases();
//             if (currentTrainIndex >= this.#trainCaseQueue.length) {
//                 currentTrainIndex = this.#trainCaseQueue.length - 1;
//             }
//         }

//         return this.#trainCaseQueue[currentTrainIndex];
//     }

//     generateNewTrainCases() {
//         const newTrainCases = gernerateTrainCases();
//         if (newTrainCases.length > 0) {
//             this.#trainCaseQueue.push(...newTrainCases);
//         }
//     }

//     public resetQueue() {
//         this.#trainCaseQueue = gernerateTrainCases();
//         currentTrainIndex = 0;
//     }
// }

// export const trainCaseQueue = new TrainCaseQueue();