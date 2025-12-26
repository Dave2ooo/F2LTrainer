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
 * Check if a move is a wide move (r, l, u, d, f, b)
 */
export function isWideMove(move: string): boolean {
	const baseFace = getBaseFace(move);
	return ['r', 'l', 'u', 'd', 'f', 'b'].includes(baseFace);
}

/**
 * Map a wide move to the detectable single-layer move
 * Wide moves are detected as the opposite face's single-layer move
 * Examples:
 * - r -> L, r' -> L', r2 -> L2
 * - l -> R, l' -> R', l2 -> R2
 * - u -> D, u' -> D', u2 -> D2
 * - d -> U, d' -> U', d2 -> U2
 * - f -> B, f' -> B', f2 -> B2
 * - b -> F, b' -> F', b2 -> F2
 */
export function wideToSingleLayerMove(move: string): string | null {
	const baseFace = getBaseFace(move);
	const modifier = move.replace(baseFace, ''); // Get ' or 2 or empty

	const mapping: Record<string, string> = {
		r: 'L',
		l: 'R',
		u: 'D',
		d: 'U',
		f: 'B',
		b: 'F'
	};

	const singleLayerFace = mapping[baseFace];
	if (!singleLayerFace) return null;

	return singleLayerFace + modifier;
}

/**
 * Get the rotation caused by a wide move
 * Examples:
 * - r -> x, r' -> x', r2 -> x2
 * - l -> x', l' -> x, l2 -> x2
 * - u -> y, u' -> y', u2 -> y2
 * - d -> y', d' -> y, d2 -> y2
 * - f -> z, f' -> z', f2 -> z2
 * - b -> z', b' -> z, b2 -> z2
 */
export function getWideImplicitRotation(move: string): string {
	const baseFace = getBaseFace(move);
	const modifier = move.replace(baseFace, ''); // Get ' or 2 or empty

	// Base rotation for each wide move
	const rotationMapping: Record<string, string> = {
		r: 'x',
		l: "x'",
		u: 'y',
		d: "y'",
		f: 'z',
		b: "z'"
	};

	const baseRotation = rotationMapping[baseFace];
	if (!baseRotation) return '';

	// Handle modifiers
	if (modifier === '2') {
		// For double wide moves, rotation is always the base rotation + 2
		return getBaseFace(baseRotation) + '2';
	} else if (modifier === "'") {
		// For prime wide moves, invert the base rotation
		return inverseRotation(baseRotation);
	}

	return baseRotation;
}

/**
 * Apply a rotation to a move
 * For example: if rotation is 'x', then U becomes F, F becomes D, etc.
 */
export function applyRotationToMove(move: string, rotation: string): string {
	if (!rotation || rotation === '') return move;

	const baseFace = getBaseFace(move);
	const modifier = move.replace(baseFace, ''); // Get ' or 2 or empty

	// Rotation mappings: what each face becomes after a rotation
	const rotationMaps: Record<string, Record<string, string>> = {
		x: { U: 'F', F: 'D', D: 'B', B: 'U', R: 'R', L: 'L' },
		"x'": { U: 'B', B: 'D', D: 'F', F: 'U', R: 'R', L: 'L' },
		x2: { U: 'D', D: 'U', F: 'B', B: 'F', R: 'R', L: 'L' },
		y: { U: 'U', D: 'D', F: 'R', R: 'B', B: 'L', L: 'F' },
		"y'": { U: 'U', D: 'D', F: 'L', L: 'B', B: 'R', R: 'F' },
		y2: { U: 'U', D: 'D', F: 'B', B: 'F', R: 'L', L: 'R' },
		z: { U: 'L', L: 'D', D: 'R', R: 'U', F: 'F', B: 'B' },
		"z'": { U: 'R', R: 'D', D: 'L', L: 'U', F: 'F', B: 'B' },
		z2: { U: 'D', D: 'U', L: 'R', R: 'L', F: 'F', B: 'B' }
	};

	const map = rotationMaps[rotation];
	if (!map) return move;

	const newFace = map[baseFace];
	if (!newFace) return move;

	return newFace + modifier;
}

/**
 * Combine multiple rotations into a single effective rotation
 * For example: x then y becomes a combined rotation
 */
export function combineRotations(rotations: string[]): string {
	if (rotations.length === 0) return '';
	if (rotations.length === 1) return rotations[0];

	// For simplicity, we'll apply rotations sequen tially
	// A more efficient approach would be to use rotation matrices,
	// but for F2L this should be sufficient
	let result = rotations[0];

	for (let i = 1; i < rotations.length; i++) {
		const nextRotation = rotations[i];

		// Combine rotations by mapping through each
		// This is a simplified approach - could be optimized
		const testFaces = ['U', 'D', 'F', 'B', 'R', 'L'];
		const combined: Record<string, string> = {};

		for (const face of testFaces) {
			const afterFirst = applyRotationToMove(face, result);
			const afterSecond = applyRotationToMove(afterFirst, nextRotation);
			combined[face] = afterSecond;
		}

		// Find which single rotation produces this mapping
		// (This is a simplification - may not always find a single rotation)
		const allRotations = ['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2', ''];
		for (const rot of allRotations) {
			let matches = true;
			for (const face of testFaces) {
				if (applyRotationToMove(face, rot) !== combined[face]) {
					matches = false;
					break;
				}
			}
			if (matches) {
				result = rot;
				break;
			}
		}
	}

	return result;
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

/**
 * Get the inverse of a rotation
 * For example: inverse of x is x', inverse of x' is x, inverse of x2 is x2
 */
export function inverseRotation(rotation: string): string {
	if (!rotation || rotation === '') return '';

	const inverseMap: Record<string, string> = {
		x: "x'",
		"x'": 'x',
		x2: 'x2',
		y: "y'",
		"y'": 'y',
		y2: 'y2',
		z: "z'",
		"z'": 'z',
		z2: 'z2'
	};

	return inverseMap[rotation] || rotation;
}
