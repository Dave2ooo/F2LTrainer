import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
import { getF2LEdgeIndex } from '$lib/stickering';
import type { Side } from '$lib/types/Side';
import type { StickerColor } from '$lib/types/stickering';

/** The hex value for cubing.js's hardcoded "Mystery" sticker color */
const MYSTERY_COLOR_HEX = 15911883; // 0xF2CBCB

/**
 * Apply inverse gamma correction so the desired sRGB color (from the color picker)
 * appears correctly in Three.js's linear color space rendering pipeline.
 * Uses standard display gamma of 2.2.
 */
export function gammaCorrectColor(hexStr: string): number {
	const hex = parseInt(hexStr.replace('#', ''), 16);
	const r = (hex >> 16) & 255;
	const g = (hex >> 8) & 255;
	const b = hex & 255;

	const gamma = 2.2;
	const rT = Math.min(255, Math.pow(r / 255.0, 1 / gamma) * 255);
	const gT = Math.min(255, Math.pow(g / 255.0, 1 / gamma) * 255);
	const bT = Math.min(255, Math.pow(b / 255.0, 1 / gamma) * 255);

	return (Math.round(rT) << 16) | (Math.round(gT) << 8) | Math.round(bT);
}

/**
 * Injects the "M" (Mystery) mask into a stickering string at the position
 * of the F2L edge defined by the group's edgeState for the given case.
 */
export function applyEOMaskToStickeringString(
	baseStr: string,
	groupId: GroupId,
	caseId: number,
	side: Side,
	crossColor: StickerColor,
	frontColor: StickerColor
): string {
	const eoState = GROUP_DEFINITIONS[groupId]?.edgeState?.[caseId];
	if (!eoState) return baseStr;

	const edgeIndex = getF2LEdgeIndex(eoState.slot, side, crossColor, frontColor);
	if (edgeIndex === undefined) return baseStr;

	const chars = baseStr.split('');
	// "EDGES:..." — the edge values start at index 6 (after "EDGES:")
	chars[6 + edgeIndex] = 'M';
	return chars.join('');
}

/**
 * Determines the gamma-corrected color to apply based on the edgeState orientation.
 * Returns undefined if EO display is not applicable for this group/case.
 */
export function getEODisplayColor(
	groupId: GroupId,
	caseId: number,
	orientedColor: string,
	unorientedColor: string
): number | undefined {
	const eoState = GROUP_DEFINITIONS[groupId]?.edgeState?.[caseId];
	if (!eoState) return undefined;

	const targetColorHexStr = eoState.oriented ? orientedColor : unorientedColor;
	return gammaCorrectColor(targetColorHexStr);
}

/**
 * Traverses the Three.js scene inside a TwistyPlayer and recolors any
 * "Mystery" sticker meshes to the given hex color.
 *
 * Clones materials on first encounter to avoid mutating cubing.js's
 * shared global materials. Tags cloned materials so subsequent updates
 * can find and recolor them without needing the original Mystery hex.
 *
 * Retries via requestAnimationFrame since cubing.js rebuilds the 3D meshes
 * asynchronously (especially on case/stickering changes). Cancels previous
 * animation frames to prevent accumulation and performance degradation.
 *
 * Uses more retries initially if no material is found, since a fresh case
 * load can take longer for the scene to rebuild.
 */
let activeRecolorFrameId: number | null = null;

export async function recolorMysteryEdge(
	playerElement: HTMLElement,
	colorHex: number
): Promise<void> {
	const player = playerElement as any;
	if (!player || typeof player.experimentalCurrentVantages !== 'function') return;

	// Cancel any previous animation frame to avoid accumulating loops
	if (activeRecolorFrameId !== null) {
		cancelAnimationFrame(activeRecolorFrameId);
		activeRecolorFrameId = null;
	}

	let retryCount = 0;
	let foundEverything = false;
	const maxRetriesOnMiss = 15; // More retries if we haven't found anything yet
	const maxRetriesOnHit = 10; // More retries after first hit to catch all material instances

	const recolorOnce = async (): Promise<boolean> => {
		try {
			const vantages = await player.experimentalCurrentVantages();
			let foundAny = false;

			for (const vantage of vantages) {
				if (!vantage.scene) continue;
				const scene = await vantage.scene.scene();

				let modified = false;
				scene.traverse((child: any) => {
					if (child.isMesh && child.material && child.material.color) {
						if (child.material.color.getHex() === MYSTERY_COLOR_HEX) {
							// We MUST clone the material! Otherwise, we mutate the global shared material
							child.material = child.material.clone();
							child.material.color.setHex(colorHex);
							child.material.needsUpdate = true;

							// Tag the material so we can update it again later if the user changes settings
							if (!child.material.userData) child.material.userData = {};
							child.material.userData.isEOMysteryMaterial = true;

							modified = true;
							foundAny = true;
							foundEverything = true;
						} else if (child.material.userData?.isEOMysteryMaterial) {
							// Already our custom material — just update its color
							child.material.color.setHex(colorHex);
							child.material.needsUpdate = true;
							modified = true;
							foundAny = true;
						}
					}
				});

				if (modified) {
					vantage.scheduleRender();
				}
			}

			return foundAny;
		} catch (e) {
			console.warn('Could not recolor Mystery edge:', e);
			return false;
		}
	};

	return new Promise<void>((resolve) => {
		let consecutiveNothingFound = 0;

		const loop = async () => {
			const found = await recolorOnce();
			retryCount++;

			if (!found) {
				consecutiveNothingFound++;
			} else {
				// Found something, reset the counter to look for more
				consecutiveNothingFound = 0;
			}

			// Decide max retries based on whether we've ever found the material
			const maxRetries = foundEverything ? maxRetriesOnHit : maxRetriesOnMiss;

			// Stop retrying if:
			// 1. We've had 2 consecutive passes with no new materials (everything is stable)
			// 2. We hit max retries
			if (consecutiveNothingFound >= 2 || retryCount >= maxRetries) {
				activeRecolorFrameId = null;
				resolve();
				return;
			}

			// Schedule next retry
			activeRecolorFrameId = requestAnimationFrame(loop);
		};

		void loop();
	});
}
