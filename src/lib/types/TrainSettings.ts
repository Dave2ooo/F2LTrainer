import type { TrainState } from './caseState';
import type { GroupId } from './group';
import type { StickerColorsWithRandom } from './stickering';

export type TrainSettings = {
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<TrainState, boolean>;
	trainSideSelection: Record<TrainState, boolean>;
	crossColor: StickerColorsWithRandom;
	frontColor: StickerColorsWithRandom;
	trainState: Record<GroupId, Record<number, TrainState>>;
};
