import type { StickerColor } from "./stickering";
import type { GroupId } from "./group";

export type View = "select" | "train";

export interface GlobalState {
    crossColor: StickerColor,
    frontColor: StickerColor,
    categoriesOpenedObj: Record<GroupId, boolean[]>,
    view: View,
    selectedGroup: GroupId
}
