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

	describe('AUF merging with repetition notation', () => {
		it("should expand repetition when first move is AUF - (U R U' R')3 with AUF U", () => {
			// Algorithm: (U R U' R')3 with AUF U
			// Expand: U R U' R' (U R U' R')2
			// Mirror of U is U'
			// First U + U' = '' (cancel)
			const [scramble, alg] = concatinateAuf('R', "(U R U' R')3", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("R U' R' (U R U' R')2");
		});

		it("should expand repetition when first move is AUF - (U' R' U R)3 with AUF U'", () => {
			// Algorithm: (U' R' U R)3 with AUF U'
			// Expand: U' R' U R (U' R' U R)2
			// Mirror of U' is U
			// First U' + U = '' (cancel)
			const [scramble, alg] = concatinateAuf('R', "(U' R' U R)3", "U'");
			expect(scramble).toBe("R U'");
			expect(alg).toBe("R' U R (U' R' U R)2");
		});

		it("should expand repetition and merge when moves don't cancel", () => {
			// Algorithm: (U R U' R')2 with AUF U'
			// Expand: U R U' R' (U R U' R')
			// Mirror of U' is U
			// First U + U = U2
			const [scramble, alg] = concatinateAuf('R', "(U R U' R')2", "U'");
			expect(scramble).toBe("R U'");
			expect(alg).toBe("(U2 R U' R') (U R U' R')");
		});

		it('should expand repetition to 1 when number is 2', () => {
			// Algorithm: (U R U' R')2 with AUF U
			// Expand: U R U' R' (U R U' R')
			// But when repetition becomes 1, remove the number
			// Mirror of U is U'
			// First U + U' = '' (cancel)
			const [scramble, alg] = concatinateAuf('R', "(U R U' R')2", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("R U' R' (U R U' R')");
		});

		it('should not expand repetition when first move is not AUF', () => {
			// Algorithm: (R U R' U')3 with AUF U
			// First move is R, not an AUF, so don't expand
			const [scramble, alg] = concatinateAuf('R', "(R U R' U')3", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("U' (R U R' U')3");
		});
	});

	describe('AUF merging with y-rotation', () => {
		it("should merge AUF with U move after y rotation - U2 y U' (L' U L)", () => {
			// Algorithm: y U' (L' U L) with AUF U2
			// AUF U2 is added to scramble as-is
			// Alg needs to cancel it: U' + U2 (mirrored) = U' + U2 = U
			// Result: y U (L' U L)
			const [scramble, alg] = concatinateAuf('R', "y U' (L' U L)", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y U (L' U L)");
		});

		it("should cancel U moves after y' rotation - U' y' U (R U' R')", () => {
			// Algorithm: y' U (R U' R') with AUF U'
			// AUF U' is added to scramble as-is
			// Alg needs to cancel it: U + U (mirrored of U') = U + U = U2
			// Result: y' U2 (R U' R')
			const [scramble, alg] = concatinateAuf('R', "y' U (R U' R')", "U'");
			expect(scramble).toBe("R U'");
			expect(alg).toBe("y' U2 (R U' R')");
		});

		it("should cancel U2 moves after y rotation - U2 y U2 (L U' L') U (S' L' S)", () => {
			// Algorithm: y U2 (L U' L') U (S' L' S) with AUF U2
			// AUF U2 is added to scramble as-is
			// Alg needs to cancel it: U2 + U2 (mirrored) = U2 + U2 = '' (cancel)
			// Result: y (L U' L') U (S' L' S)
			const [scramble, alg] = concatinateAuf('R', "y U2 (L U' L') U (S' L' S)", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y (L U' L') U (S' L' S)");
		});

		it("should add mirrored AUF after y rotation - U2 y (F' U2 F) (L' U' L)", () => {
			// Algorithm: y (F' U2 F) (L' U' L) with AUF U2
			// AUF U2 is added to scramble as-is
			// No U move after y, so add mirrored AUF: U2 (mirrored) = U2
			// Result: y U2 (F' U2 F) (L' U' L)
			const [scramble, alg] = concatinateAuf('R', "y (F' U2 F) (L' U' L)", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y U2 (F' U2 F) (L' U' L)");
		});

		it("should add mirrored AUF after y' rotation - U y' (R' U2 R) U (R' U' R)", () => {
			// Algorithm: y' (R' U2 R) U (R' U' R) with AUF U
			// AUF U is added to scramble as-is
			// No U move after y', so add mirrored AUF: U' (mirrored of U)
			// Result: y' U' (R' U2 R) U (R' U' R)
			const [scramble, alg] = concatinateAuf('R', "y' (R' U2 R) U (R' U' R)", 'U');
			expect(scramble).toBe('R U');
			expect(alg).toBe("y' U' (R' U2 R) U (R' U' R)");
		});

		it("should add mirrored AUF after y' rotation - U2 y' (R U R2' U' R)", () => {
			// Algorithm: y' (R U R2' U' R) with AUF U2
			// AUF U2 is added to scramble as-is
			// No U move after y', so add mirrored AUF: U2 (mirrored) = U2
			// Result: y' U2 (R U R2' U' R)
			const [scramble, alg] = concatinateAuf('R', "y' (R U R2' U' R)", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y' U2 (R U R2' U' R)");
		});

		it("should merge U move after y rotation with brackets - U2 y U' (L' U L) (R U' R')", () => {
			// Algorithm: y U' (L' U L) (R U' R') with AUF U2
			// AUF U2 is added to scramble as-is
			// Alg needs to cancel it: U' + U2 (mirrored) = U' + U2 = U
			// Result: y U (L' U L) (R U' R')
			const [scramble, alg] = concatinateAuf('R', "y U' (L' U L) (R U' R')", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y U (L' U L) (R U' R')");
		});

		it("should merge U move after y rotation - U2 y U' (L' U L)", () => {
			// Algorithm: y U' (L' U L) with AUF U2
			// AUF U2 is added to scramble as-is
			// Alg needs to cancel it: U' + U2 (mirrored) = U' + U2 = U
			// Result: y U (L' U L)
			const [scramble, alg] = concatinateAuf('R', "y U' (L' U L)", 'U2');
			expect(scramble).toBe('R U2');
			expect(alg).toBe("y U (L' U L)");
		});
	});

	describe('User reported issues - exact examples', () => {
		it("y' U2 (R' U R) U' (S R S') with AUF 'U' should merge correctly", () => {
			const [scramble, alg] = concatinateAuf('R', "y' U2 (R' U R) U' (S R S')", 'U');
			expect(scramble).toBe('R U');
			// Should merge U2 + U' (mirror of U) = U2 + U' = U
			expect(alg).toBe("y' U (R' U R) U' (S R S')");
		});

		it("y (F' U2 F) (L' U' L) with AUF 'U' should add mirrored AUF", () => {
			const [scramble, alg] = concatinateAuf('R', "y (F' U2 F) (L' U' L)", 'U');
			expect(scramble).toBe('R U');
			// No U move after y, so add U' (mirror of U)
			expect(alg).toBe("y U' (F' U2 F) (L' U' L)");
		});

		it("y' (R U R') with AUF 'U' should add mirrored AUF", () => {
			const [scramble, alg] = concatinateAuf('R', "y' (R U R')", 'U');
			expect(scramble).toBe('R U');
			// No U move after y', so add U' (mirror of U)
			expect(alg).toBe("y' U' (R U R')");
		});

		it("y' U2' (non-standard notation) with AUF 'U' should normalize and merge", () => {
			const [scramble, alg] = concatinateAuf('R', "y' U2' (R' U R) U' (S R S')", 'U');
			expect(scramble).toBe('R U');
			// U2' should be normalized to U2, then: U2 + U' (mirror of U) = U
			expect(alg).toBe("y' U (R' U R) U' (S R S')");
		});

		it('should handle U2\' in scramble (non-standard notation)', () => {
			const [scramble, alg] = concatinateAuf("R U2' R", "R U' R'", 'U');
			expect(scramble).toBe("R U2' R U");
			// U2' in scramble should be normalized, then merged with U
			expect(alg).toBe("U' R U' R'");
		});
	});
});
