import type { StickerColor } from './stickering';
import type { GroupId } from './group';
import type { TrainState } from './caseState';
import type { Side } from '$lib/types/Side';

export type View = 'select' | 'train';

export type HintAlgorithm = 'step' | 'allAtOnce' | 'always';
export type HintStickering = 'f2l' | 'fully';

export interface GlobalState {
	crossColor: StickerColor[];
	frontColor: StickerColor[];
	categoriesOpenedObj: Record<GroupId, boolean[]>;
	view: View;
	selectedGroup: GroupId;
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<GroupId, boolean>;
	trainSideSelection: Record<Side, boolean>;
	trainAddAuf: boolean;
	trainHintAlgorithm: HintAlgorithm;
	trainHintStickering: HintStickering;
	playOnAlgChange: boolean;
	showDetails: boolean;
	trainHideTwistyPlayer: boolean;
	trainShowTimer: boolean;
	hasUsedTimer: boolean;
	hasUsedTwistyPlayer: boolean;
	hasClickedCaseCard: boolean;
}
