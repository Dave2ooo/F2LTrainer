import type { CaseState } from "./caseState";

export type GroupId = "basic" | "basicBack" | "advanced" | "expert";
export const GROUP_IDS: readonly GroupId[] = ["basic", "basicBack", "advanced", "expert"];

export type CaseId = number; // 1-based, matches existing assets

export interface GroupState {
    cases: Record<CaseId, CaseState>;
    collapsedCategories: Record<number, boolean>;
}

// export interface GlobalState {
//     groups: Record<GroupId, GroupState>;
//     currentGroup: GroupId; // GroupId that is selected in selection view
//     trainStateSelection: Record<TrainState, boolean>;
//     trainGroupSelection: Record<GroupId, boolean>;
//     trainSideSelection: Record<"left" | "right", boolean>;
//     colorSelection: Record<"cross" | "front", string>;
// }

export interface GroupDefinition {
    readonly id: GroupId;
    readonly name: string;
    readonly editName: string;
    readonly numberCases: number;
    readonly categories: readonly { name: string; cases: readonly CaseId[] }[];
    readonly ignoreAUF?: readonly CaseId[];
    readonly caseNumberMapping?: Readonly<Record<CaseId, string>>;
    readonly piecesToHide?: readonly string[];
}


const BASIC_DEFINITION: GroupDefinition = {
    id: "basic",
    name: "Basic Cases",
    editName: "Basic",
    numberCases: 41,
    categories: [
        { name: "Basic Inserts", cases: [4, 3, 1, 2] },
        { name: "Pieces on Top / White facing Front / Edge oriented", cases: [5, 7, 15] },
        { name: "Pieces on Top / White facing Front / Edge unoriented", cases: [9, 11, 13] },
        { name: "Pieces on Top / White facing Side / Edge oriented", cases: [10, 12, 14] },
        { name: "Pieces on Top / white facing Side / Edge unoriented", cases: [6, 8, 16] },
        { name: "Pieces on Top / White facing Up / Edge oriented", cases: [17, 19, 21, 23] },
        { name: "Pieces on Top / White facing Up / Edge unoriented", cases: [18, 20, 22, 24] },
        { name: "Edge solved", cases: [32, 33, 34, 38, 39] },
        { name: "Edge flipped", cases: [31, 35, 36, 40, 41, 37] },
        { name: "Corner on Bottom / Edge on Top / Edge oriented", cases: [27, 30, 25] },
        { name: "Corner on Bottom / Edge on Top / Edge unoriented", cases: [29, 28, 26] },
    ],
    ignoreAUF: [37, 38, 39, 40, 41],
} as const;

const BASIC_BACK_DEFINITION: GroupDefinition = {
    id: "basicBack",
    name: "Basic Backslot",
    editName: "Basic Backslot",
    numberCases: 41,
    categories: [
        { name: "Basic Inserts", cases: [4, 3, 1, 2] },
        { name: "Pieces on Top / White facing Back / Edge oriented", cases: [6, 8, 16] },
        { name: "Pieces on Top / White facing Back / Edge unoriented", cases: [10, 12, 14] },
        { name: "Pieces on Top / White facing Side / Edge oriented", cases: [9, 11, 13] },
        { name: "Pieces on Top / white facing Side / Edge unoriented", cases: [5, 7, 15] },
        { name: "Pieces on Top / White facing Up / Edge oriented", cases: [18, 20, 22, 24] },
        { name: "Pieces on Top / White facing Up / Edge unoriented", cases: [17, 19, 21, 23] },
        { name: "Edge solved", cases: [32, 34, 33, 39, 38] },
        { name: "Edge flipped", cases: [31, 36, 35, 41, 40, 37] },
        { name: "Corner on Bottom / Edge on Top / Edge oriented", cases: [28, 29, 26] },
        { name: "Corner on Bottom / Edge on Top / Edge unoriented", cases: [30, 27, 25] },
    ],
    ignoreAUF: [37, 38, 39, 40, 41],
} as const;

const ADVANCED_DEFINITION: GroupDefinition = {
    id: "advanced",
    name: "Advanced Cases",
    editName: "Advanced",
    numberCases: 60, // 42,
    categories: [
        { name: "Slot in Front  / White facing Up", cases: [1, 2, 3, 4] },
        { name: "Slot in Front / White facing Front", cases: [9, 10, 13, 14] },
        { name: "Slot in Front / White facing Side", cases: [7, 8, 11, 12] },
        { name: "Slot in Front / Corner in Adjacent Slot", cases: [19, 20, 21, 22, 23, 24] },
        { name: "Slot in Back / Edge in Adjacent Front Slot", cases: [37, 38, 39, 40, 41, 42] },
        { name: "Slot in Back / Corner in Adjacent Front Slot", cases: [25, 26, 27, 28, 29, 30] },
        { name: "Edge in Opposite Slot", cases: [5, 6, 17, 18, 15, 16] },
        { name: "Corner in Opposite Slot", cases: [31, 32, 33, 34, 35, 36] },
        { name: "Basic Cases / Free Slot", cases: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60] },
    ],
    caseNumberMapping: {
        43: "10B",
        44: "12B",
        45: "15B",
        46: "23B",
        47: "25B",
        48: "25F",
        49: "26B",
        50: "26F",
        51: "33B",
        52: "33F",
        53: "34B",
        54: "34F",
        55: "37B",
        56: "37F",
        57: "38B",
        58: "38F",
        59: "39B",
        60: "39F",
    },
    piecesToHide: [
        "br",
        "br",
        "fl",
        "fl",
        "fr",
        "fr",
        "br",
        "br",
        "fl",
        "fl",
        "fl",
        "fl",
        "br",
        "br",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "fr",
        "br",
        "br",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
        "br",
        "fl",
    ],
    // fr: front-right, fl: front-left, br: back-right, bl: back-left
    ignoreAUF: [55, 56, 57, 58, 59, 60],
} as const;

const EXPERT_DEFINITION: GroupDefinition = {
    id: "expert",
    name: "Expert Cases",
    editName: "Expert",
    numberCases: 17,
    categories: [
        { name: "Corner is solved", cases: [1, 2, 3, 4, 5, 6] },
        { name: "Pair in wrong slot", cases: [7, 8, 9] },
        { name: "Flipped edge & corner in adjacent slot", cases: [10, 11, 12, 13, 14, 15] },
        { name: "Other easy cases", cases: [16, 17] },
    ],
    piecesToHide: ["br", "br", "fl", "fl", "fl", "fl", "fl", "br", "fr", "fl", "br", "fl", "br", "fl", "br", "fl", "br"],
    // fr: front-right, fl: front-left, br: back-right, bl: back-left
    ignoreAUF: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
} as const;

export const GROUP_DEFINITIONS: Record<GroupId, GroupDefinition> = {
    basic: BASIC_DEFINITION,
    basicBack: BASIC_BACK_DEFINITION,
    advanced: ADVANCED_DEFINITION,
    expert: EXPERT_DEFINITION,
} as const;


// export const createGroupState = (group: GroupId, definition: GroupDefinition = GROUP_DEFINITIONS[group]): GroupState => {
//     const categoryCases = definition.categoryCases ?? [];
//     const uniqueCaseIds = Array.from(new Set(categoryCases.flat())).sort((a, b) => a - b);
//     const caseIds = uniqueCaseIds.length > 0
//         ? uniqueCaseIds
//         : Array.from({ length: definition.numberCases }, (_, index) => index + 1);

//     const cases = Object.fromEntries(caseIds.map((caseId) => [caseId, createCaseState()]));

//     const collapsedCategories = Object.fromEntries(
//         definition.categoryNames.map((_, index) => [index, false as boolean]),
//     );

//     return {
//         cases: cases as Record<CaseId, CaseState>,
//         collapsedCategories: collapsedCategories as Record<number, boolean>,
//     };
// };

// export const createInitialGroupsState = (): Record<GroupId, GroupState> =>
//     Object.fromEntries(GROUP_IDS.map((group) => [group, createGroupState(group)])) as Record<GroupId, GroupState>;

// export const createInitialGlobalState = (): GlobalState => ({
//     groups: createInitialGroupsState(),
//     currentGroup: "basic",
//     trainStateSelection: { ...defaultTrainStateSelection },
//     trainGroupSelection: { ...defaultTrainGroupSelection },
//     trainSideSelection: { ...defaultTrainSideSelection },
//     colorSelection: { ...defaultColorSelection },
// });
