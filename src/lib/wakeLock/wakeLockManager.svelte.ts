import { browser } from '$app/environment';
import { requestWakeLock, releaseWakeLock, isWakeLockActive } from '$lib/utils/wakeLock';

/**
 * Starts the wake lock manager to prevent screen from sleeping during training sessions.
 * Automatically manages wake lock lifecycle based on page visibility.
 */
export function startWakeLockManager() {
	if (!browser) return () => {}; // Return no-op cleanup function

	// Request wake lock when manager starts
	requestWakeLock();

	// Handle visibility change - reacquire wake lock when page becomes visible
	const handleVisibilityChange = async () => {
		if (document.visibilityState === 'visible') {
			// Only request if not already active
			if (!isWakeLockActive()) {
				await requestWakeLock();
			}
		}
	};

	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return cleanup function to remove listener and release wake lock
	return () => {
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		releaseWakeLock();
	};
}
