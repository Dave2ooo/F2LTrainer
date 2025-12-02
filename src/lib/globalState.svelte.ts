import type { GlobalState } from '$lib/types/globalState';
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from './types/group';
import { loadFromLocalStorage } from './utils/localStorage';

export const GLOBAL_STATE_STORAGE_KEY = 'globalState';

const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
	Object.fromEntries(
		GROUP_IDS.map((groupId) => [groupId, GROUP_DEFINITIONS[groupId].categories.map(() => true)])
	) as Record<GroupId, boolean[]>;

const createDefaultGlobalState = (): GlobalState => ({
	crossColor: ['white'],
	frontColor: ['red'],
	categoriesOpenedObj: createCollapsedCategories(),
	view: 'select',
	selectedGroup: 'basic',
	trainStateSelection: { unlearned: false, learning: true, finished: false },
	trainGroupSelection: { basic: true, basicBack: true, advanced: true, expert: true },
	trainSideSelection: { left: true, right: true },
	trainAddAuf: true,
	trainHintAlgorithm: 'step',
	trainHintStickering: 'f2l',
	trainSmartFrequencySolved: false,
	trainSmartFrequencyTime: false,
	playOnAlgChange: true,
	showDetails: false,
	trainHideTwistyPlayer: false,
	trainShowTimer: false,
	hasUsedTimer: false,
	hasUsedTwistyPlayer: false,
	hasClickedCaseCard: false
});

const defaultState = createDefaultGlobalState();
const persistedGlobalState = loadFromLocalStorage<Partial<GlobalState>>(GLOBAL_STATE_STORAGE_KEY);

// Merge persisted state with defaults to ensure new properties get default values
const mergeState = <T extends object>(defaultState: T, persistedState: Partial<T>): T => {
	const merged = { ...defaultState };

	for (const key of Object.keys(persistedState) as (keyof T)[]) {
		const persistedValue = persistedState[key];
		const defaultValue = defaultState[key];

		// Skip if persisted value is null or undefined
		if (persistedValue === undefined || persistedValue === null) {
			console.warn(
				`[GlobalState] Skipping invalid persisted value for key "${String(key)}":`,
				persistedValue
			);
			continue;
		}

		// Handle Arrays (overwrite)
		if (Array.isArray(defaultValue)) {
			if (Array.isArray(persistedValue)) {
				merged[key] = persistedValue as T[keyof T];
			} else {
				console.warn(
					`[GlobalState] Expected array for key "${String(key)}" but got:`,
					typeof persistedValue
				);
			}
			continue;
		}

		// Handle Objects (deep merge)
		if (
			typeof defaultValue === 'object' &&
			defaultValue !== null &&
			typeof persistedValue === 'object' &&
			persistedValue !== null &&
			!Array.isArray(persistedValue)
		) {
			merged[key] = {
				...defaultValue,
				...persistedValue
			};

			// Clean up any nulls that might have been merged from persisted object
			const mergedObj = merged[key] as Record<string, any>;
			for (const subKey in mergedObj) {
				if (mergedObj[subKey] === null || mergedObj[subKey] === undefined) {
					// Fallback to default if available, otherwise delete or keep?
					// If it's in default, restore it.
					if ((defaultValue as Record<string, any>)[subKey] !== undefined) {
						console.warn(
							`[GlobalState] Restoring default for nested key "${String(key)}.${subKey}" due to invalid persisted value.`
						);
						mergedObj[subKey] = (defaultValue as Record<string, any>)[subKey];
					}
				}
			}
			continue;
		}

		// Handle Primitives (overwrite if type matches)
		if (typeof persistedValue === typeof defaultValue) {
			merged[key] = persistedValue as T[keyof T];
		}
	}

	return merged;
};

const initialState = persistedGlobalState
	? mergeState(defaultState, persistedGlobalState)
	: defaultState;

export const globalState: GlobalState = $state(initialState);
