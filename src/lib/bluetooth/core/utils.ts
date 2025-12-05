/**
 * Utility functions - shim layer for csTimer dependencies
 * Provides jQuery and giikerutil replacements for ES modules
 */

// Debug flag
const DEBUG = import.meta.env.DEV || false;
const DEBUGBL = false; // Bluetooth debugging

// jQuery-like utilities
export const $ = {
	// No-op function
	noop: () => { },

	// Current time in milliseconds
	now: () => Date.now(),

	// Check if value is an array
	isArray: (value: any): value is any[] => Array.isArray(value),

	// AES-128 encryption (simplified - needs crypto library)
	aes128: (key: number[]) => {
		// For now, return a minimal interface
		// TODO: Implement proper AES if needed for encrypted cubes
		return {
			encrypt: (data: number[]) => data,
			decrypt: (data: number[]) => data,
			iv: [] as number[]
		};
	}
};

interface GiikerUtil {
	log: (...args: any[]) => void;
	chkAvail: () => Promise<void>;
	reqMacAddr: (forcePrompt: boolean, isWrongKey: boolean, deviceMac: string | null, defaultMac: string | null) => string | undefined;
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
	reqMacAddr: (forcePrompt: boolean, isWrongKey: boolean, deviceMac: string | null, defaultMac: string | null): string | undefined => {
		try {
			const savedMac = localStorage.getItem('bluetooth_device_mac');
			let mac = savedMac;

			if (deviceMac) {
				// Use provided MAC if available
				if (mac && mac.toUpperCase() === deviceMac.toUpperCase()) {
					giikerutil.log('[bluetooth] device mac matched');
				} else {
					mac = deviceMac;
				}
			} else {
				// Prompt for MAC if needed
				if (!mac || forcePrompt) {
					const message = (isWrongKey ? 'The MAC provided might be wrong!\n' : '') +
						'Please enter the Bluetooth MAC address of your cube:';
					mac = prompt(message, mac || defaultMac || 'xx:xx:xx:xx:xx:xx');
				}
				if (!mac || !/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.exec(mac)) {
					console.error('[bluetooth] invalid MAC address');
					return undefined;
				}
			}

			if (mac && mac !== savedMac) {
				localStorage.setItem('bluetooth_device_mac', mac);
				giikerutil.log('[bluetooth] device mac updated');
			}

			return mac || undefined;
		} catch (e) {
			console.error('[bluetooth] Error handling MAC address:', e);
			return undefined;
		}
	},

	/**
	 * Update battery level (to be overridden by UI)
	 */
	updateBattery: (value: [number, string]) => {
		giikerutil.log('[bluetooth] battery level:', value[0], '%, device:', value[1]);
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
export function execMain<T>(factory: (...deps: any[]) => T, dependencies:any[] = []): T {
	return factory(...dependencies);
}

// Export DEBUG flags
export { DEBUG, DEBUGBL };

