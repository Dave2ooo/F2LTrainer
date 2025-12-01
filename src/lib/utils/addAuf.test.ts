import { describe, it, expect } from 'vitest';
import { concatinateAuf } from './addAuf';

describe('concatinateAuf', () => {
	describe('basic AUF merging without brackets', () => {
		it('should prepend AUF when alg does not start with AUF move', () => {
			const [scramble, alg] = concatinateAuf('R U R', "R U' R'", 'U');
			expect(scramble).toBe('R U R U');
			expect(alg).toBe("U' R U' R'");
		});

		it('should merge AUF when alg starts with U move', () => {
			const [scramble, alg] = concatinateAuf('R U R', "U R U' R'", 'U');
			expect(scramble).toBe('R U R U');
			// U (first move) + U' (mirror of U) = '' (cancel)
			expect(alg).toBe("R U' R'");
		});

		it("should merge AUF when alg starts with U' move", () => {
			const [scramble, alg] = concatinateAuf('R U R', "U' R U' R'", 'U');
			expect(scramble).toBe('R U R U');
			// U' (first move) + U' (mirror of U) = U2
			expect(alg).toBe("U2 R U' R'");
		});

		it('should return unchanged when AUF is empty', () => {
			const [scramble, alg] = concatinateAuf('R U R', "U R U' R'", '');
			expect(scramble).toBe('R U R');
			expect(alg).toBe("U R U' R'");
		});
	});

	describe('AUF merging with brackets', () => {
		it('should merge AUF when alg starts with bracket containing U move', () => {
			// Algorithm: (U R U') R' with AUF U'
			// Mirror of U' is U
			// U (first move in bracket) + U (mirror AUF) = U2
			const [scramble, alg] = concatinateAuf("R' F R F'", "(U R U') R'", "U'");
			expect(scramble).toBe("R' F R F' U'");
			expect(alg).toBe("(U2 R U') R'");
		});

		it('should remove opening bracket when U moves cancel out', () => {
			// Algorithm: (U R U') R' with AUF U
			// Mirror of U is U'
			// U (first move in bracket) + U' (mirror AUF) = '' (cancel)
			const [scramble, alg] = concatinateAuf("R' F R F'", "(U R U') R'", 'U');
			expect(scramble).toBe("R' F R F' U");
			// When U cancels, remove opening bracket and matching closing bracket
			expect(alg).toBe("R U' R'");
		});

		it("should merge AUF when alg starts with bracket containing U' move", () => {
			// Algorithm: (U' R' U' R) with AUF U
			// Mirror of U is U'
			// U' (first move in bracket) + U' (mirror AUF) = U2
			const [scramble, alg] = concatinateAuf('R U R', "(U' R' U' R)", 'U');
			expect(scramble).toBe('R U R U');
			expect(alg).toBe("(U2 R' U' R)");
		});

		it("should remove opening bracket when U' moves cancel out", () => {
			// Algorithm: (U' R' U R) with AUF U'
			// Mirror of U' is U
			// U' (first move in bracket) + U (mirror AUF) = '' (cancel)
			const [scramble, alg] = concatinateAuf('R U R', "(U' R' U R)", "U'");
			expect(scramble).toBe("R U R U'");
			// When U' cancels, remove opening bracket and matching closing bracket
			expect(alg).toBe("R' U R");
		});

		it('should handle U2 in bracket', () => {
			// Algorithm: (U2 R U') R' with AUF U
			// Mirror of U is U'
			// U2 (first move in bracket) + U' (mirror AUF) = U
			const [scramble, alg] = concatinateAuf('R', "(U2 R U') R'", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("(U R U') R'");
		});

		it('should not modify bracket when first move is not an AUF', () => {
			// Algorithm: (R U R') with AUF U
			// First move in bracket is R, not an AUF
			const [scramble, alg] = concatinateAuf('R', "(R U R')", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("U' (R U R')");
		});

		it('should handle empty bracket content gracefully', () => {
			// Algorithm: ( R U R') - first token is just '(' with space after
			// This is an edge case - bracket with empty content after split
			const [scramble, alg] = concatinateAuf('R', "( R U R')", 'U');
			expect(scramble).toBe('R U');
			// Empty string after '(' is not an AUF, so just prepend the mirror AUF
			expect(alg).toBe("U' ( R U R')");
		});

		it('should handle multiple bracket groups', () => {
			// Algorithm: (U R' U' R) U (R' U2 R) with AUF U
			// Mirror of U is U'
			// U (first move in bracket) + U' (mirror AUF) = '' (cancel)
			const [scramble, alg] = concatinateAuf('R', "(U R' U' R) U (R' U2 R)", 'U');
			expect(scramble).toBe('R U');
			// First U cancels, opening bracket removed, first ) removed
			expect(alg).toBe("R' U' R U (R' U2 R)");
		});

		it('should handle single-move bracket group', () => {
			// Algorithm: (U) R U' R' with AUF U
			// Mirror of U is U'
			// U (first move in bracket) + U' (mirror AUF) = '' (cancel)
			const [scramble, alg] = concatinateAuf('R', "(U) R U' R'", 'U');
			expect(scramble).toBe('R U');
			// U cancels, both brackets removed
			expect(alg).toBe("R U' R'");
		});

		it('should merge single-move bracket group without cancelling', () => {
			// Algorithm: (U) R U' R' with AUF U'
			// Mirror of U' is U
			// U (first move in bracket) + U (mirror AUF) = U2
			const [scramble, alg] = concatinateAuf('R', "(U) R U' R'", "U'");
			expect(scramble).toBe("R U'");
			// U + U = U2, keep brackets
			expect(alg).toBe("(U2) R U' R'");
		});
	});
});
