/**
 * Utility for setting up click event handlers on TwistyPlayer elements.
 * Handles both mouse and touch events with click detection to distinguish from drags.
 */

import { createClickDetector } from './clickDetection';

interface EventListenerInfo {
	element: HTMLElement;
	event: string;
	handler: (event: Event) => void;
}

/**
 * Sets up click event listeners on a TwistyPlayer element.
 * Returns cleanup function and event listener array.
 *
 * @param player - The TwistyPlayer element
 * @param onclick - The callback to invoke on click
 * @returns Object with event listeners array and cleanup function
 */
export function setupTwistyPlayerClickHandlers(
	player: any,
	onclick: () => void
): {
	eventListeners: EventListenerInfo[];
	cleanup: () => void;
} {
	const eventListeners: EventListenerInfo[] = [];
	const clickDetector = createClickDetector();

	if (onclick && player.contentWrapper?.firstChild) {
		const playerBody = player.contentWrapper.firstChild as HTMLElement;

		// Create handler functions
		const handleMouseDown = (event: MouseEvent) => {
			clickDetector.onPointerDown(event);
		};

		const handleMouseUp = (event: MouseEvent) => {
			if (clickDetector.onPointerUp(event)) {
				onclick();
			}
		};

		const handleTouchStart = (event: TouchEvent) => {
			clickDetector.onPointerDown(event);
		};

		const handleTouchEnd = (event: TouchEvent) => {
			if (clickDetector.onPointerUp(event)) {
				onclick();
			}
		};

		// Add event listeners
		playerBody.addEventListener('mousedown', handleMouseDown);
		playerBody.addEventListener('mouseup', handleMouseUp);
		playerBody.addEventListener('touchstart', handleTouchStart);
		playerBody.addEventListener('touchend', handleTouchEnd);

		// Store for cleanup
		eventListeners.push(
			{
				element: playerBody,
				event: 'mousedown',
				handler: handleMouseDown as (event: Event) => void
			},
			{
				element: playerBody,
				event: 'mouseup',
				handler: handleMouseUp as (event: Event) => void
			},
			{
				element: playerBody,
				event: 'touchstart',
				handler: handleTouchStart as (event: Event) => void
			},
			{
				element: playerBody,
				event: 'touchend',
				handler: handleTouchEnd as (event: Event) => void
			}
		);
	}

	const cleanup = () => {
		for (const { element, event, handler } of eventListeners) {
			element.removeEventListener(event, handler);
		}
		eventListeners.length = 0;
	};

	return { eventListeners, cleanup };
}
