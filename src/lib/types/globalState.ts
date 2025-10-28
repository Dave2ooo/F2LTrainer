import type { StickerColor, StickerColorsWithRandom } from "./stickering";
import type { GroupId } from "./group";
import type { TrainState } from "./caseState";
import type { Side } from "./casesStatic";

export type View = "select" | "train";

export type HintAlgorithm = "step" | "allAtOnce" | "always";
export type HintStickering = "f2l" | "fully";

export interface GlobalState {
    crossColor: StickerColorsWithRandom,
    frontColor: StickerColorsWithRandom,
    categoriesOpenedObj: Record<GroupId, boolean[]>,
    view: View,
    selectedGroup: GroupId
    trainStateSelection: Record<TrainState, boolean>,
    trainGroupSelection: Record<GroupId, boolean>,
    trainSideSelection: Record<Side, boolean>,
    trainAddAuf: boolean,
    trainHintShowCube: boolean,
    trainHintAlgorithm: HintAlgorithm,
    trainHintStickering: HintStickering,
	playOnAlgChange: boolean,
}
