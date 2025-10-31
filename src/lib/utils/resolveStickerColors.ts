import type { StickerColor } from '$lib/types/stickering';

export default function resolveStickerColors(
	crossColor: StickerColor | 'random',
	frontColor: StickerColor | 'random'
): [StickerColor, StickerColor] {
	if (crossColor === 'random' || frontColor === 'random') {
		return ['white', 'red'];
	}
	return [crossColor, frontColor];
}
