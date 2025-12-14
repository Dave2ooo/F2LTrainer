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

/**
 * Checks if the F2L is solved according to the case requirements
 */
function isF2LSolved(
	corners: { pieces: number[]; orientation: number[] },
	edges: { pieces: number[]; orientation: number[] },
	piecesToHide: StickerHidden | undefined,
	side: Side
): boolean {
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
 * Logs the normalized KPattern (with rotation removed) and checks if the cube is solved.
 * @param pattern - The current KPattern from TwistyPlayer
 * @param setupRotation - The rotation algorithm applied to the cube
 */
export async function logNormalizedKPattern(
	pattern: any,
	setupRotation: string,
	piecesToHide?: StickerHidden,
	side: Side = 'right'
) {
	try {
		const setupAlg = new Alg(setupRotation);
		const inverseRotation = setupAlg.invert();

		// Apply the inverse rotation to the current pattern
		const inverseTransformation = pattern.kpuzzle.algToTransformation(inverseRotation);
		const normalizedPattern = pattern.applyTransformation(inverseTransformation);

		console.log(
			'Normalized State (rotation removed) - Corners:',
			normalizedPattern.patternData.CORNERS
		);
		console.log(
			'Normalized State (rotation removed) - Edges:',
			normalizedPattern.patternData.EDGES
		);

		// Check if F2L is solved
		const f2lSolved = isF2LSolved(
			normalizedPattern.patternData.CORNERS,
			normalizedPattern.patternData.EDGES,
			piecesToHide,
			side
		);

		if (f2lSolved) {
			console.log(
				'%cF2L IS SOLVED!',
				'color: #fff; background: #00ff00; font-size:1.5rem; font-weight: bold; padding: 8px 0; text-align: center;'
			);
		}

		// Check if cube is fully solved
		const isSolved =
			normalizedPattern.patternData.CORNERS.pieces.every((v: number, i: number) => v === i) &&
			normalizedPattern.patternData.CORNERS.orientation.every((v: number) => v === 0) &&
			normalizedPattern.patternData.EDGES.pieces.every((v: number, i: number) => v === i) &&
			normalizedPattern.patternData.EDGES.orientation.every((v: number) => v === 0);
		if (isSolved) {
			console.log(
				'%cCUBE IS FULLY SOLVED!',
				'color: #fff; background: #1e90ff; font-size:1.5rem; font-weight: bold; padding: 8px 0; text-align: center;'
			);
		}
	} catch (e) {
		console.warn('Could not normalize KPattern:', e);
	}
}
