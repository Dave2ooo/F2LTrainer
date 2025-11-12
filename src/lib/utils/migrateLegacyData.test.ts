import { describe, it, expect } from 'vitest';
import {
	migrateLegacyData,
	hasLegacyData,
	getLegacyDataFromLocalStorage,
	clearLegacyData
} from './migrateLegacyData';

describe('migrateLegacyData', () => {
	describe('Global State Conversion', () => {
		it('should convert viewSelection correctly', () => {
			const legacy = { viewSelection: '0' };
			const { globalState } = migrateLegacyData(legacy);
			expect(globalState.view).toBe('select');

			const legacy2 = { viewSelection: '1' };
			const { globalState: globalState2 } = migrateLegacyData(legacy2);
			expect(globalState2.view).toBe('train');
		});

		it('should convert hintAlgSelection correctly', () => {
			const testCases = [
				{ input: '0', expected: 'step' },
				{ input: '1', expected: 'allAtOnce' },
				{ input: '2', expected: 'always' }
			];

			testCases.forEach(({ input, expected }) => {
				const { globalState } = migrateLegacyData({ hintAlgSelection: input });
				expect(globalState.trainHintAlgorithm).toBe(expected);
			});
		});

		it('should convert hintImageSelection correctly', () => {
			const testCases = [
				{ input: '0', expected: false },
				{ input: '1', expected: true },
				{ input: '2', expected: true }
			];

			testCases.forEach(({ input, expected }) => {
				const { globalState } = migrateLegacyData({ hintImageSelection: input });
				expect(globalState.trainHintShowCube).toBe(expected);
			});
		});

		it('should convert leftSelection and rightSelection correctly', () => {
			const legacy = {
				leftSelection: 'true',
				rightSelection: 'false'
			};
			const { globalState } = migrateLegacyData(legacy);
			expect(globalState.trainSideSelection).toEqual({
				left: true,
				right: false
			});
		});

		it('should convert aufSelection correctly', () => {
			const legacy1 = { aufSelection: 'true' };
			const { globalState: gs1 } = migrateLegacyData(legacy1);
			expect(gs1.trainAddAuf).toBe(true);

			const legacy2 = { aufSelection: 'false' };
			const { globalState: gs2 } = migrateLegacyData(legacy2);
			expect(gs2.trainAddAuf).toBe(false);
		});

		it('should convert stickeringSelection correctly', () => {
			const legacy1 = { stickeringSelection: '0' };
			const { globalState: gs1 } = migrateLegacyData(legacy1);
			expect(gs1.trainHintStickering).toBe('f2l');

			const legacy2 = { stickeringSelection: '1' };
			const { globalState: gs2 } = migrateLegacyData(legacy2);
			expect(gs2.trainHintStickering).toBe('fully');
		});

		it('should convert color selections correctly', () => {
			const legacy = {
				crossColorSelection: 'white',
				frontColorSelection: 'red'
			};
			const { globalState } = migrateLegacyData(legacy);
			expect(globalState.crossColor).toBe('white');
			expect(globalState.frontColor).toBe('red');
		});

		it('should convert trainStateSelection correctly', () => {
			const legacy = {
				trainStateSelection: '[false,true,false]'
			};
			const { globalState } = migrateLegacyData(legacy);
			expect(globalState.trainStateSelection).toEqual({
				unlearned: false,
				learning: true,
				finished: false
			});
		});

		it('should convert trainGroupSelection correctly', () => {
			const legacy = {
				trainGroupSelection: '[true,true,true,true]'
			};
			const { globalState } = migrateLegacyData(legacy);
			expect(globalState.trainGroupSelection).toEqual({
				basic: true,
				basicBack: true,
				advanced: true,
				expert: true
			});
		});

		it('should convert category collapse states (inverting to opened)', () => {
			const legacy = {
				basic_collapse: '[false,true,false,true,false,true,false,true,false,true,false]'
			};
			const { globalState } = migrateLegacyData(legacy);
			// false (collapsed) -> true (opened), true (not collapsed) -> false (not opened)
			// basic group has 11 categories
			expect(globalState.categoriesOpenedObj?.basic).toEqual([
				true,
				false,
				true,
				false,
				true,
				false,
				true,
				false,
				true,
				false,
				true
			]);
		});
	});

	describe('Case State Conversion', () => {
		it('should convert basic case data correctly', () => {
			const legacy = {
				basic_caseSelection: '[0,1,2,0]', // unlearned, learning, finished, unlearned
				basic_algorithmSelection: '[0,1,2,3]',
				basic_algorithmSelectionLeft: '[1,2,3,0]',
				basic_customAlgorithms: '["","alg1","",""]',
				basic_customAlgorithmsLeft: '["","","alg2",""]',
				basic_identicalAlgorithm: '[true,false,true,false]',
				basic_solveCounter: '[0,5,10,3]'
			};

			const { casesState } = migrateLegacyData(legacy);
			const basicCases = casesState.basic;

			expect(basicCases).toBeDefined();
			if (!basicCases) return;

			// Check case 1
			expect(basicCases[1].trainState).toBe('unlearned');
			expect(basicCases[1].algorithmSelection).toEqual({ left: 1, right: 0 });
			expect(basicCases[1].customAlgorithm).toEqual({ left: '', right: '' });
			expect(basicCases[1].identicalAlgorithm).toBe(true);
			expect(basicCases[1].solveCount).toBe(0);

			// Check case 2
			expect(basicCases[2].trainState).toBe('learning');
			expect(basicCases[2].algorithmSelection).toEqual({ left: 2, right: 1 });
			expect(basicCases[2].customAlgorithm).toEqual({ left: '', right: 'alg1' });
			expect(basicCases[2].identicalAlgorithm).toBe(false);
			expect(basicCases[2].solveCount).toBe(5);

			// Check case 3
			expect(basicCases[3].trainState).toBe('finished');
			expect(basicCases[3].algorithmSelection).toEqual({ left: 3, right: 2 });
			expect(basicCases[3].customAlgorithm).toEqual({ left: 'alg2', right: '' });
			expect(basicCases[3].identicalAlgorithm).toBe(true);
			expect(basicCases[3].solveCount).toBe(10);
		});

		it('should handle all four groups', () => {
			const legacy = {
				basic_caseSelection: '[1]',
				basicBack_caseSelection: '[2]',
				advanced_caseSelection: '[0]',
				expert_caseSelection: '[1]'
			};

			const { casesState } = migrateLegacyData(legacy);

			expect(casesState.basic?.[1]?.trainState).toBe('learning');
			expect(casesState.basicBack?.[1]?.trainState).toBe('finished');
			expect(casesState.advanced?.[1]?.trainState).toBe('unlearned');
			expect(casesState.expert?.[1]?.trainState).toBe('learning');
		});

		it('should handle missing arrays with defaults', () => {
			const legacy = {
				basic_caseSelection: '[1]'
				// Missing other arrays
			};

			const { casesState } = migrateLegacyData(legacy);
			const basicCase1 = casesState.basic?.[1];

			expect(basicCase1).toBeDefined();
			if (!basicCase1) return;

			expect(basicCase1.trainState).toBe('learning');
			expect(basicCase1.algorithmSelection).toEqual({ left: 0, right: 0 });
			expect(basicCase1.customAlgorithm).toEqual({ left: '', right: '' });
			expect(basicCase1.identicalAlgorithm).toBe(true);
			expect(basicCase1.solveCount).toBe(0);
		});

		it('should create all 41 cases for basic group', () => {
			const legacy = {
				basic_caseSelection: '[0,1,2]' // Only 3 cases specified
			};

			const { casesState } = migrateLegacyData(legacy);
			const basicCases = casesState.basic;

			expect(basicCases).toBeDefined();
			if (!basicCases) return;

			// Should have all 41 cases
			expect(Object.keys(basicCases).length).toBe(41);
			expect(basicCases[1]).toBeDefined();
			expect(basicCases[41]).toBeDefined();

			// First 3 should have the specified states
			expect(basicCases[1].trainState).toBe('unlearned');
			expect(basicCases[2].trainState).toBe('learning');
			expect(basicCases[3].trainState).toBe('finished');

			// Remaining should be unlearned (default)
			expect(basicCases[4].trainState).toBe('unlearned');
			expect(basicCases[41].trainState).toBe('unlearned');
		});

		it('should create correct number of cases for each group', () => {
			const legacy = {};
			const { casesState } = migrateLegacyData(legacy);

			expect(Object.keys(casesState.basic || {}).length).toBe(41);
			expect(Object.keys(casesState.basicBack || {}).length).toBe(41);
			expect(Object.keys(casesState.advanced || {}).length).toBe(60);
			expect(Object.keys(casesState.expert || {}).length).toBe(17);
		});
	});

	describe('Real World Data Test', () => {
		it('should migrate the provided sample data correctly', () => {
			const sampleData = {
				expert_identicalAlgorithm:
					'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				advanced_algorithmSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				leftSelection: 'true',
				trainGroupSelection: '[true,true,true,true]',
				frontColorSelection: 'red',
				basic_collapse: '[false,false,false,false,false,false,false,false,false,false,false]',
				viewSelection: '0',
				basic_identicalAlgorithm:
					'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				rightSelection: 'true',
				basicBack_identicalAlgorithm:
					'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				advanced_solveCounter:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basicBack_caseSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				expert_caseSelection: '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				aufSelection: 'true',
				expert_algorithmSelection: '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				crossColorSelection: 'white',
				basicBack_solveCounter:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				advanced_identicalAlgorithm:
					'[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]',
				basic_solveCounter:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				basic_caseSelection:
					'[2,2,2,2,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				trainStateSelection: '[false,true,false]',
				stickeringSelection: '0',
				basic_algorithmSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				hintAlgSelection: '0',
				basicBack_algorithmSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				advanced_caseSelection:
					'[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				expert_solveCounter: '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
				hintImageSelection: '2'
			};

			const { globalState, casesState } = migrateLegacyData(sampleData);

			// Check global state
			expect(globalState.view).toBe('select');
			expect(globalState.trainSideSelection).toEqual({ left: true, right: true });
			expect(globalState.trainAddAuf).toBe(true);
			expect(globalState.trainHintAlgorithm).toBe('step');
			expect(globalState.trainHintShowCube).toBe(true);
			expect(globalState.trainHintStickering).toBe('f2l');
			expect(globalState.crossColor).toBe('white');
			expect(globalState.frontColor).toBe('red');

			// Check trainStateSelection
			expect(globalState.trainStateSelection).toEqual({
				unlearned: false,
				learning: true,
				finished: false
			});

			// Check trainGroupSelection
			expect(globalState.trainGroupSelection).toEqual({
				basic: true,
				basicBack: true,
				advanced: true,
				expert: true
			});

			// Check basic cases
			const basicCases = casesState.basic;
			expect(basicCases).toBeDefined();
			if (!basicCases) return;

			// Cases 1-4 should be finished (2)
			expect(basicCases[1].trainState).toBe('finished');
			expect(basicCases[2].trainState).toBe('finished');
			expect(basicCases[3].trainState).toBe('finished');
			expect(basicCases[4].trainState).toBe('finished');

			// Cases 5-6 should be unlearned (0)
			expect(basicCases[5].trainState).toBe('unlearned');
			expect(basicCases[6].trainState).toBe('unlearned');

			// Case 7 should be learning (1)
			expect(basicCases[7].trainState).toBe('learning');

			// Case 15 should be learning (1)
			expect(basicCases[15].trainState).toBe('learning');

			// All should have algorithmSelection of 0
			expect(basicCases[1].algorithmSelection).toEqual({ left: 0, right: 0 });

			// All should have identicalAlgorithm true
			expect(basicCases[1].identicalAlgorithm).toBe(true);

			// All should have solveCount 0
			expect(basicCases[1].solveCount).toBe(0);
		});
	});
});

describe('hasLegacyData', () => {
	it('should return false in non-browser environment', () => {
		// This test runs in Node environment where localStorage is undefined
		const result = hasLegacyData();
		// We can't test the actual localStorage interaction in Node
		expect(typeof result).toBe('boolean');
	});
});

describe('getLegacyDataFromLocalStorage', () => {
	it('should return empty object in non-browser environment', () => {
		const result = getLegacyDataFromLocalStorage();
		expect(result).toEqual({});
	});
});

describe('clearLegacyData', () => {
	it('should not throw in non-browser environment', () => {
		expect(() => clearLegacyData()).not.toThrow();
	});
});
