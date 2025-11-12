import type { GlobalState, HintAlgorithm, View } from '$lib/types/globalState';
import type { CaseState, TrainState } from '$lib/types/caseState';
import type { GroupId } from '$lib/types/group';
import type { CaseId } from '$lib/types/group';
import type { StickerColor } from '$lib/types/stickering';

/**
 * Legacy data format from the old version of the app.
 * All values are stored as JSON-stringified strings in localStorage.
 */
interface LegacyLocalStorage {
	// Global settings
	viewSelection?: string; // "0" = select, "1" = train
	leftSelection?: string; // "true" or "false"
	rightSelection?: string; // "true" or "false"
	aufSelection?: string; // "true" or "false"
	hintAlgSelection?: string; // "0" = step, "1" = allAtOnce, "2" = always
	hintImageSelection?: string; // "0" = false, "1" or "2" = true
	stickeringSelection?: string; // "0" = f2l, "1" = fully
	frontColorSelection?: string; // "red", "blue", "orange", "green"
	crossColorSelection?: string; // "white", "yellow"
	trainStateSelection?: string; // "[false,true,false]" = [unlearned, learning, finished]
	trainGroupSelection?: string; // "[true,true,true,true]" = [basic, basicBack, advanced, expert]

	// Flags to ignore (from problem statement)
	considerAUFinAlg?: string;
	firstVisit?: string;
	timerEnabled?: string;
	recapEnabled?: string;

	// Per-group case data
	// Pattern: {group}_{property}
	// where group = basic, basicBack, advanced, expert
	// and property = caseSelection, algorithmSelection, algorithmSelectionLeft,
	//                customAlgorithms, customAlgorithmsLeft, identicalAlgorithm,
	//                solveCounter, collapse

	// basic group (41 cases)
	basic_caseSelection?: string; // Array of trainState: 0=unlearned, 1=learning, 2=finished
	basic_algorithmSelection?: string; // Array of algorithm indices (right side)
	basic_algorithmSelectionLeft?: string; // Array of algorithm indices (left side)
	basic_customAlgorithms?: string; // Array of custom algorithms (right side)
	basic_customAlgorithmsLeft?: string; // Array of custom algorithms (left side)
	basic_identicalAlgorithm?: string; // Array of booleans
	basic_solveCounter?: string; // Array of solve counts
	basic_collapse?: string; // Array of category collapse states

	// basicBack group (41 cases)
	basicBack_caseSelection?: string;
	basicBack_algorithmSelection?: string;
	basicBack_algorithmSelectionLeft?: string;
	basicBack_customAlgorithms?: string;
	basicBack_customAlgorithmsLeft?: string;
	basicBack_identicalAlgorithm?: string;
	basicBack_solveCounter?: string;
	basicBack_collapse?: string;

	// advanced group (60 cases)
	advanced_caseSelection?: string;
	advanced_algorithmSelection?: string;
	advanced_algorithmSelectionLeft?: string;
	advanced_customAlgorithms?: string;
	advanced_customAlgorithmsLeft?: string;
	advanced_identicalAlgorithm?: string;
	advanced_solveCounter?: string;
	advanced_collapse?: string;

	// expert group (17 cases)
	expert_caseSelection?: string;
	expert_algorithmSelection?: string;
	expert_algorithmSelectionLeft?: string;
	expert_customAlgorithms?: string;
	expert_customAlgorithmsLeft?: string;
	expert_identicalAlgorithm?: string;
	expert_solveCounter?: string;
	expert_collapse?: string;
}

/**
 * Parse a JSON string from legacy localStorage, handling the double-encoding
 * @param value The JSON-stringified string from localStorage
 * @returns The parsed value or null if parsing fails
 */
function parseLegacyValue<T>(value: string | undefined): T | null {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

/**
 * Convert legacy view selection to new format
 * @param viewSelection "0" = select, "1" = train
 */
function convertView(viewSelection: string | undefined): View {
	if (viewSelection === '1') return 'train';
	return 'select';
}

/**
 * Convert legacy hint algorithm selection to new format
 * @param hintAlgSelection "0" = step, "1" = allAtOnce, "2" = always
 */
function convertHintAlgorithm(hintAlgSelection: string | undefined): HintAlgorithm {
	if (hintAlgSelection === '1') return 'allAtOnce';
	if (hintAlgSelection === '2') return 'always';
	return 'step';
}

/**
 * Convert legacy hint image selection to new format
 * @param hintImageSelection "0" = false, "1" or "2" = true
 */
function convertHintShowCube(hintImageSelection: string | undefined): boolean {
	if (hintImageSelection === '0') return false;
	return true; // "1" or "2" map to true
}

/**
 * Convert legacy stickering selection to new format
 * @param stickeringSelection "0" = f2l, "1" = fully
 */
function convertHintStickering(stickeringSelection: string | undefined): 'f2l' | 'fully' {
	if (stickeringSelection === '1') return 'fully';
	return 'f2l';
}

/**
 * Convert legacy train state value to new format
 * @param value 0 = unlearned, 1 = learning, 2 = finished
 */
function convertTrainState(value: number): TrainState {
	if (value === 1) return 'learning';
	if (value === 2) return 'finished';
	return 'unlearned';
}

/**
 * Get the number of cases for each group
 */
const GROUP_CASE_COUNTS: Record<GroupId, number> = {
	basic: 41,
	basicBack: 41,
	advanced: 60,
	expert: 17
};

/**
 * Get the number of categories for each group
 */
const GROUP_CATEGORY_COUNTS: Record<GroupId, number> = {
	basic: 11,
	basicBack: 11,
	advanced: 9,
	expert: 4
};

/**
 * Convert legacy color selection to typed color, with default
 */
function convertColor(color: string | undefined, defaultColor: StickerColor): StickerColor {
	if (!color) return defaultColor;
	// Validate that it's a known color
	const validColors: StickerColor[] = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];
	if (validColors.includes(color as StickerColor)) {
		return color as StickerColor;
	}
	return defaultColor;
}

/**
 * Convert legacy case data for a specific group
 */
function convertGroupCaseData(
	groupId: GroupId,
	legacy: LegacyLocalStorage
): Record<CaseId, CaseState> {
	const caseCount = GROUP_CASE_COUNTS[groupId];
	const result: Record<CaseId, CaseState> = {};

	// Parse all arrays for this group
	const caseSelection = parseLegacyValue<number[]>(legacy[`${groupId}_caseSelection`]) || [];
	const algorithmSelection =
		parseLegacyValue<number[]>(legacy[`${groupId}_algorithmSelection`]) || [];
	const algorithmSelectionLeft =
		parseLegacyValue<number[]>(legacy[`${groupId}_algorithmSelectionLeft`]) || [];
	const customAlgorithms = parseLegacyValue<string[]>(legacy[`${groupId}_customAlgorithms`]) || [];
	const customAlgorithmsLeft =
		parseLegacyValue<string[]>(legacy[`${groupId}_customAlgorithmsLeft`]) || [];
	const identicalAlgorithm =
		parseLegacyValue<boolean[]>(legacy[`${groupId}_identicalAlgorithm`]) || [];
	const solveCounter = parseLegacyValue<number[]>(legacy[`${groupId}_solveCounter`]) || [];

	// Convert each case (1-based indexing)
	for (let i = 0; i < caseCount; i++) {
		const caseId = (i + 1) as CaseId;

		result[caseId] = {
			trainState: convertTrainState(caseSelection[i] || 0),
			algorithmSelection: {
				left: algorithmSelectionLeft[i] ?? 0,
				right: algorithmSelection[i] ?? 0
			},
			customAlgorithm: {
				left: customAlgorithmsLeft[i] || '',
				right: customAlgorithms[i] || ''
			},
			identicalAlgorithm: identicalAlgorithm[i] ?? true,
			solveCount: solveCounter[i] || 0
		};
	}

	return result;
}

/**
 * Convert legacy category collapse data for a specific group
 */
function convertGroupCategoryCollapse(groupId: GroupId, legacy: LegacyLocalStorage): boolean[] {
	const categoryCount = GROUP_CATEGORY_COUNTS[groupId];
	const collapse = parseLegacyValue<boolean[]>(legacy[`${groupId}_collapse`]) || [];

	// The old collapse array stored "collapsed" state, but the new one stores "opened" state
	// So we need to invert the values
	const result: boolean[] = [];
	for (let i = 0; i < categoryCount; i++) {
		// If collapse[i] is false (not collapsed), then opened should be true
		result.push(!collapse[i]);
	}

	return result;
}

/**
 * Migrate legacy localStorage data to new format
 * @param legacyData The legacy localStorage data (key-value pairs)
 * @returns Object with globalState and casesState in new format
 */
export function migrateLegacyData(legacyData: Record<string, string>): {
	globalState: Partial<GlobalState>;
	casesState: Partial<Record<GroupId, Record<CaseId, CaseState>>>;
} {
	const legacy = legacyData as LegacyLocalStorage;

	// Parse global settings
	const trainStateSelection = parseLegacyValue<boolean[]>(legacy.trainStateSelection) || [
		false,
		true,
		false
	];
	const trainGroupSelection = parseLegacyValue<boolean[]>(legacy.trainGroupSelection) || [
		true,
		true,
		true,
		true
	];

	// Convert global state
	const globalState: Partial<GlobalState> = {
		view: convertView(legacy.viewSelection),
		trainSideSelection: {
			left: parseLegacyValue<boolean>(legacy.leftSelection) ?? true,
			right: parseLegacyValue<boolean>(legacy.rightSelection) ?? true
		},
		trainAddAuf: parseLegacyValue<boolean>(legacy.aufSelection) ?? true,
		trainHintAlgorithm: convertHintAlgorithm(legacy.hintAlgSelection),
		trainHintShowCube: convertHintShowCube(legacy.hintImageSelection),
		trainHintStickering: convertHintStickering(legacy.stickeringSelection),
		crossColor: convertColor(legacy.crossColorSelection, 'white'),
		frontColor: convertColor(legacy.frontColorSelection, 'red'),
		trainStateSelection: {
			unlearned: trainStateSelection[0] ?? false,
			learning: trainStateSelection[1] ?? true,
			finished: trainStateSelection[2] ?? false
		},
		trainGroupSelection: {
			basic: trainGroupSelection[0] ?? true,
			basicBack: trainGroupSelection[1] ?? true,
			advanced: trainGroupSelection[2] ?? true,
			expert: trainGroupSelection[3] ?? true
		},
		categoriesOpenedObj: {
			basic: convertGroupCategoryCollapse('basic', legacy),
			basicBack: convertGroupCategoryCollapse('basicBack', legacy),
			advanced: convertGroupCategoryCollapse('advanced', legacy),
			expert: convertGroupCategoryCollapse('expert', legacy)
		}
	};

	// Convert case states for all groups
	const casesState: Partial<Record<GroupId, Record<CaseId, CaseState>>> = {
		basic: convertGroupCaseData('basic', legacy),
		basicBack: convertGroupCaseData('basicBack', legacy),
		advanced: convertGroupCaseData('advanced', legacy),
		expert: convertGroupCaseData('expert', legacy)
	};

	return { globalState, casesState };
}

/**
 * Check if localStorage contains legacy data format
 * @returns true if legacy data is detected
 */
export function hasLegacyData(): boolean {
	if (typeof localStorage === 'undefined') return false;

	// Check for presence of legacy keys
	const legacyKeys = [
		'viewSelection',
		'hintAlgSelection',
		'hintImageSelection',
		'leftSelection',
		'rightSelection',
		'basic_caseSelection',
		'advanced_caseSelection'
	];

	return legacyKeys.some((key) => localStorage.getItem(key) !== null);
}

/**
 * Get all legacy data from localStorage
 * @returns Object with all key-value pairs from localStorage
 */
export function getLegacyDataFromLocalStorage(): Record<string, string> {
	if (typeof localStorage === 'undefined') return {};

	const result: Record<string, string> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			const value = localStorage.getItem(key);
			if (value !== null) {
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Clear all legacy data from localStorage
 * This should be called after successful migration
 */
export function clearLegacyData(): void {
	if (typeof localStorage === 'undefined') return;

	// List of all known legacy keys
	const legacyKeys = [
		'viewSelection',
		'leftSelection',
		'rightSelection',
		'aufSelection',
		'hintAlgSelection',
		'hintImageSelection',
		'stickeringSelection',
		'frontColorSelection',
		'crossColorSelection',
		'trainStateSelection',
		'trainGroupSelection',
		'considerAUFinAlg',
		'firstVisit',
		'timerEnabled',
		'recapEnabled',
		// basic
		'basic_caseSelection',
		'basic_algorithmSelection',
		'basic_algorithmSelectionLeft',
		'basic_customAlgorithms',
		'basic_customAlgorithmsLeft',
		'basic_identicalAlgorithm',
		'basic_solveCounter',
		'basic_collapse',
		// basicBack
		'basicBack_caseSelection',
		'basicBack_algorithmSelection',
		'basicBack_algorithmSelectionLeft',
		'basicBack_customAlgorithms',
		'basicBack_customAlgorithmsLeft',
		'basicBack_identicalAlgorithm',
		'basicBack_solveCounter',
		'basicBack_collapse',
		// advanced
		'advanced_caseSelection',
		'advanced_algorithmSelection',
		'advanced_algorithmSelectionLeft',
		'advanced_customAlgorithms',
		'advanced_customAlgorithmsLeft',
		'advanced_identicalAlgorithm',
		'advanced_solveCounter',
		'advanced_collapse',
		// expert
		'expert_caseSelection',
		'expert_algorithmSelection',
		'expert_algorithmSelectionLeft',
		'expert_customAlgorithms',
		'expert_customAlgorithmsLeft',
		'expert_identicalAlgorithm',
		'expert_solveCounter',
		'expert_collapse'
	];

	legacyKeys.forEach((key) => localStorage.removeItem(key));
}
