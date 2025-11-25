import type Timer from './Timer.svelte';
import { globalState } from '$lib/globalState.svelte';

/**
 * Creates keyboard event handlers for the train view
 * @param timerRef Reference to the Timer component
 * @param onNext Callback to advance to next case
 * @returns Object containing keyboard event handlers
 */
export function createKeyboardHandlers(
	timerRef: () => Timer | undefined,
	onNext: () => void,
	onTimerStop?: (time: number) => void
) {
	let spacebarPressed = $state(false);

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle keyboard shortcuts if user is typing or modal is open
		const activeElement = document.activeElement;
		const isTyping =
			activeElement?.tagName === 'INPUT' ||
			activeElement?.tagName === 'TEXTAREA' ||
			activeElement?.hasAttribute('contenteditable') ||
			document.querySelector('.modal[style*="display: block"]') !== null;

		if (isTyping) {
			return;
		}

		if (event.code === 'Space') {
			event.preventDefault();
			if (!spacebarPressed) {
				// Spacebar just pressed
				spacebarPressed = true;
				if (globalState.trainShowTimer) {
					const isRunning = timerRef()?.getIsRunning();
					if (isRunning) {
						// If timer is running, stop it and advance to next case
						const time = timerRef()?.stopTimer();
						if (time !== undefined && onTimerStop) {
							onTimerStop(time);
						} else {
							onNext();
						}
					} else {
						// If timer is not running, enter ready state (will start on release)
						timerRef()?.resetTimer(); // Reset timer display when ready state is entered
						timerRef()?.setReady(true);
					}
				} else {
					// If timer is disabled, just advance to next case
					onNext();
				}
			}
		}
	}

	function handleKeyup(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault();
			if (spacebarPressed) {
				// Spacebar just released
				spacebarPressed = false;
				if (globalState.trainShowTimer) {
					const isReady = timerRef()?.getIsReady();
					if (isReady) {
						// If in ready state, reset and start timer
						timerRef()?.resetTimer();
						timerRef()?.startTimer();
						timerRef()?.setReady(false);
					}
				}
				// If timer is disabled, do nothing (already advanced on keydown)
			}
		}
	}

	return {
		handleKeydown,
		handleKeyup
	};
}
