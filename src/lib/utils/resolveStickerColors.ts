import type { StickerColorsWithRandom, StickerColor } from '$lib/types/stickering';

export default function resolveStickerColors(
	crossColor: StickerColorsWithRandom,
	frontColor: StickerColorsWithRandom
): [StickerColor, StickerColor] {
	if (crossColor === 'random' || frontColor === 'random') {
		return ['white', 'red'];
	}
	return [crossColor, frontColor];
}
