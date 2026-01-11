/**
 * Utility functions - shim layer for csTimer dependencies
 * Provides jQuery and giikerutil replacements for ES modules
 */

// Debug flags - disabled in library mode to ensure compatibility everywhere
const DEBUG = false;
const DEBUGBL = false; // Bluetooth debugging

import { AES128 } from './aes';
import { bluetoothState } from '../store.svelte';

// jQuery-like utilities
export const $ = {
	// No-op function
	noop: () => {},

	// Current time in milliseconds
	now: () => Date.now(),

	// Check if value is an array
	isArray: (value: any): value is any[] => Array.isArray(value),

	// AES-128 encryption
	aes128: (key: number[]) => {
		return new AES128(key);
	}
};

interface GiikerUtil {
	log: (...args: any[]) => void;
	chkAvail: () => Promise<void>;
	reqMacAddr: (
		forcePrompt: boolean,
		isWrongKey: boolean,
		deviceMac: string | null,
		defaultMac: string | null
	) => Promise<string | undefined>;
	updateBattery: (value: [number, string]) => void;
	markSolved: () => void;
}

/**
 * Giikerutil replacement - minimal implementation for Bluetooth cube support
 */
export const giikerutil: GiikerUtil = {
	/**
	 * Logging function
	 */
	log: (...args: any[]) => {
		if (DEBUG) {
			const ts = new Date().toISOString();
			console.log('[bluetooth]', ts, ...args);
		}
	},

	/**
	 * Check if Web Bluetooth is available
	 */
	chkAvail: (): Promise<void> => {
		// Check if running in secure context (HTTPS or localhost)
		if (!window.isSecureContext) {
			return Promise.reject(
				'Web Bluetooth requires HTTPS. Please access this page via https:// instead of http://'
			);
		}

		if (!window.navigator || !('bluetooth' in window.navigator)) {
			return Promise.reject('Web Bluetooth API is not available in this browser');
		}
		const nav = window.navigator as any;
		let ret = Promise.resolve(true);
		if (nav.bluetooth.getAvailability) {
			ret = nav.bluetooth.getAvailability();
		}
		return ret.then((available: boolean) => {
			giikerutil.log('[bluetooth] is available', available);
			if (!available) {
				return Promise.reject('Bluetooth is not available on this device');
			}
			return;
		});
	},

	/**
	 * Request/retrieve MAC address for cube
	 */
	reqMacAddr: (
		forcePrompt: boolean,
		isWrongKey: boolean,
		deviceMac: string | null,
		defaultMac: string | null
	): Promise<string | undefined> => {
		try {
			const mac = deviceMac;

			// If we have a MAC passed in (from saved cubes), use it
			if (mac) {
				giikerutil.log('[bluetooth] using expected mac', mac);
				return Promise.resolve(mac);
			}

			// Otherwise, prompt for MAC if needed
			// Use custom UI request instead of prompt
			return new Promise((resolve) => {
				bluetoothState.requestMacAddress(isWrongKey, deviceMac, defaultMac, (newMac) => {
					if (newMac) {
						resolve(newMac);
					} else {
						resolve(undefined);
					}
				});
			});
		} catch (e) {
			console.error('[bluetooth] Error handling MAC address:', e);
			return Promise.resolve(undefined);
		}
	},

	/**
	 * Update battery level (to be overridden by UI)
	 */
	updateBattery: (value: [number, string]) => {
		giikerutil.log('[bluetooth] battery level:', value[0], '%, device:', value[1]);
		bluetoothState.setBatteryLevel(value[0]);
	},

	/**
	 * Mark cube as solved (to be overridden by UI)
	 */
	markSolved: () => {
		giikerutil.log('[bluetooth] cube marked as solved');
	}
};

/**
 * ExecMain wrapper - dependency injection pattern used in csTimer
 * Simplified for ES modules
 */
export function execMain<T>(factory: (...deps: any[]) => T, dependencies: any[] = []): T {
	return factory(...dependencies);
}

// Export DEBUG flags
export { DEBUG, DEBUGBL };
