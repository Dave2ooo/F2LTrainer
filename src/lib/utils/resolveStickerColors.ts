import { type StickerColor, OPPOSITE_COLOR, SIDE_COLOR } from '$lib/types/stickering';

export default function resolveStickerColors(
	crossColors: StickerColor[],
	frontColors: StickerColor[]
): [StickerColor, StickerColor] {
	// Find the first valid combination
	for (const cross of crossColors) {
		// If frontColors is empty, pick the first valid neighbor
		const potentialFrontColors =
			frontColors.length > 0 ? frontColors : (Object.keys(SIDE_COLOR[cross]) as StickerColor[]);

		for (const front of potentialFrontColors) {
			// Check if valid (not same and not opposite)
			if (cross !== front && OPPOSITE_COLOR[cross] !== front) {
				return [cross, front];
			}
		}
	}

	// Fallback if no valid combination found (shouldn't happen with proper UI validation)
	return ['white', 'red'];
}
