import type { GlobalState } from "$lib/types/globalState"
import { browser } from "$app/environment"
import { loadFromLocalStorage, saveToLocalStorage } from "./utils/localStorage"

const GLOBAL_STATE_STORAGE_KEY = "globalState"

const createDefaultGlobalState = (): GlobalState => ({
    crossColor: "white",
    frontColor: "red",
})

export const globalState: GlobalState = $state(createDefaultGlobalState())

const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY)

if (persistedGlobalState) {
    Object.assign(globalState, persistedGlobalState)
}

if (browser) {
    $effect(() => {
        saveToLocalStorage(GLOBAL_STATE_STORAGE_KEY, globalState)
    })
}
