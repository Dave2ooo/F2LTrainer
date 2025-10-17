import type { StickerColor } from "./stickering";
import type { GroupId } from "./group";

export interface GlobalState {
    crossColor: StickerColor,
    frontColor: StickerColor,
    collapsedCategories: Record<GroupId, boolean[]>,
}
