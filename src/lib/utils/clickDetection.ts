/**
 * Utility module for detecting clicks vs drags on interactive elements.
 * This helps distinguish between intentional clicks and drag gestures
 * (e.g., rotating a 3D cube visualization).
 */

interface Point {
	x: number;
	y: number;
}

// Tolerance in pixels for click detection - allows for slight movement during a click
const CLICK_TOLERANCE_PX = 5;

/**
 * Creates a click detector that tracks mouse/touch coordinates to distinguish
 * between clicks and drags.
 *
 * @returns Object with methods to handle pointer events and check if a click occurred
 */
export function createClickDetector() {
	let startPoint: Point | null = null;

	return {
		/**
		 * Records the starting position when pointer goes down
		 */
		onPointerDown(event: MouseEvent | TouchEvent) {
			if (event instanceof MouseEvent) {
				startPoint = { x: event.clientX, y: event.clientY };
			} else {
				// TouchEvent
				const touch = event.touches[0];
				if (touch) {
					startPoint = { x: touch.clientX, y: touch.clientY };
				}
			}
		},

		/**
		 * Checks if the pointer up event occurred at the same position as pointer down,
		 * indicating a click rather than a drag.
		 *
		 * @returns true if this was a click (not a drag), false otherwise
		 */
		onPointerUp(event: MouseEvent | TouchEvent): boolean {
			if (!startPoint) {
				return false;
			}

			let endPoint: Point;
			if (event instanceof MouseEvent) {
				endPoint = { x: event.clientX, y: event.clientY };
			} else {
				// TouchEvent
				const touch = event.changedTouches[0];
				if (!touch) {
					return false;
				}
				endPoint = { x: touch.clientX, y: touch.clientY };
			}

			// Check if start and end points are within tolerance
			const distance = Math.sqrt(
				Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
			);
			const isClick = distance <= CLICK_TOLERANCE_PX;

			// Reset for next interaction
			startPoint = null;

			return isClick;
		},

		/**
		 * Resets the detector state
		 */
		reset() {
			startPoint = null;
		}
	};
}
