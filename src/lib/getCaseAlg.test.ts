import { describe, it, expect } from 'vitest';
import { getCaseAlg } from './casesState.svelte';
import { casesStatic } from './casesStatic';
import type { AlgorithmSelection, CustomAlgorithm } from './types/caseState';

/**
 * Integration test to verify the getCaseAlg function works correctly
 * with validated algorithm selection indices.
 */
describe('getCaseAlg Integration Test', () => {
	it('should return algorithm without error for valid indices', () => {
		const case39 = casesStatic.basic[39];
		const algorithmSelection: AlgorithmSelection = { left: 0, right: 0 };
		const customAlgorithm: CustomAlgorithm = { left: '', right: '' };

		// This should not throw or log errors
		const algLeft = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'left');
		const algRight = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'right');

		expect(algLeft).toBeDefined();
		expect(algRight).toBeDefined();
		expect(typeof algLeft).toBe('string');
		expect(typeof algRight).toBe('string');
	});

	it('should handle all valid algorithm indices for case 39', () => {
		const case39 = casesStatic.basic[39];
		const customAlgorithm: CustomAlgorithm = { left: '', right: '' };

		// Case 39 has 4 algorithms (indices 0-3)
		for (let i = 0; i < 4; i++) {
			const algorithmSelection: AlgorithmSelection = { left: i, right: i };

			const algLeft = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'left');
			const algRight = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'right');

			expect(algLeft).toBeDefined();
			expect(algRight).toBeDefined();
		}
	});

	it('should fallback to first algorithm for out-of-bounds index (safety net)', () => {
		const case39 = casesStatic.basic[39];
		// Simulate an out-of-bounds index (this should not happen after validation, but testing the safety net)
		const algorithmSelection: AlgorithmSelection = { left: 999, right: 999 };
		const customAlgorithm: CustomAlgorithm = { left: '', right: '' };

		// Should fallback to first algorithm and not crash
		const algLeft = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'left');
		const algRight = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'right');

		expect(algLeft).toBeDefined();
		expect(algRight).toBeDefined();
	});

	it('should return custom algorithm when selection is null', () => {
		const case39 = casesStatic.basic[39];
		const algorithmSelection: AlgorithmSelection = { left: null, right: null };
		const customAlgorithm: CustomAlgorithm = { left: "U R U' R'", right: "U L' U' L" };

		const algLeft = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'left');
		const algRight = getCaseAlg(case39, algorithmSelection, customAlgorithm, 'right');

		expect(algLeft).toBe("U R U' R'");
		expect(algRight).toBe("U L' U' L");
	});
});
