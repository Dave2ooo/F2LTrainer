import {
	OPPOSITE_COLOR,
	SIDE_COLOR,
	STICKERING,
	type StickerColor,
	type StickerHidden
} from '$lib/types/stickering';
import { type Side, OPPOSITE_SIDE } from '$lib/types/Side';

function getStickeringString(
	stickering: StickerHidden,
	side?: Side,
	crossColor?: StickerColor,
	frontColor?: StickerColor
) {
	// DEBUG: Log the parameters to diagnose stickering issues
	// console.log('[getStickeringString]', { stickering, side, crossColor, frontColor });

	const edgesArr = Array(12).fill('-');
	const cornersArr = Array(8).fill('-');

	if (side === undefined) side = 'right';
	if (crossColor === undefined) crossColor = 'white';
	if (frontColor === undefined) frontColor = 'red';

	// Hide F2L slot *only if stickering is set*
	if (stickering !== undefined) {
		let sideSticker: Side;
		let facing: 'front' | 'back';
		// fr: front-right, fl: front-left, br: back-right, bl: back-left
		if (stickering === 'fr') {
			facing = 'front';
			sideSticker = 'right';
		} else if (stickering === 'fl') {
			facing = 'front';
			sideSticker = 'left';
		} else if (stickering === 'br') {
			facing = 'back';
			sideSticker = 'right';
		} else if (stickering === 'bl') {
			facing = 'back';
			sideSticker = 'left';
		} else throw new Error('Invalid stickering: ' + stickering);

		// If left, swap left and right
		if (side === 'left') {
			sideSticker = OPPOSITE_SIDE[sideSticker];
		}

		const backColor = OPPOSITE_COLOR[frontColor];

		let f2lFace: StickerColor = 'red';
		let f2lSideColor: StickerColor | undefined = undefined;
		if (facing === 'front') {
			f2lFace = frontColor;
			const entry = SIDE_COLOR[crossColor][frontColor];
			f2lSideColor = entry?.[sideSticker];
		} else if (facing === 'back') {
			f2lFace = backColor;
			const entry = SIDE_COLOR[crossColor][backColor];
			f2lSideColor = entry?.[OPPOSITE_SIDE[sideSticker]]; // Opposite side because of back face
		}

		if (f2lSideColor === undefined) throw new Error('Invalid stickering: ' + stickering);

		const edgeIndex = STICKERING.edges[f2lFace][f2lSideColor];
		if (edgeIndex === undefined) throw new Error('Invalid stickering: ' + stickering);

		const cornerIndex = STICKERING.corners[crossColor][f2lFace]?.[f2lSideColor];
		if (cornerIndex === undefined) throw new Error('Invalid stickering: ' + stickering);

		edgesArr[edgeIndex] = 'I';
		cornersArr[cornerIndex] = 'I';
	}

	// Hide top layer
	const topColor = OPPOSITE_COLOR[crossColor];
	const edgeIndices = Object.values(STICKERING.edges[topColor]);
	for (const i of edgeIndices) edgesArr[i] = 'I';
	const colorObjs = Object.values(STICKERING.corners[topColor]);
	for (const obj of colorObjs) for (const idx of Object.values(obj)) cornersArr[idx] = 'I';

	// --- Apply mask to the player ---
	const edges = edgesArr.join('');
	const corners = cornersArr.join('');
	return `EDGES:${edges},CORNERS:${corners},CENTERS:------`;
}

export default getStickeringString;
