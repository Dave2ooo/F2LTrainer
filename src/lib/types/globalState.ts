import type { GroupId } from './group';

export type View = 'select' | 'train';

export type HintAlgorithm = 'step' | 'allAtOnce' | 'always';
export type HintStickering = 'f2l' | 'fully';

export interface GlobalState {
	categoriesOpenedObj: Record<GroupId, boolean[]>;
	view: View;
	selectedGroup: GroupId;
	playOnAlgChange: boolean;
	showDetails: boolean;
	trainHideTwistyPlayer: boolean;
	hasUsedTimer: boolean;
	hasUsedTwistyPlayer: boolean;
	hasClickedCaseCard: boolean;
	rightPaneOpen: boolean;
}
