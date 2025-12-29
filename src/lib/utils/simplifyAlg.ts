/**
 * Algorithm Simplification Utility
 * Merges cancelable moves even if they are separated by other moves on the same axis.
 */

// Axis definitions
// UD: Vertical axis (Up/Down)
// LR: Horizontal axis (Left/Right)
// FB: Depth axis (Front/Back)
type Axis = 'UD' | 'LR' | 'FB' | null;

function getAxis(move: string): Axis {
	const base = move.replace(/['2w]/g, '');
	// Handle wide moves explicitly if they are not standard base letters (though u/d/l/r/f/b usually used)
	// Lowercase letters are usually wide moves in this codebase context or standard notation.
	// But let's look at the first character primarily.
	const firstChar = move.charAt(0).toUpperCase();

	if (['U', 'D', 'E', 'Y'].includes(firstChar)) return 'UD';
	if (['L', 'R', 'M', 'X'].includes(firstChar)) return 'LR';
	if (['F', 'B', 'S', 'Z'].includes(firstChar)) return 'FB';

	// Handle lowercase starts (u, d, l, r, f, b)
	const lowerChar = move.charAt(0);
	if (['u', 'd'].includes(lowerChar)) return 'UD';
	if (['l', 'r'].includes(lowerChar)) return 'LR';
	if (['f', 'b'].includes(lowerChar)) return 'FB';

	return null;
}

function getBaseMove(move: string): string {
	// Remove ' and 2 modifiers
	return move.replace(/['2]/g, '');
}

function getTurnAmount(move: string): number {
	if (move.includes('2')) return 2;
	if (move.includes("'")) return 3; // -1 mod 4 = 3
	return 1;
}

function turnAmountToSuffix(amount: number): string | null {
	const mod = amount % 4;
	if (mod === 0) return null;
	if (mod === 1) return '';
	if (mod === 2) return '2';
	if (mod === 3) return "'";
	return null; // Should not happen for positive inputs, but 0 is handled
}

function simplifyGroup(moves: string[]): string[] {
	// Sort moves by their base move type so cancelable moves are adjacent
	// We want to preserve relative order of *different* move types if possible?
	// Actually, if they commute, order of different move types (e.g. U and D) doesn't strictly matter for the state,
	// but users might prefer "U D" over "D U".
	// Let's rely on a stable sort or just grouping.
	// For cancellation: we just need fast cancellation.
	// Let's Group by Base Move.

	// Map: BaseMove -> total turns
	// Wait, sequence matters for output? "U D U" -> "U2 D". "D U U" -> "D U2".
	// Since U and D commute, "U2 D" is same as "D U2".
	// We can just emit them in a canonical order? Or try to preserve original first appearance?

	const summary = new Map<string, number>();
	const order: string[] = [];

	for (const move of moves) {
		const base = getBaseMove(move);
		if (!summary.has(base)) {
			summary.set(base, 0);
			order.push(base);
		}
		summary.set(base, (summary.get(base)! + getTurnAmount(move)) % 4);
	}

	const result: string[] = [];
	// Reconstruct using the order they first appeared
	for (const base of order) {
		const turns = summary.get(base)!;
		const suffix = turnAmountToSuffix(turns);
		if (suffix !== null) {
			result.push(base + suffix);
		}
	}
	return result;
}

export function simplifyAlg(alg: string): string {
	if (!alg || !alg.trim()) return '';

	const tokens = alg.trim().split(/\s+/);
	if (tokens.length === 0) return '';

	const groups: string[][] = [];
	let currentGroup: string[] = [];
	let currentAxis: Axis = null;

	for (const move of tokens) {
		// Skip empty tokens
		if (!move) continue;

		// Handle parentheses?
		// If parentheses exist, logic gets complex (repetition, grouping).
		// For now, assuming linear algs as per user examples.
		// If we encounter brackets, we might define their axis as NULL to force a break.
		if (move.includes('(') || move.includes(')')) {
			if (currentGroup.length > 0) groups.push(currentGroup);
			currentGroup = [];
			currentAxis = null;
			groups.push([move]); // Treat as isolated item
			continue;
		}

		const axis = getAxis(move);

		if (currentGroup.length === 0) {
			currentGroup.push(move);
			currentAxis = axis;
		} else {
			if (axis !== null && axis === currentAxis) {
				currentGroup.push(move);
			} else {
				groups.push(currentGroup);
				currentGroup = [move];
				currentAxis = axis; // If axis is null (unknown move), it starts a generic group
			}
		}
	}
	if (currentGroup.length > 0) groups.push(currentGroup);

	// Simplify each group
	const simplifiedGroups = groups.map((group) => {
		// Only simplify if we have a valid axis. Isolated unknown moves/brackets are left alone.
		// We can check the first element.
		if (group.length > 0) {
			const axis = getAxis(group[0]);
			// Extra check: if grouping was forced break by null axis, ensure we don't shuffle it?
			// But my logic above splits on axis change.
			if (axis !== null) {
				return simplifyGroup(group);
			}
		}
		return group;
	});

	return simplifiedGroups.flat().join(' ');
}
