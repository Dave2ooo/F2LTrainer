/**
 * Migration utility for converting old F2L Trainer localStorage format
 * to the new Svelte app format.
 *
 * Old format uses separate keys per group:
 * - {group}_caseSelection: "[0,1,2,...]" (0=unlearned, 1=learning, 2=finished)
 * - {group}_algorithmSelection: "[idx,...]" (right-hand algorithm index)
 * - {group}_algorithmSelectionLeft: "[idx,...]" (left-hand algorithm index)
 * - {group}_identicalAlgorithm: "[true,false,...]"
 * - {group}_customAlgorithms: ["alg1","",...]  (right-hand custom)
 * - {group}_customAlgorithmsLeft: ["alg1","",...]  (left-hand custom)
 *
 * New format uses a single nested object under 'casesState' key.
 */

import type {
	CaseState,
	TrainState,
	AlgorithmSelection,
	CustomAlgorithm
} from '../types/caseState';
import type { GroupId, CaseId } from '../types/group';
import { GROUP_IDS } from '../types/group';
import { casesStatic } from '../casesStatic';

export const MIGRATION_COMPLETE_KEY = 'V2MigrationComplete';

type PersistedCasesState = Partial<Record<GroupId, Partial<Record<CaseId, Partial<CaseState>>>>>;

// Old key patterns
const OLD_KEY_PATTERNS = [
	'_caseSelection',
	'_algorithmSelection',
	'_algorithmSelectionLeft',
	'_identicalAlgorithm',
	'_customAlgorithms',
	'_customAlgorithmsLeft'
] as const;

/**
 * Check if migration has already been performed
 */
export function hasMigrated(): boolean {
	if (typeof localStorage === 'undefined') return true;
	return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
}

/**
 * Mark migration as complete to prevent re-running
 */
export function markMigrationComplete(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
}

/**
 * Convert old trainState number to new string format
 * Old: 0 = unlearned, 1 = learning, 2 = finished
 */
export function convertTrainState(oldValue: number): TrainState {
	switch (oldValue) {
		case 1:
			return 'learning';
		case 2:
			return 'finished';
		default:
			return 'unlearned';
	}
}

/**
 * Safely parse JSON from localStorage value
 */
function parseLocalStorageValue<T>(key: string): T | null {
	if (typeof localStorage === 'undefined') return null;

	const rawValue = localStorage.getItem(key);
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as T;
	} catch {
		console.warn(`[Migration] Failed to parse localStorage key "${key}"`);
		return null;
	}
}

/**
 * Get all old localStorage keys that belong to the old format
 */
export function getOldLocalStorageKeys(): string[] {
	if (typeof localStorage === 'undefined') return [];

	const oldKeys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			for (const pattern of OLD_KEY_PATTERNS) {
				if (key.endsWith(pattern)) {
					oldKeys.push(key);
					break;
				}
			}
		}
	}
	return oldKeys;
}

/**
 * Check if there is any old localStorage data to migrate
 */
export function hasOldLocalStorageData(): boolean {
	return getOldLocalStorageKeys().length > 0;
}

/**
 * Delete all old localStorage keys after successful migration
 */
export function deleteOldLocalStorageKeys(): void {
	if (typeof localStorage === 'undefined') return;

	const keysToDelete = getOldLocalStorageKeys();
	for (const key of keysToDelete) {
		localStorage.removeItem(key);
	}

	if (keysToDelete.length > 0) {
		console.log(`[Migration] Deleted ${keysToDelete.length} old localStorage keys`);
	}
}

/**
 * Convert old algorithm selection index to new format.
 * In old format, an index >= algPool.length meant "custom algorithm selected".
 * In new format, null means custom algorithm selected.
 *
 * @param oldIndex - The old algorithm selection index
 * @param algPoolLength - Length of the algPool for this case
 * @param hasCustomAlg - Whether a custom algorithm string exists
 * @returns number (valid index), null (custom selected with alg), or 0 (fallback)
 */
function convertAlgorithmSelection(
	oldIndex: number | undefined,
	algPoolLength: number,
	hasCustomAlg: boolean
): number | null {
	if (oldIndex === undefined) return 0;

	// Check if old index indicates custom algorithm was selected
	if (oldIndex >= algPoolLength) {
		// Custom algorithm was selected in old format
		if (hasCustomAlg) {
			// Has a custom algorithm string, use null to indicate custom mode
			return null;
		} else {
			// No custom algorithm string exists, fall back to first default
			return 0;
		}
	}

	// Valid index within algPool
	return oldIndex;
}

/**
 * Migrate data for a single group
 */
function migrateGroup(groupId: GroupId): Record<CaseId, Partial<CaseState>> | null {
	// Read all old data for this group
	const caseSelection = parseLocalStorageValue<number[]>(`${groupId}_caseSelection`);
	const algorithmSelection = parseLocalStorageValue<number[]>(`${groupId}_algorithmSelection`);
	const algorithmSelectionLeft = parseLocalStorageValue<number[]>(
		`${groupId}_algorithmSelectionLeft`
	);
	const identicalAlgorithm = parseLocalStorageValue<boolean[]>(`${groupId}_identicalAlgorithm`);
	const customAlgorithms = parseLocalStorageValue<string[]>(`${groupId}_customAlgorithms`);
	const customAlgorithmsLeft = parseLocalStorageValue<string[]>(`${groupId}_customAlgorithmsLeft`);

	// Check if there's any data to migrate
	const hasAnyData =
		caseSelection ||
		algorithmSelection ||
		algorithmSelectionLeft ||
		identicalAlgorithm ||
		customAlgorithms ||
		customAlgorithmsLeft;

	if (!hasAnyData) {
		return null;
	}

	// Determine the number of cases (use the longest array)
	const numCases = Math.max(
		caseSelection?.length ?? 0,
		algorithmSelection?.length ?? 0,
		algorithmSelectionLeft?.length ?? 0,
		identicalAlgorithm?.length ?? 0,
		customAlgorithms?.length ?? 0,
		customAlgorithmsLeft?.length ?? 0
	);

	if (numCases === 0) {
		return null;
	}

	// Get the static data for this group to check algPool lengths
	const groupStatic = casesStatic[groupId];

	const result: Record<CaseId, Partial<CaseState>> = {};

	for (let i = 0; i < numCases; i++) {
		// Old arrays are 0-indexed, new CaseIds are 1-based
		const caseId = (i + 1) as CaseId;
		const caseState: Partial<CaseState> = {};

		// Get the algPool length for this case
		const caseStatic = groupStatic?.[caseId];
		const algPoolLength = caseStatic?.algPool?.length ?? 0;

		// Migrate trainState
		if (caseSelection && caseSelection[i] !== undefined) {
			caseState.trainState = convertTrainState(caseSelection[i]);
		}

		// Get custom algorithm strings to check if they exist
		const customRight = customAlgorithms?.[i] ?? '';
		const customLeft = customAlgorithmsLeft?.[i] ?? '';

		// Migrate algorithmSelection
		// Old format: index >= algPoolLength means custom algorithm was selected
		// New format: null means custom algorithm selected
		const algRight = algorithmSelection?.[i];
		const algLeft = algorithmSelectionLeft?.[i];

		if (algRight !== undefined || algLeft !== undefined) {
			const algSelection: AlgorithmSelection = {
				left: convertAlgorithmSelection(algLeft ?? algRight, algPoolLength, customLeft.length > 0),
				right: convertAlgorithmSelection(algRight, algPoolLength, customRight.length > 0)
			};
			caseState.algorithmSelection = algSelection;
		}

		// Migrate identicalAlgorithm
		if (identicalAlgorithm && identicalAlgorithm[i] !== undefined) {
			caseState.identicalAlgorithm = identicalAlgorithm[i];
		}

		// Migrate customAlgorithm (use already-read customRight/customLeft)
		if (customRight.length > 0 || customLeft.length > 0) {
			const customAlg: CustomAlgorithm = {
				left: customLeft,
				right: customRight
			};
			caseState.customAlgorithm = customAlg;
		}

		// Only add if there's actual data
		if (Object.keys(caseState).length > 0) {
			result[caseId] = caseState;
		}
	}

	return Object.keys(result).length > 0 ? result : null;
}

/**
 * Main migration function.
 * Reads old localStorage format and converts to new format.
 *
 * @param deleteOldKeys - Whether to delete old localStorage keys after migration (default: true)
 * @returns Migrated data in new format, or null if no data to migrate
 */
export function migrateOldLocalStorage(deleteOldKeys: boolean = true): PersistedCasesState | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	if (hasMigrated()) {
		console.log('[Migration] Already migrated, skipping');
		return null;
	}

	if (!hasOldLocalStorageData()) {
		console.log('[Migration] No old localStorage data found');
		return null;
	}

	console.log('[Migration] Starting migration from old localStorage format');

	const migratedData: PersistedCasesState = {};
	let hasAnyMigratedData = false;

	for (const groupId of GROUP_IDS) {
		const groupData = migrateGroup(groupId);
		if (groupData) {
			migratedData[groupId] = groupData;
			hasAnyMigratedData = true;
			console.log(
				`[Migration] Migrated ${Object.keys(groupData).length} cases for group "${groupId}"`
			);
		}
	}

	if (!hasAnyMigratedData) {
		console.log('[Migration] No data migrated');
		return null;
	}

	if (deleteOldKeys) {
		deleteOldLocalStorageKeys();
	}

	console.log('[Migration] Migration complete');
	return migratedData;
}
