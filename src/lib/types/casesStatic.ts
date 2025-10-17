import type { GroupId } from "./group"
import type { StickerHidden } from "./stickering"

export interface CaseStatic {
    groupId: GroupId
    caseId: number
    algPool: string[]
    scramblePool: string[]
    categoryName: string | undefined
    categoryIndex: number | undefined
    groupName: string
    ignoreAUF: boolean
    pieceToHide: StickerHidden
    caseName: string | undefined
}
