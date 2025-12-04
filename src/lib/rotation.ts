import { ROTATION_ALG } from '$lib/types/rotation';
import type { StickerColor } from '$lib/types/stickering';
import { globalState } from './globalState.svelte';

function getRotationAlg(
	crossColor: StickerColor | StickerColor[],
	frontColor: StickerColor | StickerColor[]
) {
	// Handle arrays (take the first element if it's an array)
	const cross = Array.isArray(crossColor) ? crossColor[0] : crossColor;
	const front = Array.isArray(frontColor) ? frontColor[0] : frontColor;
	
	// DEBUG: Log the rotation calculation to diagnose orientation issues
 	// console.log('[getRotationAlg]', { 
	// 	crossColor, 
	//	frontColor, 
	//	resolved: { cross, front },
	//	rotation: ROTATION_ALG[cross]?.[front] ?? "z2 y'"
	// });

	// Safety check
	if (!cross || !front) return "z2 y'";

	return ROTATION_ALG[cross]?.[front] ?? "z2 y'";
}

function getCurrentRotationAlg() {
	if (!globalState.crossColor || !globalState.frontColor) return "z2 y'";

	// Handle arrays
	const cross = Array.isArray(globalState.crossColor)
		? globalState.crossColor[0]
		: globalState.crossColor;
	const front = Array.isArray(globalState.frontColor)
		? globalState.frontColor[0]
		: globalState.frontColor;

	// if (cross === 'random' || front === 'random') return "z2 y'";

	return ROTATION_ALG[cross]?.[front] ?? "z2 y'";
}

export default getRotationAlg;
export { getCurrentRotationAlg };
