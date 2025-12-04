import { describe, it, expect } from 'vitest';
import getRotationAlg from './rotation';
import { ROTATION_ALG } from './types/rotation';

describe('getRotationAlg', () => {
	it('should return empty string for yellow cross and green front (not fallback)', () => {
		const result = getRotationAlg('yellow', 'green');
		expect(result).toBe('');
		expect(ROTATION_ALG['yellow']['green']).toBe('');
	});

	it('should return empty string for white cross and white front (not fallback)', () => {
		const result = getRotationAlg('white', 'white');
		expect(result).toBe('');
		expect(ROTATION_ALG['white']['white']).toBe('');
	});

	it('should return correct rotation for white cross and red front', () => {
		const result = getRotationAlg('white', 'red');
		expect(result).toBe("z2 y'");
		expect(ROTATION_ALG['white']['red']).toBe("z2 y'");
	});

	it('should return correct rotation for yellow cross and red front', () => {
		const result = getRotationAlg('yellow', 'red');
		expect(result).toBe('y');
		expect(ROTATION_ALG['yellow']['red']).toBe('y');
	});

	it('should handle array inputs by taking first element', () => {
		const result = getRotationAlg(['yellow', 'white'], ['green', 'red']);
		expect(result).toBe('');
	});

	it('should return fallback for undefined cross/front combination', () => {
		// This tests a combination that doesn't exist in ROTATION_ALG
		const result = getRotationAlg('yellow', 'yellow');
		expect(result).toBe('');
	});
});
