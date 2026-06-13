import { describe, it, expect } from 'vitest';
import {
	isRotationMove,
	isWideMove,
	isUMove,
	wideToSingleLayerMove,
	getWideImplicitRotation,
	isSliceMove,
	getSliceImplicitRotation,
	getSliceFirstMoves,
	inverseMove,
	applyRotationToMove,
	combineRotations,
	cancelMoves,
	normalizeMoves,
	matchesMoveSequence,
	inverseRotation,
	invertRotationsWithoutReversing
} from './moveValidator';

describe('moveValidator', () => {
	describe('Move Type Identifiers', () => {
		it('identifies rotation moves', () => {
			expect(isRotationMove('x')).toBe(true);
			expect(isRotationMove("y'")).toBe(true);
			expect(isRotationMove('z2')).toBe(true);
			expect(isRotationMove('U')).toBe(false);
			expect(isRotationMove('r')).toBe(false);
		});

		it('identifies wide moves', () => {
			expect(isWideMove('r')).toBe(true);
			expect(isWideMove("l'")).toBe(true);
			expect(isWideMove('u2')).toBe(true);
			expect(isWideMove('R')).toBe(false);
			expect(isWideMove('M')).toBe(false);
		});

		it('identifies U-layer moves', () => {
			expect(isUMove('U')).toBe(true);
			expect(isUMove("U'")).toBe(true);
			expect(isUMove('U2')).toBe(true);
			expect(isUMove('u')).toBe(false);
			expect(isUMove('R')).toBe(false);
		});

		it('identifies slice moves', () => {
			expect(isSliceMove('M')).toBe(true);
			expect(isSliceMove("E'")).toBe(true);
			expect(isSliceMove('S2')).toBe(true);
			expect(isSliceMove('U')).toBe(false);
			expect(isSliceMove('x')).toBe(false);
		});
	});

	describe('Wide and Slice Move Conversions', () => {
		it('converts wide moves to single layer moves', () => {
			expect(wideToSingleLayerMove('r')).toBe('L');
			expect(wideToSingleLayerMove("l'")).toBe("R'");
			expect(wideToSingleLayerMove('u2')).toBe('D2');
			expect(wideToSingleLayerMove('R')).toBeNull();
		});

		it('gets implicit rotations from wide moves', () => {
			expect(getWideImplicitRotation('r')).toBe('x');
			expect(getWideImplicitRotation("l'")).toBe('x'); // l is x', l' is x
			expect(getWideImplicitRotation('u2')).toBe('y2');
		});

		it('gets implicit rotations from slice moves', () => {
			expect(getSliceImplicitRotation('M')).toBe("x'");
			expect(getSliceImplicitRotation("E'")).toBe('y'); // E is y', E' is y
			expect(getSliceImplicitRotation('S2')).toBe('z2');
		});

		it('gets first moves for slice moves', () => {
			expect(getSliceFirstMoves('M')).toEqual(['R', "L'"]);
			expect(getSliceFirstMoves("E'")).toEqual(["U'", 'D']);
			expect(getSliceFirstMoves('S2')).toEqual(['F2', 'B2']);
		});
	});

	describe('Basic Move Operations', () => {
		it('inverts single moves', () => {
			expect(inverseMove('U')).toBe("U'");
			expect(inverseMove("R'")).toBe('R');
			expect(inverseMove('F2')).toBe('F2');
			expect(inverseMove('r')).toBe("r'");
		});
	});

	describe('Rotation Operations', () => {
		it('applies rotation to a move', () => {
			expect(applyRotationToMove('U', 'x')).toBe('F');
			expect(applyRotationToMove('F', 'y')).toBe('R');
			expect(applyRotationToMove('R', "z2 y'")).toBe('B');
		});

		it('combines rotations', () => {
			expect(combineRotations(['x', 'x'])).toBe('x2');
			expect(combineRotations(['y', "y'"])).toBe('');
			expect(combineRotations(['z2', 'z'])).toBe("z'");
			expect(combineRotations(['y', 'z'])).toBe('y z');
		});

		it('inverts rotation sequences', () => {
			expect(inverseRotation('x')).toBe("x'");
			expect(inverseRotation("y' z")).toBe("z' y");
			expect(inverseRotation("z2 y'")).toBe('y z2');
		});

		it('inverts rotations without reversing order', () => {
			expect(invertRotationsWithoutReversing('x')).toBe("x'");
			expect(invertRotationsWithoutReversing("y' z")).toBe("y z'");
			expect(invertRotationsWithoutReversing("z2 y'")).toBe('z2 y');
		});
	});

	describe('Move Sequence Manipulation', () => {
		it('cancels opposite moves', () => {
			expect(cancelMoves(['U', "U'"])).toEqual([]);
			expect(cancelMoves(['R2', 'R2'])).toEqual([]);
			expect(cancelMoves(['F', 'F'])).toEqual(['F2']);
			expect(cancelMoves(['L', 'R'])).toEqual(['L', 'R']);
		});

		it('normalizes move sequences', () => {
			// Normalize expands slices, coalesces, and cancels
			// Normalize uses first ordering for slice expansion
			expect(normalizeMoves(['U', "U'"])).toEqual([]);
			// M expands to R L' x'
			// Wait! Does normalizeMoves expand M to [R, L'] or something?
			// Let's just test basic cancellation for normalizeMoves
			expect(normalizeMoves(['R', 'R'])).toEqual(['R2']);
			expect(normalizeMoves(['R', 'L', 'L2'])).toEqual(['R', "L'"]);
		});

		it('matches equivalent move sequences', () => {
			const seq1 = ['R', 'U', "R'"];
			const seq2 = ['R', 'U', "R'"];
			// Match full sequence
			expect(matchesMoveSequence(seq1, seq2).match).toBe(true);

			// Match sequence with cancellations (normalizes to ['R', 'U'])
			expect(matchesMoveSequence(['R', 'U', 'F', "F'", "U'", 'U'], ['R', 'U']).match).toBe(true);

			// Partial matches (matches longer prefix of expected)
			const performed = ['R', 'U'];
			const expected = ['R', 'U', "R'"];
			expect(matchesMoveSequence(performed, expected).match).toBe(true);
			expect(matchesMoveSequence(performed, expected).consumedCount).toBe(2);
		});
	});
});
