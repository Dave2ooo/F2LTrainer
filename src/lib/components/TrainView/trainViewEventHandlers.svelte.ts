import type Timer from './Timer.svelte';
import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';

/**
 * Creates keyboard event handlers for the train view
 * @param timerRef Reference to the Timer component
 * @param onNext Callback to advance to next case
 * @returns Object containing keyboard event handlers
 */
export function createKeyboardHandlers(
	timerRef: () => Timer | undefined,
	onNext: () => void,
	onTimerStop?: (time: number) => void,
	onShowHint?: () => void
) {
	let spacebarPressed = $state(false);

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle keyboard shortcuts if user is typing or modal is open
		const activeElement = document.activeElement;
		const isTyping =
			activeElement?.tagName === 'INPUT' ||
			activeElement?.tagName === 'TEXTAREA' ||
			activeElement?.hasAttribute('contenteditable');

		// Check for open modals - Flowbite uses [role="dialog"] for modal backdrop
		const isModalOpen =
			document.querySelector('[role="dialog"]') !== null ||
			document.querySelector('.modal[style*="display: block"]') !== null;

		if (isTyping || isModalOpen) {
			return;
		}

		if (event.code === 'Space') {
			event.preventDefault();
			if (!spacebarPressed) {
				// Spacebar just pressed
				spacebarPressed = true;
				const showTimer =
					sessionState.activeSession?.settings.trainShowTimer ?? DEFAULT_SETTINGS.trainShowTimer;
				if (showTimer) {
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

		// ArrowRight reveals the algorithm hint (same as clicking the HintButton)
		if (event.code === 'ArrowRight') {
			if (onShowHint) {
				onShowHint();
			}
		}
	}

	function handleKeyup(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault();
			if (spacebarPressed) {
				// Spacebar just released
				spacebarPressed = false;
				const showTimer =
					sessionState.activeSession?.settings.trainShowTimer ?? DEFAULT_SETTINGS.trainShowTimer;
				if (showTimer) {
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
