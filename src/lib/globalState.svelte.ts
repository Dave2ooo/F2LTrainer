import type { GlobalState } from "$lib/types/globalState"
import type { StickerHidden } from "./types/stickering"
import { GROUP_ALGORITHMS, GROUP_SCRAMBLES } from "./data"
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group"

const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
    Object.fromEntries(
        GROUP_IDS.map((groupId) => [
            groupId,
            GROUP_DEFINITIONS[groupId].categories.map(() => false),
        ]),
    ) as Record<GroupId, boolean[]>

export const globalState: GlobalState = $state({
    crossColor: "white",
    frontColor: "red",
    collapsedCategories: createCollapsedCategories(),
})
