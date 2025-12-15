/**
 * Saved cubes management store
 * Persists cube information to localStorage for quick reconnection
 */

export interface SavedCube {
	macAddress: string; // MAC address (unique hardware identifier)
	customName: string; // User-provided name
	deviceName: string; // Original Bluetooth device name
	dateAdded: number; // Timestamp when added
	lastConnected: number; // Timestamp of last connection
}

const STORAGE_KEY = 'saved_bluetooth_cubes';

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

	addCube(macAddress: string, deviceName: string, customName?: string) {
		const now = Date.now();
		const newCube: SavedCube = {
			macAddress: macAddress,
			customName: customName || deviceName,
			deviceName: deviceName,
			dateAdded: now,
			lastConnected: now
		};

		// Check if cube already exists by MAC address
		const existingIndex = cubes.findIndex((c) => c.macAddress.toUpperCase() === macAddress.toUpperCase());
		if (existingIndex >= 0) {
			// Update existing cube
			cubes[existingIndex] = {
				...cubes[existingIndex],
				customName: customName || cubes[existingIndex].customName,
				deviceName: deviceName,
				lastConnected: now
			};
		} else {
			// Add new cube
			cubes = [...cubes, newCube];
		}

		saveCubesToStorage(cubes);
	},

	removeCube(macAddress: string) {
		cubes = cubes.filter((c) => c.macAddress.toUpperCase() !== macAddress.toUpperCase());
		saveCubesToStorage(cubes);
	},

	renameCube(macAddress: string, newName: string) {
		const cube = cubes.find((c) => c.macAddress.toUpperCase() === macAddress.toUpperCase());
		if (cube) {
			cube.customName = newName;
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	updateLastConnected(macAddress: string) {
		const cube = cubes.find((c) => c.macAddress.toUpperCase() === macAddress.toUpperCase());
		if (cube) {
			cube.lastConnected = Date.now();
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	getCube(macAddress: string): SavedCube | undefined {
		return cubes.find((c) => c.macAddress.toUpperCase() === macAddress.toUpperCase());
	}
};
