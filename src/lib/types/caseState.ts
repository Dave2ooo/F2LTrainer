import type { GroupId } from "./group";

export type TrainState = "unlearned" | "learning" | "finished";
export const TRAIN_STATES: readonly TrainState[] = ["unlearned", "learning", "finished"];

export interface CaseState {
    trainState: TrainState;
    algorithmSelection: { left: number | null; right: number | null };
    customAlgorithm: { left: string; right: string };
    identicalAlgorithm: boolean;
    // mirrored: boolean;
    solveCount: number;
}
