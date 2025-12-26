/**
 * Move Validation Utility
 * Handles normalization and comparison of cube moves for smart cube training
 */

/**
 * Check if a move is a rotation (x, y, z)
 */
export function isRotationMove(move: string): boolean {
	const rotations = ['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2'];
	return rotations.includes(move);
}

/**
 * Get the base face of a move (e.g., "U" from "U'", "U2", or "U")
 */
function getBaseFace(move: string): string {
	return move.replace(/['2]/g, '');
}

/**
 * Get the turn count for a move (1 for U, 2 for U2, 3 for U')
 */
function getTurnCount(move: string): number {
	if (move.includes('2')) return 2;
	if (move.includes("'")) return 3;
	return 1;
}

/**
 * Convert turn count back to move notation
 */
function turnCountToMove(baseFace: string, count: number): string | null {
	const normalized = count % 4;
	if (normalized === 0) return null; // Cancels out
	if (normalized === 1) return baseFace;
	if (normalized === 2) return baseFace + '2';
	if (normalized === 3) return baseFace + "'";
	return null;
}

/**
 * Expand slice moves to their equivalent face moves
 * Returns all possible orderings (order-independent)
 */
export function expandSliceMove(move: string): string[][] {
	const sliceMappings: Record<string, string[][]> = {
		// M slice (R L')
		M: [
			['R', "L'"],
			["L'", 'R']
		],
		"M'": [
			["R'", 'L'],
			['L', "R'"]
		],
		M2: [
			['R2', 'L2'],
			['L2', 'R2']
		],

		// E slice (U D')
		E: [
			['U', "D'"],
			["D'", 'U']
		],
		"E'": [
			["U'", 'D'],
			['D', "U'"]
		],
		E2: [
			['U2', 'D2'],
			['D2', 'U2']
		],

		// S slice (F' B)
		S: [
			["F'", 'B'],
			['B', "F'"]
		],
		"S'": [
			['F', "B'"],
			["B'", 'F']
		],
		S2: [
			['F2', 'B2'],
			['B2', 'F2']
		]
	};

	return sliceMappings[move] || [[move]];
}

/**
 * Check if a move is a slice move (M, E, S)
 */
function isSliceMove(move: string): boolean {
	const baseFace = getBaseFace(move);
	return ['M', 'E', 'S'].includes(baseFace);
}

/**
 * Coalesce consecutive identical moves
 * [U, U] -> U2
 * [U, U, U] -> U'
 * [U, U, U, U] -> [] (cancels out)
 */
export function coalesceMoves(moves: string[]): string[] {
	const result: string[] = [];
	let i = 0;

	while (i < moves.length) {
		const currentMove = moves[i];
		const baseFace = getBaseFace(currentMove);
		let totalTurns = getTurnCount(currentMove);

		// Look ahead for consecutive moves of the same face
		let j = i + 1;
		while (j < moves.length && getBaseFace(moves[j]) === baseFace) {
			totalTurns += getTurnCount(moves[j]);
			j++;
		}

		// Convert back to move notation
		const coalescedMove = turnCountToMove(baseFace, totalTurns);
		if (coalescedMove) {
			result.push(coalescedMove);
		}

		i = j;
	}

	return result;
}

/**
 * Cancel opposing moves
 * [R, R'] -> []
 * [U2, U2'] -> [] (U2 and U2' are equivalent)
 */
export function cancelMoves(moves: string[]): string[] {
	const result: string[] = [];

	for (const move of moves) {
		if (result.length === 0) {
			result.push(move);
			continue;
		}

		const lastMove = result[result.length - 1];
		const baseFace = getBaseFace(move);
		const lastBaseFace = getBaseFace(lastMove);

		// Check if they're on the same face
		if (baseFace === lastBaseFace) {
			const totalTurns = getTurnCount(lastMove) + getTurnCount(move);
			const normalizedTurns = totalTurns % 4;

			// Remove last move and add new one if they don't cancel
			result.pop();
			const newMove = turnCountToMove(baseFace, normalizedTurns);
			if (newMove) {
				result.push(newMove);
			}
		} else {
			result.push(move);
		}
	}

	return result;
}

/**
 * Normalize a sequence of moves
 * 1. Expand slice moves
 * 2. Coalesce consecutive moves
 * 3. Cancel opposing moves
 */
export function normalizeMoves(moves: string[]): string[] {
	// Step 1: Expand slice moves (use first ordering for simplicity)
	let expanded: string[] = [];
	for (const move of moves) {
		if (isSliceMove(move)) {
			const expansions = expandSliceMove(move);
			expanded.push(...expansions[0]); // Use first ordering
		} else {
			expanded.push(move);
		}
	}

	// Step 2: Coalesce consecutive moves
	let coalesced = coalesceMoves(expanded);

	// Step 3: Cancel opposing moves
	let cancelled = cancelMoves(coalesced);

	return cancelled;
}

/**
 * Check if two move sequences are equivalent
 * Handles order-independence for slice moves
 */
function areSequencesEquivalent(seq1: string[], seq2: string[]): boolean {
	if (seq1.length !== seq2.length) return false;

	// Normalize both sequences
	const norm1 = normalizeMoves(seq1);
	const norm2 = normalizeMoves(seq2);

	if (norm1.length !== norm2.length) return false;

	// Compare element by element
	for (let i = 0; i < norm1.length; i++) {
		if (norm1[i] !== norm2[i]) return false;
	}

	return true;
}

/**
 * Match performed moves against expected algorithm segment
 * Returns if they match and how many expected moves were consumed
 */
export function matchesMoveSequence(
	performed: string[],
	expected: string[]
): { match: boolean; consumedCount: number } {
	if (performed.length === 0 || expected.length === 0) {
		return { match: false, consumedCount: 0 };
	}

	// Normalize performed moves
	const normalizedPerformed = normalizeMoves(performed);

	if (normalizedPerformed.length === 0) {
		return { match: false, consumedCount: 0 };
	}

	// Try to match progressively longer prefixes of expected
	for (let consumeCount = expected.length; consumeCount >= 1; consumeCount--) {
		const expectedPrefix = expected.slice(0, consumeCount);

		// Expand expected moves that are slice moves
		let expandedExpected: string[] = [];
		for (const move of expectedPrefix) {
			if (isSliceMove(move)) {
				// Try all possible orderings for slice moves
				const expansions = expandSliceMove(move);
				// For now, try the first expansion
				// TODO: Could try all combinations if needed
				expandedExpected.push(...expansions[0]);
			} else {
				expandedExpected.push(move);
			}
		}

		// Normalize expected
		const normalizedExpected = normalizeMoves(expandedExpected);

		// Check if normalized sequences match
		if (areSequencesEquivalent(normalizedPerformed, normalizedExpected)) {
			return { match: true, consumedCount: consumeCount };
		}
	}

	return { match: false, consumedCount: 0 };
}

/**
 * Check if a move sequence contains only rotations
 */
export function isOnlyRotations(moves: string[]): boolean {
	return moves.every((move) => isRotationMove(move));
}
