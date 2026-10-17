import type { CaseState } from './caseState';
import type { StickerHidden } from './stickering';

export type GroupId = 'basic' | 'basicBack' | 'advanced' | 'expert';
export const GROUP_IDS: readonly GroupId[] = ['basic', 'basicBack', 'advanced', 'expert'];

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
	readonly pairedCategories?: readonly {
		name: string;
		cases: readonly (CaseId | readonly CaseId[])[];
	}[];
	readonly ignoreAUF?: readonly CaseId[];
	readonly caseNumberMapping?: Readonly<Record<CaseId, string>>;
	readonly piecesToHide?: Readonly<Record<number, StickerHidden>>;
	readonly edgeState?: Readonly<Record<CaseId, { slot: StickerHidden; oriented: boolean }>>;
}

const BASIC_DEFINITION: GroupDefinition = {
	id: 'basic',
	name: 'Basic Cases',
	editName: 'Basic',
	numberCases: 41,
	categories: [
		{ name: 'Basic Inserts', cases: [4, 3, 1, 2] },
		{ name: 'Pieces on Top / White facing Front / Edge oriented', cases: [5, 7, 15] },
		{ name: 'Pieces on Top / White facing Front / Edge unoriented', cases: [9, 11, 13] },
		{ name: 'Pieces on Top / White facing Side / Edge oriented', cases: [10, 12, 14] },
		{ name: 'Pieces on Top / white facing Side / Edge unoriented', cases: [6, 8, 16] },
		{ name: 'Pieces on Top / White facing Up / Edge oriented', cases: [17, 19, 21, 23] },
		{ name: 'Pieces on Top / White facing Up / Edge unoriented', cases: [18, 20, 22, 24] },
		{ name: 'Edge solved', cases: [32, 33, 34, 38, 39] },
		{ name: 'Edge flipped', cases: [31, 35, 36, 40, 41, 37] },
		{ name: 'Corner on Bottom / Edge on Top / Edge oriented', cases: [27, 30, 25] },
		{ name: 'Corner on Bottom / Edge on Top / Edge unoriented', cases: [29, 28, 26] }
	],
	pairedCategories: [
		{
			name: 'Pieces on Top / White facing Front',
			cases: [
				[1, 11],
				[15, 13],
				[7, 3],
				[5, 9]
			]
		},
		{
			name: 'Pieces on Top / White facing Side',
			cases: [
				[14, 16],
				[12, 2],
				[10, 6],
				[4, 8]
			]
		},
		{
			name: 'Pieces on Top / White facing Up',
			cases: [
				[17, 24],
				[23, 18],
				[21, 20],
				[19, 22]
			]
		},
		{
			name: 'Edge in correct Slot / Corner on Top',
			cases: [
				[33, 35],
				[34, 36],
				[32, 31]
			]
		},
		{
			name: 'Corner in correct Slot / Edge on Top',
			cases: [
				[27, 29],
				[30, 28],
				[25, 26]
			]
		},
		{
			name: 'Pieces in correct Slot',
			cases: [[38, 40], [39, 41], [37]]
		}
	],
	ignoreAUF: [37, 38, 39, 40, 41],
	edgeState: {
		1: { slot: 'fr', oriented: true },
		2: { slot: 'fr', oriented: false },
		3: { slot: 'fr', oriented: false },
		4: { slot: 'fr', oriented: true },
		5: { slot: 'fr', oriented: true },
		6: { slot: 'fr', oriented: false },
		7: { slot: 'fr', oriented: true },
		8: { slot: 'fr', oriented: false },
		9: { slot: 'fr', oriented: false },
		10: { slot: 'fr', oriented: true },
		11: { slot: 'fr', oriented: false },
		12: { slot: 'fr', oriented: true },
		13: { slot: 'fr', oriented: false },
		14: { slot: 'fr', oriented: true },
		15: { slot: 'fr', oriented: true },
		16: { slot: 'fr', oriented: false },
		17: { slot: 'fr', oriented: true },
		18: { slot: 'fr', oriented: false },
		19: { slot: 'fr', oriented: true },
		20: { slot: 'fr', oriented: false },
		21: { slot: 'fr', oriented: true },
		22: { slot: 'fr', oriented: false },
		23: { slot: 'fr', oriented: true },
		24: { slot: 'fr', oriented: false },
		25: { slot: 'fr', oriented: true },
		26: { slot: 'fr', oriented: false },
		27: { slot: 'fr', oriented: true },
		28: { slot: 'fr', oriented: false },
		29: { slot: 'fr', oriented: false },
		30: { slot: 'fr', oriented: true },
		31: { slot: 'fr', oriented: false },
		32: { slot: 'fr', oriented: true },
		33: { slot: 'fr', oriented: true },
		34: { slot: 'fr', oriented: true },
		35: { slot: 'fr', oriented: false },
		36: { slot: 'fr', oriented: false },
		37: { slot: 'fr', oriented: false },
		38: { slot: 'fr', oriented: true },
		39: { slot: 'fr', oriented: true },
		40: { slot: 'fr', oriented: false },
		41: { slot: 'fr', oriented: false }
	}
} as const;

const BASIC_BACK_DEFINITION: GroupDefinition = {
	id: 'basicBack',
	name: 'Basic Backslot',
	editName: 'Basic Backslot',
	numberCases: 41,
	categories: [
		{ name: 'Basic Inserts', cases: [4, 3, 1, 2] },
		{ name: 'Pieces on Top / White facing Back / Edge oriented', cases: [6, 8, 16] },
		{ name: 'Pieces on Top / White facing Back / Edge unoriented', cases: [10, 12, 14] },
		{ name: 'Pieces on Top / White facing Side / Edge oriented', cases: [9, 11, 13] },
		{ name: 'Pieces on Top / white facing Side / Edge unoriented', cases: [5, 7, 15] },
		{ name: 'Pieces on Top / White facing Up / Edge oriented', cases: [18, 20, 22, 24] },
		{ name: 'Pieces on Top / White facing Up / Edge unoriented', cases: [17, 19, 21, 23] },
		{ name: 'Edge solved', cases: [32, 34, 33, 39, 38] },
		{ name: 'Edge flipped', cases: [31, 36, 35, 41, 40, 37] },
		{ name: 'Corner on Bottom / Edge on Top / Edge oriented', cases: [28, 29, 26] },
		{ name: 'Corner on Bottom / Edge on Top / Edge unoriented', cases: [30, 27, 25] }
	],
	pairedCategories: [
		{
			name: 'Pieces on Top / White facing Back',
			cases: [
				[2, 12],
				[6, 10],
				[8, 4],
				[16, 14]
			]
		},
		{
			name: 'Pieces on Top / White facing Side',
			cases: [
				[13, 15],
				[3, 7],
				[9, 5],
				[11, 1]
			]
		},
		{
			name: 'Pieces on Top / White facing Up',
			cases: [
				[18, 23],
				[20, 21],
				[22, 19],
				[24, 17]
			]
		},
		{
			name: 'Edge in correct Slot / Corner on Top',
			cases: [
				[34, 36],
				[33, 35],
				[32, 31]
			]
		},
		{
			name: 'Corner in correct Slot / Edge on Top',
			cases: [
				[28, 30],
				[29, 27],
				[26, 25]
			]
		},
		{
			name: 'Pieces in correct Slot',
			cases: [[39, 41], [38, 40], [37]]
		}
	],
	ignoreAUF: [37, 38, 39, 40, 41],
	edgeState: {
		1: { slot: 'br', oriented: false },
		2: { slot: 'br', oriented: true },
		3: { slot: 'br', oriented: true },
		4: { slot: 'br', oriented: false },
		5: { slot: 'br', oriented: false },
		6: { slot: 'br', oriented: true },
		7: { slot: 'br', oriented: false },
		8: { slot: 'br', oriented: true },
		9: { slot: 'br', oriented: true },
		10: { slot: 'br', oriented: false },
		11: { slot: 'br', oriented: true },
		12: { slot: 'br', oriented: false },
		13: { slot: 'br', oriented: true },
		14: { slot: 'br', oriented: false },
		15: { slot: 'br', oriented: false },
		16: { slot: 'br', oriented: true },
		17: { slot: 'br', oriented: false },
		18: { slot: 'br', oriented: true },
		19: { slot: 'br', oriented: false },
		20: { slot: 'br', oriented: true },
		21: { slot: 'br', oriented: false },
		22: { slot: 'br', oriented: true },
		23: { slot: 'br', oriented: false },
		24: { slot: 'br', oriented: true },
		25: { slot: 'br', oriented: false },
		26: { slot: 'br', oriented: true },
		27: { slot: 'br', oriented: false },
		28: { slot: 'br', oriented: true },
		29: { slot: 'br', oriented: true },
		30: { slot: 'br', oriented: false },
		31: { slot: 'br', oriented: false },
		32: { slot: 'br', oriented: true },
		33: { slot: 'br', oriented: true },
		34: { slot: 'br', oriented: true },
		35: { slot: 'br', oriented: false },
		36: { slot: 'br', oriented: false },
		37: { slot: 'br', oriented: false },
		38: { slot: 'br', oriented: true },
		39: { slot: 'br', oriented: true },
		40: { slot: 'br', oriented: false },
		41: { slot: 'br', oriented: false }
	}
} as const;

const ADVANCED_DEFINITION: GroupDefinition = {
	id: 'advanced',
	name: 'Advanced Cases',
	editName: 'Advanced',
	numberCases: 60, // 42,
	categories: [
		{ name: 'Slot in Front  / White facing Up', cases: [1, 2, 3, 4] },
		{ name: 'Slot in Front / White facing Front', cases: [9, 10, 13, 14] },
		{ name: 'Slot in Front / White facing Side', cases: [7, 8, 11, 12] },
		{ name: 'Slot in Front / Corner in Adjacent Slot', cases: [19, 20, 21, 22, 23, 24] },
		{ name: 'Slot in Back / Edge in Adjacent Front Slot', cases: [37, 38, 39, 40, 41, 42] },
		{ name: 'Slot in Back / Corner in Adjacent Front Slot', cases: [25, 26, 27, 28, 29, 30] },
		{ name: 'Edge in Opposite Slot', cases: [5, 6, 17, 18, 15, 16] },
		{ name: 'Corner in Opposite Slot', cases: [31, 32, 35, 34, 33, 36] },
		{
			name: 'Basic Cases / Free Slot',
			cases: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]
		}
	],
	pairedCategories: [
		{
			name: 'Slot in Front / White facing Front',
			cases: [
				[9, 10],
				[13, 14]
			]
		},
		{
			name: 'Slot in Front / White facing Side',
			cases: [
				[7, 8],
				[11, 12]
			]
		},
		{
			name: 'Slot in Front  / White facing Up',
			cases: [
				[1, 2],
				[3, 4]
			]
		},
		{
			name: 'Slot in Front / Corner in Adjacent Slot',
			cases: [
				[19, 20],
				[21, 22],
				[23, 24]
			]
		},
		{
			name: 'Slot in Back / Edge in Adjacent Front Slot',
			cases: [
				[38, 41],
				[39, 42],
				[37, 40]
			]
		},
		{
			name: 'Slot in Back / Corner in Adjacent Front Slot',
			cases: [
				[30, 29],
				[28, 27],
				[26, 25]
			]
		},
		{
			name: 'Edge in Opposite Slot',
			cases: [
				[17, 18],
				[15, 16],
				[5, 6]
			]
		},
		{
			name: 'Corner in Opposite Slot',
			cases: [
				[33, 36],
				[35, 34],
				[31, 32]
			]
		},
		{
			name: 'Basic Cases / Free Slot',
			cases: [43, 44, 45, 46, [47, 49], [48, 50], 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]
		}
	],
	caseNumberMapping: {
		43: '10B',
		44: '12B',
		45: '15B',
		46: '23B',
		47: '25B',
		48: '25F',
		49: '26B',
		50: '26F',
		51: '33B',
		52: '33F',
		53: '34B',
		54: '34F',
		55: '37B',
		56: '37F',
		57: '38B',
		58: '38F',
		59: '39B',
		60: '39F'
	},
	piecesToHide: {
		1: 'br',
		2: 'br',
		3: 'fl',
		4: 'fl',
		5: 'fr',
		6: 'fr',
		7: 'br',
		8: 'br',
		9: 'fl',
		10: 'fl',
		11: 'fl',
		12: 'fl',
		13: 'br',
		14: 'br',
		15: 'fr',
		16: 'fr',
		17: 'fr',
		18: 'fr',
		19: 'fr',
		20: 'fr',
		21: 'fr',
		22: 'fr',
		23: 'fr',
		24: 'fr',
		25: 'fr',
		26: 'fr',
		27: 'fr',
		28: 'fr',
		29: 'fr',
		30: 'fr',
		31: 'fr',
		32: 'fr',
		33: 'fr',
		34: 'fr',
		35: 'fr',
		36: 'fr',
		37: 'fr',
		38: 'fr',
		39: 'fr',
		40: 'fr',
		41: 'fr',
		42: 'fr',
		43: 'br',
		44: 'br',
		45: 'br',
		46: 'fl',
		47: 'br',
		48: 'fl',
		49: 'br',
		50: 'fl',
		51: 'br',
		52: 'fl',
		53: 'br',
		54: 'fl',
		55: 'br',
		56: 'fl',
		57: 'br',
		58: 'fl',
		59: 'br',
		60: 'fl'
	},
	// fr: front-right, fl: front-left, br: back-right, bl: back-left
	ignoreAUF: [55, 56, 57, 58, 59, 60],
	edgeState: {
		1: { slot: 'fr', oriented: true },
		2: { slot: 'fr', oriented: false },
		3: { slot: 'fr', oriented: true },
		4: { slot: 'fr', oriented: false },
		5: { slot: 'bl', oriented: true },
		6: { slot: 'bl', oriented: false },
		7: { slot: 'fr', oriented: true },
		8: { slot: 'fr', oriented: false },
		9: { slot: 'fr', oriented: true },
		10: { slot: 'fr', oriented: false },
		11: { slot: 'fr', oriented: true },
		12: { slot: 'fr', oriented: false },
		13: { slot: 'fr', oriented: true },
		14: { slot: 'fr', oriented: false },
		15: { slot: 'bl', oriented: true },
		16: { slot: 'bl', oriented: false },
		17: { slot: 'bl', oriented: true },
		18: { slot: 'bl', oriented: false },
		19: { slot: 'fl', oriented: true },
		20: { slot: 'fl', oriented: false },
		21: { slot: 'fl', oriented: true },
		22: { slot: 'fl', oriented: false },
		23: { slot: 'fl', oriented: true },
		24: { slot: 'fl', oriented: false },
		25: { slot: 'br', oriented: false },
		26: { slot: 'br', oriented: true },
		27: { slot: 'br', oriented: false },
		28: { slot: 'br', oriented: true },
		29: { slot: 'br', oriented: false },
		30: { slot: 'br', oriented: true },
		31: { slot: 'bl', oriented: true },
		32: { slot: 'bl', oriented: false },
		33: { slot: 'bl', oriented: true },
		34: { slot: 'bl', oriented: false },
		35: { slot: 'bl', oriented: true },
		36: { slot: 'bl', oriented: false },
		37: { slot: 'br', oriented: true },
		38: { slot: 'br', oriented: true },
		39: { slot: 'br', oriented: true },
		40: { slot: 'br', oriented: false },
		41: { slot: 'br', oriented: false },
		42: { slot: 'br', oriented: false },
		44: { slot: 'fr', oriented: true },
		43: { slot: 'fr', oriented: true },
		45: { slot: 'fr', oriented: true },
		46: { slot: 'fr', oriented: true },
		47: { slot: 'fr', oriented: true },
		48: { slot: 'fr', oriented: true },
		49: { slot: 'fr', oriented: false },
		50: { slot: 'fr', oriented: false },
		51: { slot: 'fr', oriented: true },
		52: { slot: 'fr', oriented: true },
		53: { slot: 'fr', oriented: true },
		54: { slot: 'fr', oriented: true },
		55: { slot: 'fr', oriented: false },
		56: { slot: 'fr', oriented: false },
		57: { slot: 'fr', oriented: false },
		58: { slot: 'fr', oriented: false },
		59: { slot: 'fr', oriented: true },
		60: { slot: 'fr', oriented: true }
	}
} as const;

const EXPERT_DEFINITION: GroupDefinition = {
	id: 'expert',
	name: 'Expert Cases',
	editName: 'Expert',
	numberCases: 33,
	categories: [
		{ name: 'Corner is solved', cases: [1, 2, 3, 4, 5, 6] },
		{ name: 'Pair in wrong slot', cases: [7, 8, 9, 18] },
		{ name: 'Both pieces in wrong slot / Edge oriented', cases: [19, 21, 22, 24, 26, 29, 31, 33] },
		{
			name: 'Both pieces in wrong slot / Edge unoriented',
			cases: [20, 23, 25, 27, 28, 30, 32]
		},
		{ name: 'Edge flipped / Corner in Adjacent Slot', cases: [10, 11, 12, 13, 14, 15] },
		{ name: 'Other easy cases', cases: [16, 17] }
	],
	pairedCategories: [
		// same as categories
		{
			name: 'Corner is solved',
			cases: [
				[1, 2],
				[3, 4],
				[5, 6]
			]
		},
		{ name: 'Pair in wrong slot', cases: [7, 8, 9, 18] },
		{
			name: 'Both pieces in wrong slot / Edge oriented',
			cases: [19, 21, 22, 24, 26, 29, 31, 33]
		},
		{
			name: 'Both pieces in wrong slot / Edge unoriented',
			cases: [20, 23, 25, 27, 28, 30, 32]
		},
		{ name: 'Edge flipped / Corner in Adjacent Slot', cases: [10, 11, 12, 13, 14, 15] },
		{ name: 'Other easy cases', cases: [16, 17] }
	],
	piecesToHide: {
		1: 'br',
		2: 'br',
		3: 'fl',
		4: 'fl',
		5: 'fl',
		6: 'fl',
		7: 'fl',
		8: 'br',
		9: 'fr',
		10: 'fl',
		11: 'br',
		12: 'fl',
		13: 'br',
		14: 'fl',
		15: 'br',
		16: 'fl',
		17: 'br',
		18: 'fr',
		19: 'fr',
		20: 'fr',
		21: 'fr',
		22: 'fr',
		23: 'fr',
		24: 'fr',
		25: 'fr',
		26: 'fr',
		27: 'fr',
		28: 'fr',
		29: 'fr',
		30: 'fr',
		31: 'fr',
		32: 'fr',
		33: 'fr'
	},
	// fr: front-right, fl: front-left, br: back-right, bl: back-left
	ignoreAUF: [
		1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
		27, 28, 29, 30, 31, 32, 33
	],
	edgeState: {
		1: { slot: 'fr', oriented: true },
		2: { slot: 'fr', oriented: false },
		3: { slot: 'fr', oriented: true },
		4: { slot: 'fr', oriented: false },
		5: { slot: 'br', oriented: true },
		6: { slot: 'br', oriented: false },
		7: { slot: 'fr', oriented: false },
		8: { slot: 'fr', oriented: false },
		9: { slot: 'bl', oriented: true },
		10: { slot: 'fr', oriented: false },
		11: { slot: 'fr', oriented: false },
		12: { slot: 'fr', oriented: false },
		13: { slot: 'fr', oriented: false },
		14: { slot: 'fr', oriented: false },
		15: { slot: 'fr', oriented: false },
		16: { slot: 'fr', oriented: false },
		17: { slot: 'fr', oriented: false },
		18: { slot: 'br', oriented: false },
		19: { slot: 'br', oriented: true },
		20: { slot: 'bl', oriented: false },
		21: { slot: 'fl', oriented: true },
		22: { slot: 'br', oriented: true },
		23: { slot: 'bl', oriented: false },
		24: { slot: 'fl', oriented: true },
		25: { slot: 'br', oriented: false },
		26: { slot: 'bl', oriented: true },
		27: { slot: 'fl', oriented: false },
		28: { slot: 'br', oriented: false },
		29: { slot: 'bl', oriented: true },
		30: { slot: 'fl', oriented: false },
		31: { slot: 'br', oriented: true },
		32: { slot: 'bl', oriented: false },
		33: { slot: 'fl', oriented: true }
	}
} as const;

export const GROUP_DEFINITIONS: Record<GroupId, GroupDefinition> = {
	basic: BASIC_DEFINITION,
	basicBack: BASIC_BACK_DEFINITION,
	advanced: ADVANCED_DEFINITION,
	expert: EXPERT_DEFINITION
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
