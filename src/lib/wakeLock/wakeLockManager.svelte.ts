import { browser } from '$app/environment';
import {
	requestWakeLock,
	releaseWakeLock,
	isWakeLockActive,
	setWakeLockReleaseCallback
} from '$lib/utils/wakeLock';

/**
 * Starts the wake lock manager to prevent screen from sleeping during training sessions.
 * Automatically manages wake lock lifecycle based on page visibility.
 */
export function startWakeLockManager() {
	if (!browser) return () => {}; // Return no-op cleanup function

	// Function to acquire wake lock with retry logic
	const acquireWakeLock = async () => {
		if (document.visibilityState === 'visible' && !isWakeLockActive()) {
			await requestWakeLock();
		}
	};

	// Set callback to re-acquire wake lock when browser releases it
	// (can happen due to low battery, tab switch, etc.)
	setWakeLockReleaseCallback(() => {
		// Small delay to allow the browser to complete the release process
		// before attempting re-acquisition, avoiding potential conflicts
		const WAKE_LOCK_REACQUIRE_DELAY_MS = 100;
		setTimeout(acquireWakeLock, WAKE_LOCK_REACQUIRE_DELAY_MS);
	});

	// Request wake lock when manager starts
	acquireWakeLock();

	// Handle visibility change - reacquire wake lock when page becomes visible
	const handleVisibilityChange = async () => {
		if (document.visibilityState === 'visible') {
			await acquireWakeLock();
		}
	};

	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return cleanup function to remove listener and release wake lock
	return () => {
		setWakeLockReleaseCallback(null);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		releaseWakeLock();
	};
}
