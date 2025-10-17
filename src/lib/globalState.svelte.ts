import type { GlobalState } from "$lib/types/globalState"
import { loadFromLocalStorage } from "./utils/localStorage"

export const GLOBAL_STATE_STORAGE_KEY = "globalState"

const createDefaultGlobalState = (): GlobalState => ({
    crossColor: "white",
    frontColor: "red",
})

export const globalState: GlobalState = $state(createDefaultGlobalState())

const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY)

if (persistedGlobalState) {
    Object.assign(globalState, persistedGlobalState)
}

