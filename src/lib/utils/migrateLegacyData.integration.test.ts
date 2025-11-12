import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	hasLegacyData,
	getLegacyDataFromLocalStorage,
	migrateLegacyData,
	clearLegacyData
} from './migrateLegacyData';

/**
 * Integration tests for the migration system.
 * These tests verify that the migration system works correctly when integrated
 * with the state initialization code.
 */
describe('Migration Integration', () => {
	// Mock localStorage
	let localStorageMock: Record<string, string>;

	beforeEach(() => {
		localStorageMock = {};
		global.localStorage = {
			getItem: (key: string) => localStorageMock[key] || null,
			setItem: (key: string, value: string) => {
				localStorageMock[key] = value;
			},
			removeItem: (key: string) => {
				delete localStorageMock[key];
			},
			clear: () => {
				localStorageMock = {};
			},
			get length() {
				return Object.keys(localStorageMock).length;
			},
			key: (index: number) => Object.keys(localStorageMock)[index] || null
		} as Storage;
	});

	afterEach(() => {
		// Clean up
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		delete (global as any).localStorage;
	});

	it('should detect legacy data when legacy keys are present', () => {
		// Set up legacy data
		localStorageMock['viewSelection'] = '1';
		localStorageMock['hintAlgSelection'] = '2';

		expect(hasLegacyData()).toBe(true);
	});

	it('should not detect legacy data when only new keys are present', () => {
		// Set up new format data
		localStorageMock['globalState'] = JSON.stringify({ view: 'select' });
		localStorageMock['casesState'] = JSON.stringify({});

		expect(hasLegacyData()).toBe(false);
	});

	it('should migrate legacy data correctly', () => {
		// Set up comprehensive legacy data
		localStorageMock['viewSelection'] = '1';
		localStorageMock['hintAlgSelection'] = '0';
		localStorageMock['hintImageSelection'] = '2';
		localStorageMock['leftSelection'] = 'true';
		localStorageMock['rightSelection'] = 'false';
		localStorageMock['aufSelection'] = 'true';
		localStorageMock['crossColorSelection'] = 'white';
		localStorageMock['frontColorSelection'] = 'red';
		localStorageMock['trainStateSelection'] = '[true,false,true]';
		localStorageMock['trainGroupSelection'] = '[false,true,false,true]';
		localStorageMock['basic_caseSelection'] = '[1,2,0]';

		const legacyData = getLegacyDataFromLocalStorage();
		const { globalState, casesState } = migrateLegacyData(legacyData);

		expect(globalState.view).toBe('train');
		expect(globalState.trainHintAlgorithm).toBe('step');
		expect(globalState.trainHintShowCube).toBe(true);
		expect(globalState.trainSideSelection).toEqual({ left: true, right: false });
		expect(globalState.trainAddAuf).toBe(true);
		expect(globalState.crossColor).toBe('white');
		expect(globalState.frontColor).toBe('red');
		expect(globalState.trainStateSelection).toEqual({
			unlearned: true,
			learning: false,
			finished: true
		});
		expect(globalState.trainGroupSelection).toEqual({
			basic: false,
			basicBack: true,
			advanced: false,
			expert: true
		});

		expect(casesState.basic?.[1]?.trainState).toBe('learning');
		expect(casesState.basic?.[2]?.trainState).toBe('finished');
		expect(casesState.basic?.[3]?.trainState).toBe('unlearned');
	});

	it('should clear legacy keys after migration', () => {
		// Set up legacy data
		localStorageMock['viewSelection'] = '1';
		localStorageMock['hintAlgSelection'] = '0';
		localStorageMock['basic_caseSelection'] = '[1,2,0]';

		expect(localStorageMock['viewSelection']).toBeDefined();
		expect(localStorageMock['hintAlgSelection']).toBeDefined();
		expect(localStorageMock['basic_caseSelection']).toBeDefined();

		clearLegacyData();

		expect(localStorageMock['viewSelection']).toBeUndefined();
		expect(localStorageMock['hintAlgSelection']).toBeUndefined();
		expect(localStorageMock['basic_caseSelection']).toBeUndefined();
	});
});
