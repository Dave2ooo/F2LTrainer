import type { GlobalState } from "$lib/types/globalState"
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group"
import { loadFromLocalStorage } from "./utils/localStorage"

export const GLOBAL_STATE_STORAGE_KEY = "globalState"

const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
    Object.fromEntries(
        GROUP_IDS.map((groupId) => [
            groupId,
            GROUP_DEFINITIONS[groupId].categories.map(() => true),
        ]),
    ) as Record<GroupId, boolean[]>

const createDefaultGlobalState = (): GlobalState => ({
    crossColor: "white",
    frontColor: "red",
    categoriesOpenedObj: createCollapsedCategories(),
    view: "select",
    selectedGroup: "basic",
    trainStateSelection: { unlearned: false, learning: true, finished: false },
    trainGroupSelection: { basic: true, basicBack: true, advanced: true, expert: true },
    trainSideSelection: { left: true, right: true },
    trainAddAuf: true,
    trainHintShowCube: true,
    trainHintAlgorithm: "step",
    trainHintStickering: "f2l",
    playOnAlgChange: true,
})

export const globalState: GlobalState = $state(createDefaultGlobalState())

const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY)

if (persistedGlobalState) {
    Object.assign(globalState, persistedGlobalState)
}