// learningState.ts
export const LearningState = {
    unlearned: 0,
    learning: 1,
    learned: 2,
} as const;

export type LearningState = typeof LearningState[keyof typeof LearningState];

export const LEARNING_STATE_COUNT = 3;

export const LearningStateColors: Record<LearningState, string> = {
    [LearningState.unlearned]: "rgba(0, 0, 0, 0)",
    [LearningState.learning]: "rgb(236 236 0)",
    [LearningState.learned]: "rgb(0, 223, 0)",
};
