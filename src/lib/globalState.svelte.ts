import type { GlobalState } from '$lib/types/globalState';
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from './types/group';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import {
	hasLegacyData,
	getLegacyDataFromLocalStorage,
	migrateLegacyData,
	clearLegacyData
} from './utils/migrateLegacyData';

export const GLOBAL_STATE_STORAGE_KEY = 'globalState';

const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
	Object.fromEntries(
		GROUP_IDS.map((groupId) => [groupId, GROUP_DEFINITIONS[groupId].categories.map(() => true)])
	) as Record<GroupId, boolean[]>;

const createDefaultGlobalState = (): GlobalState => ({
	crossColor: 'white',
	frontColor: 'red',
	categoriesOpenedObj: createCollapsedCategories(),
	view: 'select',
	selectedGroup: 'basic',
	trainStateSelection: { unlearned: false, learning: true, finished: false },
	trainGroupSelection: { basic: true, basicBack: true, advanced: true, expert: true },
	trainSideSelection: { left: true, right: true },
	trainAddAuf: true,
	trainHintShowCube: true,
	trainHintAlgorithm: 'step',
	trainHintStickering: 'f2l',
	playOnAlgChange: true,
	showDetails: false
});

export const globalState: GlobalState = $state(createDefaultGlobalState());

// Check for legacy data first
if (hasLegacyData()) {
	try {
		const legacyData = getLegacyDataFromLocalStorage();
		const { globalState: migratedGlobalState, casesState: migratedCasesState } =
			migrateLegacyData(legacyData);

		// Apply migrated global state
		if (migratedGlobalState) {
			Object.assign(globalState, migratedGlobalState);
		}

		// Save migrated data to new format
		saveToLocalStorage(GLOBAL_STATE_STORAGE_KEY, globalState);

		// Store migrated cases state for casesState.svelte.ts to pick up
		// We'll use a special key that will be cleared after casesState loads it
		if (migratedCasesState) {
			saveToLocalStorage('_migratedCasesState', migratedCasesState);
		}

		// Clear legacy data after successful migration
		clearLegacyData();

		console.log('Successfully migrated legacy localStorage data to new format');
	} catch (error) {
		console.error('Failed to migrate legacy data:', error);
	}
} else {
	// Load from new format if no legacy data
	const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY);

	if (persistedGlobalState) {
		Object.assign(globalState, persistedGlobalState);
	}
}
