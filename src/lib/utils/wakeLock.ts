/**
 * Utility for managing Screen Wake Lock API to prevent screen from sleeping
 * on mobile devices during training sessions.
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Request a wake lock to prevent the screen from sleeping
 * @returns Promise that resolves to true if wake lock was acquired, false otherwise
 */
export async function requestWakeLock(): Promise<boolean> {
	if (!('wakeLock' in navigator)) {
		console.log('Wake Lock API not supported');
		return false;
	}

	try {
		wakeLock = await navigator.wakeLock.request('screen');
		console.log('Wake Lock acquired');

		wakeLock.addEventListener('release', () => {
			console.log('Wake Lock released');
		});

		return true;
	} catch (err) {
		console.error('Failed to acquire Wake Lock:', err);
		return false;
	}
}

/**
 * Release the current wake lock
 */
export async function releaseWakeLock(): Promise<void> {
	if (wakeLock) {
		try {
			await wakeLock.release();
			wakeLock = null;
		} catch (err) {
			console.error('Failed to release Wake Lock:', err);
		}
	}
}

/**
 * Check if wake lock is currently active
 */
export function isWakeLockActive(): boolean {
	return wakeLock !== null && !wakeLock.released;
}
