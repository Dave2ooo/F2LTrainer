import type { TrainState } from "./group";

export interface CaseState {
    status: TrainState;
    algorithmSelection: { left: number; right: number };
    customAlgorithm: { left: string; right: string };
    identicalAlgorithm: boolean;
    mirrored: boolean;
    solveCount: number;
}
