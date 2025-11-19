import type { StickerColor } from './stickering';
import type { GroupId } from './group';
import type { TrainState } from './caseState';
import type { Side } from '$lib/types/Side';

export type View = 'select' | 'train';

export type HintAlgorithm = 'step' | 'allAtOnce' | 'always';
export type HintStickering = 'f2l' | 'fully';

export interface GlobalState {
	crossColor: StickerColor | 'random';
	frontColor: StickerColor | 'random';
	categoriesOpenedObj: Record<GroupId, boolean[]>;
	view: View;
	selectedGroup: GroupId;
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<GroupId, boolean>;
	trainSideSelection: Record<Side, boolean>;
	trainAddAuf: boolean;
	trainHintShowCube: boolean;
	trainHintAlgorithm: HintAlgorithm;
	trainHintStickering: HintStickering;
	playOnAlgChange: boolean;
	showDetails: boolean;
	trainHideTwistyPlayer: boolean;
}
