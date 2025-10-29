import { ROTATION_ALG } from '$lib/types/rotation';
import type { StickerColor } from '$lib/types/stickering';
import { globalState } from './globalState.svelte';

function getRotationAlg(crossColor: StickerColor, frontColor: StickerColor) {
	return ROTATION_ALG[crossColor][frontColor];
}

function getCurrentRotationAlg() {
	if (
		!globalState.crossColor ||
		!globalState.frontColor ||
		globalState.crossColor === 'random' ||
		globalState.frontColor === 'random'
	)
		return "z2 y'";

	return ROTATION_ALG[globalState.crossColor][globalState.frontColor];
}

export default getRotationAlg;
export { getCurrentRotationAlg };
