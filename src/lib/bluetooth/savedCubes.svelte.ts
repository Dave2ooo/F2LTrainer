/**
 * Saved cubes management store
 * Persists cube information to localStorage for quick reconnection
 */

export interface SavedCube {
	uuid: string; // Globally unique ID for sync (crypto.randomUUID())
	id: string; // Bluetooth device ID (browser-specific, not synced)
	customName: string; // User-provided name
	deviceName: string; // Original Bluetooth device name
	macAddress?: string; // MAC address if available
	dateAdded: number; // Timestamp when added
	lastConnected: number; // Timestamp of last connection
	lastModified: number; // For sync conflict resolution
}

const STORAGE_KEY = 'savedBluetoothCubes';

// Load saved cubes from localStorage
function loadSavedCubes(): SavedCube[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error('Failed to load saved cubes:', e);
	}
	return [];
}

// Save cubes to localStorage
function saveCubesToStorage(cubes: SavedCube[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cubes));
	} catch (e) {
		console.error('Failed to save cubes:', e);
	}
}

let cubes = $state<SavedCube[]>(loadSavedCubes());

export const savedCubesState = {
	get cubes() {
		return cubes;
	},

	addCube(deviceId: string, deviceName: string, customName?: string, macAddress?: string) {
		const now = Date.now();

		// First, check if a cube with the same MAC address already exists
		// This handles the case where deviceId changes between connections
		let existingMacIndex = macAddress ? cubes.findIndex((c) => c.macAddress === macAddress) : -1;

		// Also check for deviceId match (might be a stale entry)
		const existingIdIndex = cubes.findIndex((c) => c.id === deviceId);

		if (existingMacIndex >= 0) {
			// Found a cube with matching MAC - update it
			const existingCube = cubes[existingMacIndex];

			// If there's a DIFFERENT entry with the same deviceId, remove it (stale entry)
			if (existingIdIndex >= 0 && existingIdIndex !== existingMacIndex) {
				cubes = cubes.filter((_, i) => i !== existingIdIndex);
				// Recalculate the MAC index after removal
				existingMacIndex = cubes.findIndex((c) => c.macAddress === macAddress);
			}

			if (existingMacIndex >= 0) {
				// Update existing cube with new deviceId (it may have changed)
				cubes[existingMacIndex] = {
					...cubes[existingMacIndex],
					id: deviceId, // Update deviceId in case it changed
					customName: customName || cubes[existingMacIndex].customName,
					macAddress: macAddress || cubes[existingMacIndex].macAddress,
					lastConnected: now,
					lastModified: now
				};
				cubes = [...cubes]; // Trigger reactivity
			}
		} else if (existingIdIndex >= 0) {
			// No MAC match but found by deviceId - update that entry
			cubes[existingIdIndex] = {
				...cubes[existingIdIndex],
				customName: customName || cubes[existingIdIndex].customName,
				macAddress: macAddress || cubes[existingIdIndex].macAddress,
				lastConnected: now,
				lastModified: now
			};
			cubes = [...cubes]; // Trigger reactivity
		} else {
			// Add new cube
			const newCube: SavedCube = {
				uuid: crypto.randomUUID(),
				id: deviceId,
				customName: customName || deviceName,
				deviceName: deviceName,
				macAddress: macAddress,
				dateAdded: now,
				lastConnected: now,
				lastModified: now
			};
			cubes = [...cubes, newCube];
		}

		saveCubesToStorage(cubes);
	},

	removeCube(deviceId: string) {
		cubes = cubes.filter((c) => c.id !== deviceId);
		saveCubesToStorage(cubes);
	},

	renameCube(deviceId: string, newName: string) {
		const cube = cubes.find((c) => c.id === deviceId);
		if (cube) {
			cube.customName = newName;
			cube.lastModified = Date.now();
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	updateLastConnected(deviceId: string) {
		const cube = cubes.find((c) => c.id === deviceId);
		if (cube) {
			cube.lastConnected = Date.now();
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	getCube(deviceId: string): SavedCube | undefined {
		return cubes.find((c) => c.id === deviceId);
	},

	getCubeByMac(macAddress: string): SavedCube | undefined {
		return cubes.find((c) => c.macAddress === macAddress);
	}
};
