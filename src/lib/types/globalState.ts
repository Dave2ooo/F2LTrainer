import type { StickerColor } from "./stickering";
import type { GroupId } from "./group";
import type { TrainState } from "./caseState";
import type { Side } from "./casesStatic";

export type View = "select" | "train";

export interface GlobalState {
    crossColor: StickerColor,
    frontColor: StickerColor,
    categoriesOpenedObj: Record<GroupId, boolean[]>,
    view: View,
    selectedGroup: GroupId
    trainStateSelection: Record<TrainState, boolean>,
    trainGroupSelection: Record<GroupId, boolean>,
    trainSideSelection : Record<Side, boolean>,
}
