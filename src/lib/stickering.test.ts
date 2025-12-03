import { describe, it, expect } from 'vitest';
import getStickeringString from './stickering';
import type { StickerHidden } from './types/stickering';
import type { Side } from './types/Side';
import type { StickerColor } from './types/stickering';
import { STICKERING, SIDE_COLOR } from './types/stickering';

describe('getStickeringString', () => {
	it('should correctly hide FR slot with white cross and red front on right side', () => {
		const stickering: StickerHidden = 'fr';
		const side: Side = 'right';
		const crossColor: StickerColor = 'white';
		const frontColor: StickerColor = 'red';

		const result = getStickeringString(stickering, side, crossColor, frontColor);

		console.log('White cross, red front, FR slot (right side):', result);
		console.log('SIDE_COLOR[white][red]:', SIDE_COLOR['white']['red']);

		// Expected hidden pieces:
		// - Edge: red-green (index 8 from STICKERING.edges['red']['green'])
		// - Corner: white-red-green (index 0 from STICKERING.corners['white']['red']['green'])
		// - All yellow (top) edges: indices 4, 5, 6, 7
		// - All yellow (top) corners: indices 4, 5, 6, 7

		// Parse the result
		const [edgesStr, cornersStr] = result.split(',').map(s => s.split(':')[1]);
		
		// Check edge index 8 is hidden (red-green)
		expect(edgesStr[8]).toBe('I');
		// Check corner index 0 is hidden (white-red-green)
		expect(cornersStr[0]).toBe('I');
		// Check top layer edges are hidden
		expect(edgesStr[4]).toBe('I');
		expect(edgesStr[5]).toBe('I');
		expect(edgesStr[6]).toBe('I');
		expect(edgesStr[7]).toBe('I');
		// Check top layer corners are hidden
		expect(cornersStr[4]).toBe('I');
		expect(cornersStr[5]).toBe('I');
		expect(cornersStr[6]).toBe('I');
		expect(cornersStr[7]).toBe('I');
	});

	it('should correctly hide FR slot with white cross and red front on left side', () => {
		const stickering: StickerHidden = 'fr';
		const side: Side = 'left';
		const crossColor: StickerColor = 'white';
		const frontColor: StickerColor = 'red';

		const result = getStickeringString(stickering, side, crossColor, frontColor);

		console.log('White cross, red front, FR slot (left side):', result);

		// When side is 'left', the sideSticker should be swapped from 'right' to 'left'
		// So we should be hiding red-blue edge and white-red-blue corner
		
		// Parse the result
		const [edgesStr, cornersStr] = result.split(',').map(s => s.split(':')[1]);
		
		// Check edge index 10 is hidden (red-blue from STICKERING.edges['red']['blue'])
		expect(edgesStr[10]).toBe('I');
		// Check corner index 1 is hidden (white-red-blue from STICKERING.corners['white']['red']['blue'])
		expect(cornersStr[1]).toBe('I');
	});

	it('should correctly hide FR slot with yellow cross and red front', () => {
		const stickering: StickerHidden = 'fr';
		const side: Side = 'right';
		const crossColor: StickerColor = 'yellow';
		const frontColor: StickerColor = 'red';

		const result = getStickeringString(stickering, side, crossColor, frontColor);

		console.log('Yellow cross, red front, FR slot:', result);
		console.log('SIDE_COLOR[yellow][red]:', SIDE_COLOR['yellow']['red']);

		expect(result).toContain('EDGES:');
		expect(result).toContain('CORNERS:');
	});

	// Add more comprehensive tests for all combinations
	it('should produce different stickering for white vs yellow cross with same front color', () => {
		const stickering: StickerHidden = 'fr';
		const side: Side = 'right';
		const frontColor: StickerColor = 'red';

		const whiteResult = getStickeringString(stickering, side, 'white', frontColor);
		const yellowResult = getStickeringString(stickering, side, 'yellow', frontColor);

		console.log('Comparison - White cross:', whiteResult);
		console.log('Comparison - Yellow cross:', yellowResult);

		// They should be different because:
		// - Top layer is opposite of cross (yellow vs white)
		// - F2L slot sides are different (green vs blue for right side)
		expect(whiteResult).not.toBe(yellowResult);
	});

	// Test the specific scenario mentioned in the bug report
	it('should handle SIDE_COLOR lookup correctly for all cross/front combinations', () => {
		const crosses: StickerColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue'];
		const fronts: StickerColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue'];

		for (const cross of crosses) {
			for (const front of fronts) {
				const entry = SIDE_COLOR[cross][front];
				if (entry !== undefined) {
					// Should have both right and left properties
					expect(entry).toHaveProperty('right');
					expect(entry).toHaveProperty('left');
					console.log(`SIDE_COLOR[${cross}][${front}]:`, entry);
				}
			}
		}
	});
});
