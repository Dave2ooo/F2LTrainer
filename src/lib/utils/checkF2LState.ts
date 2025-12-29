import { Alg } from 'cubing/alg';
import type { Side } from '$lib/types/Side';
import type { StickerHidden } from '$lib/types/stickering';

// F2L slot positions in KPattern
const F2L_SLOTS = {
	fr: { edge: 8, corner: 4 }, // FR edge, DRF corner
	fl: { edge: 9, corner: 5 }, // FL edge, DFL corner
	br: { edge: 10, corner: 7 }, // BR edge, DBR corner
	bl: { edge: 11, corner: 6 } // BL edge, DLB corner
} as const;

/**
 * Mirrors a slot position when switching from right to left side
 */
function mirrorSlot(slot: NonNullable<StickerHidden>): NonNullable<StickerHidden> {
	const mirrorMap: Record<NonNullable<StickerHidden>, NonNullable<StickerHidden>> = {
		fr: 'fl',
		fl: 'fr',
		br: 'bl',
		bl: 'br'
	};
	return mirrorMap[slot];
}

/**
 * Checks if a specific F2L slot is solved
 */
function isSlotSolved(
	corners: { pieces: number[]; orientation: number[] },
	edges: { pieces: number[]; orientation: number[] },
	slot: NonNullable<StickerHidden>
): boolean {
	const { edge, corner } = F2L_SLOTS[slot];
	return (
		corners.pieces[corner] === corner &&
		corners.orientation[corner] === 0 &&
		edges.pieces[edge] === edge &&
		edges.orientation[edge] === 0
	);
}

// Cross edge positions (bottom layer edges): DF(4), DR(5), DB(6), DL(7)
const CROSS_EDGES = [4, 5, 6, 7] as const;

/**
 * Checks if the cross (all 4 bottom layer edges) is solved
 */
function isCrossSolved(edges: { pieces: number[]; orientation: number[] }): boolean {
	for (const edgePos of CROSS_EDGES) {
		if (edges.pieces[edgePos] !== edgePos || edges.orientation[edgePos] !== 0) {
			return false;
		}
	}
	return true;
}

/**
 * Checks if the F2L is solved according to the case requirements
 */
function isF2LSolved(
	corners: { pieces: number[]; orientation: number[] },
	edges: { pieces: number[]; orientation: number[] },
	piecesToHide: StickerHidden | undefined,
	side: Side
): boolean {
	// First, check if the cross (bottom layer edges) is solved
	if (!isCrossSolved(edges)) {
		return false;
	}

	// Determine which slot to exclude from checking
	let slotToExclude: NonNullable<StickerHidden> | undefined = piecesToHide;
	if (piecesToHide && side === 'left') {
		slotToExclude = mirrorSlot(piecesToHide);
	}

	// Check all slots except the one to exclude
	const slotsToCheck: NonNullable<StickerHidden>[] = ['fr', 'fl', 'br', 'bl'];
	for (const slot of slotsToCheck) {
		if (slot === slotToExclude) {
			continue; // Skip the slot that doesn't need to be solved
		}
		if (!isSlotSolved(corners, edges, slot)) {
			return false;
		}
	}

	return true;
}

/**
 * Check if the cube is fully solved
 */
function isCubeSolved(normalizedPattern: any): boolean {
	return (
		normalizedPattern.patternData.CORNERS.pieces.every((v: number, i: number) => v === i) &&
		normalizedPattern.patternData.CORNERS.orientation.every((v: number) => v === 0) &&
		normalizedPattern.patternData.EDGES.pieces.every((v: number, i: number) => v === i) &&
		normalizedPattern.patternData.EDGES.orientation.every((v: number) => v === 0)
	);
}

export interface F2LState {
	f2lSolved: boolean;
	cubeSolved: boolean;
}

/**
 * Checks the current F2L state and optionally triggers callbacks when solved.
 * @param pattern - The current KPattern from TwistyPlayer
 * @param scramble - The scramble algorithm
 * @param alg - The solution algorithm (moves made by user)
 * @param piecesToHide - Which F2L slot to exclude from checking
 * @param side - Which side (right/left) for mirroring
 * @param onF2LSolved - Optional callback when F2L is solved
 * @param onCubeSolved - Optional callback when cube is fully solved
 * @returns The current F2L state
 */
export async function checkF2LState(
	pattern: any,
	scramble: string,
	alg: string,
	piecesToHide?: StickerHidden,
	side: Side = 'right',
	onF2LSolved?: () => void,
	onCubeSolved?: () => void
): Promise<F2LState> {
	try {
		// Generate normalized pattern from scramble + alg (ignores setupRotation)
		const currentAppliedAlg = new Alg(scramble + ' ' + alg);
		const normalizedPattern = pattern.kpuzzle.algToTransformation(currentAppliedAlg).toKPattern();

		// Check if F2L is solved
		const f2lSolved = isF2LSolved(
			normalizedPattern.patternData.CORNERS,
			normalizedPattern.patternData.EDGES,
			piecesToHide,
			side
		);

		// Check if cube is fully solved
		const cubeSolved = isCubeSolved(normalizedPattern);

		// Log solved states
		if (f2lSolved) {
			console.log(
				'%c\u2713 F2L SOLVED!',
				'color: #fff; background: #27ae60; font-size:1.2rem; font-weight: bold; padding: 4px 12px; border-radius: 4px;'
			);
			onF2LSolved?.();
		}

		if (cubeSolved) {
			console.log(
				'%c\u2713 CUBE SOLVED!',
				'color: #fff; background: #3498db; font-size:1.2rem; font-weight: bold; padding: 4px 12px; border-radius: 4px;'
			);
			onCubeSolved?.();
		}

		return { f2lSolved, cubeSolved };
	} catch (e) {
		console.error('%c[F2L Check Error]', 'color: #e74c3c; font-weight: bold', e);
		return { f2lSolved: false, cubeSolved: false };
	}
}
