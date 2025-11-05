
export type TrainState = 'unlearned' | 'learning' | 'finished';
export const TRAIN_STATES: readonly TrainState[] = ['unlearned', 'learning', 'finished'];

export interface AlgorithmSelection {
	left: number | null;
	right: number | null;
}
export interface CustomAlgorithm {
	left: string;
	right: string;
}
export interface CaseState {
	trainState: TrainState;
	algorithmSelection: AlgorithmSelection;
	customAlgorithm: CustomAlgorithm;
	identicalAlgorithm: boolean;
	solveCount: number;
}
