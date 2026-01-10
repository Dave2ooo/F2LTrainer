import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	convertTrainState,
	hasMigrated,
	markMigrationComplete,
	hasOldLocalStorageData,
	getOldLocalStorageKeys,
	deleteOldLocalStorageKeys,
	migrateOldLocalStorage,
	MIGRATION_COMPLETE_KEY
} from './migrateOldLocalStorage';

// Mock localStorage for testing
const createMockLocalStorage = () => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
		get length() {
			return Object.keys(store).length;
		},
		_setStore: (newStore: Record<string, string>) => {
			store = { ...newStore };
		},
		_getStore: () => store
	};
};

describe('Migration Utility', () => {
	let mockStorage: ReturnType<typeof createMockLocalStorage>;

	beforeEach(() => {
		mockStorage = createMockLocalStorage();
		vi.stubGlobal('localStorage', mockStorage);
	});

	describe('convertTrainState', () => {
		it('should convert 0 to "unlearned"', () => {
			expect(convertTrainState(0)).toBe('unlearned');
		});

		it('should convert 1 to "learning"', () => {
			expect(convertTrainState(1)).toBe('learning');
		});

		it('should convert 2 to "finished"', () => {
			expect(convertTrainState(2)).toBe('finished');
		});

		it('should default unknown values to "unlearned"', () => {
			expect(convertTrainState(99)).toBe('unlearned');
			expect(convertTrainState(-1)).toBe('unlearned');
		});
	});

	describe('hasMigrated', () => {
		it('should return false when migration marker is not set', () => {
			expect(hasMigrated()).toBe(false);
		});

		it('should return true when migration marker is set', () => {
			mockStorage._setStore({ [MIGRATION_COMPLETE_KEY]: 'true' });
			expect(hasMigrated()).toBe(true);
		});
	});

	describe('markMigrationComplete', () => {
		it('should set the migration marker', () => {
			markMigrationComplete();
			expect(mockStorage.setItem).toHaveBeenCalledWith(MIGRATION_COMPLETE_KEY, 'true');
		});
	});

	describe('getOldLocalStorageKeys', () => {
		it('should find old-format keys', () => {
			mockStorage._setStore({
				basic_caseSelection: '[0,1,2]',
				basic_algorithmSelection: '[0,0,0]',
				advanced_identicalAlgorithm: '[true,true]',
				casesState: '{}', // new format key - should not be found
				someOtherKey: 'value'
			});

			const keys = getOldLocalStorageKeys();
			expect(keys).toContain('basic_caseSelection');
			expect(keys).toContain('basic_algorithmSelection');
			expect(keys).toContain('advanced_identicalAlgorithm');
			expect(keys).not.toContain('casesState');
			expect(keys).not.toContain('someOtherKey');
		});

		it('should return empty array when no old keys exist', () => {
			mockStorage._setStore({
				casesState: '{}',
				v2_migration_complete: 'true'
			});

			expect(getOldLocalStorageKeys()).toEqual([]);
		});
	});

	describe('hasOldLocalStorageData', () => {
		it('should return true when old keys exist', () => {
			mockStorage._setStore({
				basic_caseSelection: '[0,1,2]'
			});
			expect(hasOldLocalStorageData()).toBe(true);
		});

		it('should return false when no old keys exist', () => {
			mockStorage._setStore({});
			expect(hasOldLocalStorageData()).toBe(false);
		});
	});

	describe('deleteOldLocalStorageKeys', () => {
		it('should delete all old-format keys', () => {
			mockStorage._setStore({
				basic_caseSelection: '[0,1,2]',
				basic_algorithmSelection: '[0,0,0]',
				casesState: '{}' // should not be deleted
			});

			deleteOldLocalStorageKeys();

			expect(mockStorage.removeItem).toHaveBeenCalledWith('basic_caseSelection');
			expect(mockStorage.removeItem).toHaveBeenCalledWith('basic_algorithmSelection');
			expect(mockStorage.removeItem).not.toHaveBeenCalledWith('casesState');
		});
	});

	describe('migrateOldLocalStorage', () => {
		it('should return null if already migrated', () => {
			mockStorage._setStore({
				[MIGRATION_COMPLETE_KEY]: 'true',
				basic_caseSelection: '[1,2,0]'
			});

			expect(migrateOldLocalStorage()).toBeNull();
		});

		it('should return null if no old data exists', () => {
			mockStorage._setStore({});

			expect(migrateOldLocalStorage()).toBeNull();
		});

		it('should migrate trainState correctly', () => {
			// Old format: [0,1,2] means case 1=unlearned, case 2=learning, case 3=finished
			mockStorage._setStore({
				basic_caseSelection: '[0,1,2]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.trainState).toBe('unlearned');
			expect(result?.basic?.[2]?.trainState).toBe('learning');
			expect(result?.basic?.[3]?.trainState).toBe('finished');
		});

		it('should migrate algorithmSelection correctly', () => {
			// Right hand: [1,2], Left hand: [3,4]
			mockStorage._setStore({
				basic_algorithmSelection: '[1,2]',
				basic_algorithmSelectionLeft: '[3,4]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.algorithmSelection).toEqual({ left: 3, right: 1 });
			expect(result?.basic?.[2]?.algorithmSelection).toEqual({ left: 4, right: 2 });
		});

		it('should migrate identicalAlgorithm correctly', () => {
			mockStorage._setStore({
				basic_identicalAlgorithm: '[true,false,true]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.identicalAlgorithm).toBe(true);
			expect(result?.basic?.[2]?.identicalAlgorithm).toBe(false);
			expect(result?.basic?.[3]?.identicalAlgorithm).toBe(true);
		});

		it('should migrate customAlgorithm correctly', () => {
			mockStorage._setStore({
				basic_customAlgorithms: '["R U R\'","","F U F\'"]',
				basic_customAlgorithmsLeft: '["","L\' U L",""]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.customAlgorithm).toEqual({ left: '', right: "R U R'" });
			expect(result?.basic?.[2]?.customAlgorithm).toEqual({ left: "L' U L", right: '' });
			expect(result?.basic?.[3]?.customAlgorithm).toEqual({ left: '', right: "F U F'" });
		});

		it('should handle all groups', () => {
			mockStorage._setStore({
				basic_caseSelection: '[1]',
				basicBack_caseSelection: '[2]',
				advanced_caseSelection: '[0]',
				expert_caseSelection: '[1]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.trainState).toBe('learning');
			expect(result?.basicBack?.[1]?.trainState).toBe('finished');
			expect(result?.advanced?.[1]?.trainState).toBe('unlearned');
			expect(result?.expert?.[1]?.trainState).toBe('learning');
		});

		it('should delete old keys when deleteOldKeys is true', () => {
			mockStorage._setStore({
				basic_caseSelection: '[1,2]'
			});

			migrateOldLocalStorage(true);

			expect(mockStorage.removeItem).toHaveBeenCalledWith('basic_caseSelection');
		});

		it('should not delete old keys when deleteOldKeys is false', () => {
			mockStorage._setStore({
				basic_caseSelection: '[1,2]'
			});

			migrateOldLocalStorage(false);

			expect(mockStorage.removeItem).not.toHaveBeenCalled();
		});

		it('should use case index + 1 for CaseIds', () => {
			// Array index 0 should become CaseId 1, index 40 should become CaseId 41
			mockStorage._setStore({
				basic_caseSelection:
					'[1,1,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			// From the sample data: index 0 = 1 (learning), index 1 = 1 (learning), index 2 = 2 (finished)
			expect(result?.basic?.[1]?.trainState).toBe('learning');
			expect(result?.basic?.[2]?.trainState).toBe('learning');
			expect(result?.basic?.[3]?.trainState).toBe('finished');
			expect(result?.basic?.[7]?.trainState).toBe('finished'); // index 6 = 2
		});

		it('should detect custom algorithm selection and set to null when custom string exists', () => {
			// basic case 1 has 2 algorithms in algPool
			// Old index of 2 (>= algPool.length) means custom was selected
			// Since a custom algorithm string exists, should set to null
			mockStorage._setStore({
				basic_algorithmSelection: '[4]', // out of bounds = custom selected
				basic_customAlgorithms: '["R U R U2"]' // custom algorithm exists
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			expect(result?.basic?.[1]?.algorithmSelection?.right).toBeNull();
			expect(result?.basic?.[1]?.customAlgorithm?.right).toBe('R U R U2');
		});

		it('should fall back to 0 when custom was selected but no custom string exists', () => {
			// Old index indicates custom was selected, but no custom algorithm string
			mockStorage._setStore({
				basic_algorithmSelection: '[99]', // way out of bounds = custom selected
				basic_customAlgorithms: '[""]' // empty string = no custom
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();
			// Should fall back to 0 since no custom algorithm string exists
			expect(result?.basic?.[1]?.algorithmSelection?.right).toBe(0);
		});

		it('should correctly migrate real data from localstorage_old.txt', () => {
			// This test uses actual data from docs/localstorage_old.txt
			mockStorage._setStore({
				// basic group
				basic_caseSelection:
					'[1,1,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basic_algorithmSelection:
					'[2,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basic_algorithmSelectionLeft:
					'[1,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basic_identicalAlgorithm:
					'[false,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				basic_customAlgorithms: JSON.stringify([
					'',
					"d' L' U L",
					'',
					'',
					"F2 (L' U' L U) F2",
					...Array(36).fill('')
				]),
				basic_customAlgorithmsLeft: JSON.stringify([
					'',
					'',
					"F U F'",
					'',
					"R' U L' U' R L U2' L' U L",
					...Array(36).fill('')
				]),

				// basicBack group
				basicBack_caseSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basicBack_customAlgorithms: JSON.stringify([
					'',
					'',
					'',
					"y (R U R')",
					'',
					...Array(36).fill('')
				]),

				// expert group
				expert_caseSelection: '[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0]',
				expert_identicalAlgorithm:
					'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true]',

				// advanced group
				advanced_identicalAlgorithm:
					'[true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				advanced_customAlgorithms: JSON.stringify([
					'',
					'',
					'',
					"L F' L2' U L U2' F",
					'',
					...Array(55).fill('')
				]),
				advanced_customAlgorithmsLeft: JSON.stringify([
					...Array(59).fill(''),
					"D R U' R' U R U' R' D'"
				])
			});

			const result = migrateOldLocalStorage(false);

			expect(result).not.toBeNull();

			// Verify basic group migration
			// Case 1: trainState=1 (learning), algorithmSelection right=2 (valid, algPool has 4 algs), left=1, identicalAlgorithm=false
			expect(result?.basic?.[1]?.trainState).toBe('learning');
			expect(result?.basic?.[1]?.algorithmSelection?.right).toBe(2); // Valid index (0,1,2,3 for 4 algs)
			expect(result?.basic?.[1]?.algorithmSelection?.left).toBe(1);
			expect(result?.basic?.[1]?.identicalAlgorithm).toBe(false);

			// Case 2: has custom algorithm "d' L' U L" for right hand
			expect(result?.basic?.[2]?.customAlgorithm?.right).toBe("d' L' U L");

			// Case 3: trainState=2 (finished), has custom algorithm "F U F'" for left hand
			expect(result?.basic?.[3]?.trainState).toBe('finished');
			expect(result?.basic?.[3]?.customAlgorithm?.left).toBe("F U F'");

			// Case 4: identicalAlgorithm=false
			expect(result?.basic?.[4]?.identicalAlgorithm).toBe(false);

			// Case 5: custom alg selected
			expect(result?.basic?.[5]?.algorithmSelection?.right).toBeNull();
			expect(result?.basic?.[5]?.algorithmSelection?.left).toBeNull();
			expect(result?.basic?.[5]?.customAlgorithm?.right).toBe("F2 (L' U' L U) F2");
			expect(result?.basic?.[5]?.customAlgorithm?.left).toBe("R' U L' U' R L U2' L' U L");

			// Case 7: trainState=2 (finished)
			expect(result?.basic?.[7]?.trainState).toBe('finished');

			// Verify basicBack group
			// Case 4: has custom algorithm "y (R U R')"
			expect(result?.basicBack?.[4]?.customAlgorithm?.right).toBe("y (R U R')");

			// Verify expert group
			// Case 1: trainState=1 (learning)
			expect(result?.expert?.[1]?.trainState).toBe('learning');
			// Case 15: identicalAlgorithm=false
			expect(result?.expert?.[15]?.identicalAlgorithm).toBe(false);
			// Case 16: trainState=2 (finished)
			expect(result?.expert?.[16]?.trainState).toBe('finished');

			// Verify advanced group
			// Case 4: has custom algorithm
			expect(result?.advanced?.[4]?.customAlgorithm?.right).toBe("L F' L2' U L U2' F");
			// Case 5: identicalAlgorithm=false
			expect(result?.advanced?.[5]?.identicalAlgorithm).toBe(false);
			// Case 60: has custom algorithm on left
			expect(result?.advanced?.[60]?.customAlgorithm?.left).toBe("D R U' R' U R U' R' D'");
		});
	});
});
