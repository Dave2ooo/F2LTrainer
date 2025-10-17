import type { GlobalState } from "$lib/types/globalState"
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group"
import { loadFromLocalStorage } from "./utils/localStorage"

export const GLOBAL_STATE_STORAGE_KEY = "globalState"

const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
    Object.fromEntries(
        GROUP_IDS.map((groupId) => [
            groupId,
            GROUP_DEFINITIONS[groupId].categories.map(() => false),
        ]),
    ) as Record<GroupId, boolean[]>

const createDefaultGlobalState = (): GlobalState => ({
    crossColor: "white",
    frontColor: "red",
    collapsedCategories: createCollapsedCategories(),
})

export const globalState: GlobalState = $state(createDefaultGlobalState())

const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY)

if (persistedGlobalState) {
    Object.assign(globalState, persistedGlobalState)
}

