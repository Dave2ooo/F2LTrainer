import type { TrainState } from './caseState';
import type { GroupId } from './group';

export type TrainSettings = {
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<TrainState, boolean>;
	trainSideSelection: Record<TrainState, boolean>;
	crossColor: StickerColor | 'random';
	frontColor: StickerColor | 'random';
	trainState: Record<GroupId, Record<number, TrainState>>;
};
