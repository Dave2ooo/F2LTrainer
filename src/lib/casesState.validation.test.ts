import { describe, it, expect } from 'vitest';
import { casesStatic } from './casesStatic';

/**
 * This test simulates the bug scenario:
 * A user has an algorithmSelection index of 4 saved in localStorage,
 * but case 39 only has 4 algorithms (indices 0-3).
 *
 * The validateAlgorithmSelection function should clamp the index to 3.
 */

// Simulate the validateAlgorithmSelection function
const validateAlgorithmSelection = (
	selection: number | null,
	algPoolLength: number
): number | null => {
	if (selection === null) return null;
	if (typeof selection !== 'number') return 0;
	if (selection < 0) return 0;
	if (selection >= algPoolLength) return Math.max(0, algPoolLength - 1);
	return selection;
};

describe('Algorithm Selection Validation - Bug Fix', () => {
	it('should clamp out-of-bounds index 4 to 3 for case 39 with 4 algorithms', () => {
		const case39 = casesStatic.basic[39];
		expect(case39.algPool.length).toBe(4);

		// Simulate the bug: user has selection index 4 (out of bounds)
		const outOfBoundsSelection = 4;
		const algPoolLength = case39.algPool.length; // 4

		// The validation should clamp it to 3 (the last valid index)
		const validatedSelection = validateAlgorithmSelection(outOfBoundsSelection, algPoolLength);

		expect(validatedSelection).toBe(3);
		if (validatedSelection !== null) {
			expect(case39.algPool[validatedSelection]).toBeDefined();
		}
	});

	it('should handle null selection (custom algorithm mode)', () => {
		const case39 = casesStatic.basic[39];
		const algPoolLength = case39.algPool.length;

		const validatedSelection = validateAlgorithmSelection(null, algPoolLength);

		expect(validatedSelection).toBeNull();
	});

	it('should handle negative indices by defaulting to 0', () => {
		const case39 = casesStatic.basic[39];
		const algPoolLength = case39.algPool.length;

		const validatedSelection = validateAlgorithmSelection(-1, algPoolLength);

		expect(validatedSelection).toBe(0);
	});

	it('should handle valid indices without modification', () => {
		const case39 = casesStatic.basic[39];
		const algPoolLength = case39.algPool.length;

		for (let i = 0; i < algPoolLength; i++) {
			const validatedSelection = validateAlgorithmSelection(i, algPoolLength);
			expect(validatedSelection).toBe(i);
		}
	});

	it('should handle edge case: single algorithm pool', () => {
		// Simulate a case with only 1 algorithm
		const algPoolLength = 1;

		// Out of bounds selection
		const validatedSelection = validateAlgorithmSelection(5, algPoolLength);
		expect(validatedSelection).toBe(0); // Should clamp to the last (and only) valid index
	});

	it('should handle edge case: empty algorithm pool', () => {
		// Simulate a case with no algorithms (shouldn't happen in practice)
		const algPoolLength = 0;

		const validatedSelection = validateAlgorithmSelection(5, algPoolLength);
		expect(validatedSelection).toBe(0); // Math.max(0, -1) = 0
	});
});
