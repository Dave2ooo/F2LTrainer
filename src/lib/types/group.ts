export type GroupId = "basic" | "basicBack" | "advanced" | "expert";
export const GROUPS: readonly GroupId[] = ["basic", "basicBack", "advanced", "expert"];

export type TrainState = "unlearned" | "learning" | "finished";
export const TRAIN_STATES: readonly TrainState[] = ["unlearned", "learning", "finished"];

export type CaseId = number; // 1-based, matches existing assets

export interface CaseState {
    status: TrainState;
    algorithmSelection: { left: number; right: number };
    customAlgorithm: { left: string; right: string };
    identicalAlgorithm: boolean;
    solveCount: number;
}

export interface GroupState {
    cases: Record<CaseId, CaseState>;
    collapsedCategories: Record<number, boolean>;
}

export interface GlobalState {
    groups: Record<GroupId, GroupState>;
    currentGroup: GroupId; // GroupId that is selected in selection view
    trainStateSelection: Record<TrainState, boolean>;
    trainGroupSelection: Record<GroupId, boolean>;
    trainSideSelection: Record<"left" | "right", boolean>;
    colorSelection: Record<"cross" | "front", string>;
}

const defaultTrainStateSelection = {
    unlearned: false,
    learning: true,
    finished: false,
} as const satisfies Record<TrainState, boolean>;

const defaultTrainGroupSelection = {
    basic: true,
    basicBack: true,
    advanced: true,
    expert: true,
} as const satisfies Record<GroupId, boolean>;

const defaultTrainSideSelection = {
    left: true,
    right: true,
} as const satisfies Record<"left" | "right", boolean>;

const defaultColorSelection = {
    cross: "white",
    front: "red",
} as const satisfies Record<"cross" | "front", string>;

export interface GroupDefinition {
    readonly id: GroupId;
    readonly name: string;
    readonly numberCases: number;
    readonly categoryNames: readonly string[];
    readonly categoryCases: readonly (readonly CaseId[])[];
    readonly ignoreAUF?: readonly CaseId[];
    readonly caseNumberMapping?: Readonly<Record<CaseId, string>>;
    readonly piecesToHide?: readonly string[];
}

const BASIC_DEFINITION: GroupDefinition = {
    id: "basic",
    name: "Basic Cases",
    numberCases: 41,
    categoryNames: [
        "Basic Inserts",
        "Pieces on Top / White facing Front / Edge oriented",
        "Pieces on Top / White facing Front / Edge unoriented",
        "Pieces on Top / White facing Side / Edge oriented",
        "Pieces on Top / white facing Side / Edge unoriented",
        "Pieces on Top / White facing Up / Edge oriented",
        "Pieces on Top / White facing Up / Edge unoriented",
        "Edge solved",
        "Edge flipped",
        "Corner on Bottom / Edge on Top / Edge oriented",
        "Corner on Bottom / Edge on Top / Edge unoriented",
    ],
    categoryCases: [
        [4, 3, 1, 2],
        [5, 7, 15],
        [9, 11, 13],
        [10, 12, 14],
        [6, 8, 16],
        [17, 19, 21, 23],
        [18, 20, 22, 24],
        [32, 33, 34, 38, 39],
        [31, 35, 36, 40, 41, 37],
        [27, 30, 25],
        [29, 28, 26],
    ],
    ignoreAUF: [37, 38, 39, 40, 41],
} as const;

const BASIC_BACK_DEFINITION: GroupDefinition = {
    id: "basicBack",
    name: "Basic Backslot",
    numberCases: 41,
    categoryNames: [
        "Basic Inserts",
        "Pieces on Top / White facing Back / Edge oriented",
        "Pieces on Top / White facing Back / Edge unoriented",
        "Pieces on Top / White facing Side / Edge oriented",
        "Pieces on Top / white facing Side / Edge unoriented",
        "Pieces on Top / White facing Up / Edge oriented",
        "Pieces on Top / White facing Up / Edge unoriented",
        "Edge solved",
        "Edge flipped",
        "Corner on Bottom / Edge on Top / Edge oriented",
        "Corner on Bottom / Edge on Top / Edge unoriented",
    ],
    categoryCases: [
        [4, 3, 1, 2],
        [6, 8, 16],
        [10, 12, 14],
        [9, 11, 13],
        [5, 7, 15],
        [18, 20, 22, 24],
        [17, 19, 21, 23],
        [32, 34, 33, 39, 38],
        [31, 36, 35, 41, 40, 37],
        [28, 29, 26],
        [30, 27, 25],
    ],
    ignoreAUF: [37, 38, 39, 40, 41],
} as const;

const ADVANCED_DEFINITION: GroupDefinition = {
    id: "advanced",
    name: "Advanced Cases",
    numberCases: 60, // 42,
    categoryNames: [
        "Slot in Front  / White facing Up",
        "Slot in Front / White facing Front",
        "Slot in Front / White facing Side",
        "Slot in Front / Corner in Adjacent Slot",
        "Slot in Back / Edge in Adjacent Front Slot", // new
        "Slot in Back / Corner in Adjacent Front Slot",
        "Edge in Opposite Slot",
        "Corner in Opposite Slot",
        "Basic Cases / Free Slot",
    ],
    categoryCases: [
        [1, 2, 3, 4],
        [9, 10, 13, 14],
        [7, 8, 11, 12],
        [19, 20, 21, 22, 23, 24],
        [37, 38, 39, 40, 41, 42], // new
        [25, 26, 27, 28, 29, 30],
        [5, 6, 17, 18, 15, 16],
        [31, 32, 33, 34, 35, 36],
        [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
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
    numberCases: 17,
    categoryNames: [
        "Corner is solved",
        "Pair in wrong slot",
        "Flipped edge & corner in adjacent slot",
        "Other easy cases",
    ],
    categoryCases: [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9],
        [10, 11, 12, 13, 14, 15],
        [16, 17],
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

export const createCaseState = (): CaseState => ({
    status: "unlearned",
    algorithmSelection: { left: 0, right: 0 },
    customAlgorithm: { left: "", right: "" },
    identicalAlgorithm: true,
    solveCount: 0,
});

export const createGroupState = (group: GroupId, definition: GroupDefinition = GROUP_DEFINITIONS[group]): GroupState => {
    const categoryCases = definition.categoryCases ?? [];
    const uniqueCaseIds = Array.from(new Set(categoryCases.flat())).sort((a, b) => a - b);
    const caseIds = uniqueCaseIds.length > 0
        ? uniqueCaseIds
        : Array.from({ length: definition.numberCases }, (_, index) => index + 1);

    const cases = Object.fromEntries(caseIds.map((caseId) => [caseId, createCaseState()]));

    const collapsedCategories = Object.fromEntries(
        definition.categoryNames.map((_, index) => [index, false as boolean]),
    );

    return {
        cases: cases as Record<CaseId, CaseState>,
        collapsedCategories: collapsedCategories as Record<number, boolean>,
    };
};

export const createInitialGroupsState = (): Record<GroupId, GroupState> =>
    Object.fromEntries(GROUPS.map((group) => [group, createGroupState(group)])) as Record<GroupId, GroupState>;

export const createInitialGlobalState = (): GlobalState => ({
    groups: createInitialGroupsState(),
    currentGroup: "basic",
    trainStateSelection: { ...defaultTrainStateSelection },
    trainGroupSelection: { ...defaultTrainGroupSelection },
    trainSideSelection: { ...defaultTrainSideSelection },
    colorSelection: { ...defaultColorSelection },
});
