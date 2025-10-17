import type { GlobalState } from "$lib/types/globalState"
import { GROUP_ALGORITHMS, GROUP_SCRAMBLES } from "./data"
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from "./types/group"


export const globalState: GlobalState = $state({
    crossColor: "white",
    frontColor: "red",
})

export interface CaseStatic {
    groupId: GroupId
    caseId: number
    algPool: string[]
    scramblePool: string[]
}
