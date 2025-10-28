import {
	OPPOSITE_COLOR,
	SIDE_COLOR,
	STICKERING,
	type StickerColor,
	type StickerColorsWithRandom,
	type StickerHidden
} from '$lib/types/stickering';

function getStickeringString(
	crossColor: StickerColor,
	frontColor: StickerColor,
	stickering: StickerHidden,
	mirrored: boolean
) {
	const edgesArr = Array(12).fill('-');
	const cornersArr = Array(8).fill('-');

	// Hide F2L slot *only if stickering is set*
	if (stickering !== undefined) {
		let side: 'left' | 'right';
		let facing: 'front' | 'back';
		// fr: front-right, fl: front-left, br: back-right, bl: back-left
		if (stickering === 'fr') {
			facing = 'front';
			side = 'right';
		} else if (stickering === 'fl') {
			facing = 'front';
			side = 'left';
		} else if (stickering === 'br') {
			facing = 'back';
			side = 'left';
		} else if (stickering === 'bl') {
			facing = 'back';
			side = 'right';
		} else throw new Error('Invalid stickering: ' + stickering);

		// If mirrored, swap left and right
		if (mirrored) {
			side = side === 'left' ? 'right' : 'left';
		}

		const backColor = OPPOSITE_COLOR[frontColor];

		let f2lFace: StickerColor = 'red';
		let f2lSideColor: StickerColor | undefined = undefined;
		if (facing === 'front') {
			f2lFace = frontColor;
			const entry = SIDE_COLOR[crossColor][frontColor];
			f2lSideColor = entry?.[side];
		} else if (facing === 'back') {
			f2lFace = backColor;
			const entry = SIDE_COLOR[crossColor][backColor];
			f2lSideColor = entry?.[side];
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
