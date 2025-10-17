import type { CaseStatic, Side } from "./casesStatic";
import type { TrainState } from "./group";

export interface CaseState {
    status: TrainState;
    algorithmSelection: { left: number | null; right: number | null };
    customAlgorithm: { left: string; right: string };
    identicalAlgorithm: boolean;
    mirrored: boolean;
    solveCount: number;
}

export function getCaseAlg(staticData: CaseStatic, caseState: CaseState, side: Side ){
    const algorithmSelection = caseState.algorithmSelection[side];
    const customAlgorithm = caseState.customAlgorithm[side];

    if (algorithmSelection === null) return customAlgorithm

    const algorithmPool = staticData.algPool;

    return algorithmPool[algorithmSelection];
}

export function getCaseName(staticData: CaseStatic) {
    return staticData.caseName || staticData.caseId.toString();
}