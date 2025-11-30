import type { TrainState } from './caseState';
import type { GroupId } from './group';
import type { Side } from './Side';
import type { StickerColor } from './stickering';

export type TrainSettings = {
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<GroupId, boolean>;
	trainSideSelection: Record<Side, boolean>;
	crossColor: StickerColor[];
	frontColor: StickerColor[];
	trainState: Record<GroupId, Record<number, TrainState>>;
};
