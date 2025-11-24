/**
 * Utility for managing Screen Wake Lock API to prevent screen from sleeping
 * on mobile devices during training sessions.
 */

let wakeLock: WakeLockSentinel | null = null;
let requestInProgress = false;
let onReleaseCallback: (() => void) | null = null;

/**
 * Set a callback to be called when the wake lock is released
 * This allows external code to handle re-acquisition
 */
export function setWakeLockReleaseCallback(callback: (() => void) | null): void {
	onReleaseCallback = callback;
}

/**
 * Request a wake lock to prevent the screen from sleeping
 * @returns Promise that resolves to true if wake lock was acquired, false otherwise
 */
export async function requestWakeLock(): Promise<boolean> {
	// Wake Lock API requires a secure context (HTTPS or localhost)
	if (!window.isSecureContext) {
		console.warn('Wake Lock: Requires HTTPS. Currently running on:', window.location.origin);
		return false;
	}

	if (!('wakeLock' in navigator) || !navigator.wakeLock) {
		console.log('Wake Lock: API not supported in this browser');
		return false;
	}

	// Prevent race conditions from simultaneous requests
	if (requestInProgress) {
		console.log('Wake Lock: Request already in progress');
		return false;
	}

	// Don't request if we already have an active wake lock
	try {
		if (wakeLock && !wakeLock.released) {
			console.log('Wake Lock: Already active');
			return true;
		}
	} catch {
		// WakeLockSentinel may be in invalid state, proceed to request new one
		wakeLock = null;
	}

	requestInProgress = true;

	try {
		wakeLock = await navigator.wakeLock.request('screen');
		console.log('Wake Lock: Acquired successfully');

		// Listen for release events (browser may release for various reasons)
		wakeLock.addEventListener('release', () => {
			console.log('Wake Lock: Released by browser');
			wakeLock = null;
			// Notify callback so it can re-acquire if needed
			if (onReleaseCallback && document.visibilityState === 'visible') {
				onReleaseCallback();
			}
		});

		return true;
	} catch (err) {
		// Common reasons: page not visible, low battery, browser policy
		const error = err as Error;
		console.log('Wake Lock: Failed to acquire -', error.name, error.message);
		return false;
	} finally {
		requestInProgress = false;
	}
}

/**
 * Release the current wake lock
 */
export async function releaseWakeLock(): Promise<void> {
	if (wakeLock) {
		try {
			if (!wakeLock.released) {
				await wakeLock.release();
			}
		} catch (err) {
			console.error('Failed to release Wake Lock:', err);
		} finally {
			wakeLock = null;
		}
	}
}

/**
 * Check if wake lock is currently active
 */
export function isWakeLockActive(): boolean {
	try {
		return wakeLock !== null && !wakeLock.released;
	} catch (err) {
		// Handle case where wakeLock object might be in an invalid state
		return false;
	}
}
