/**
 * Saved cubes management store
 * Persists cube information to localStorage for quick reconnection
 */

export interface SavedCube {
	id: string; // Bluetooth device ID (persistent)
	customName: string; // User-provided name
	deviceName: string; // Original Bluetooth device name
	macAddress?: string; // MAC address if available
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

	addCube(deviceId: string, deviceName: string, customName?: string, macAddress?: string) {
		const now = Date.now();
		const newCube: SavedCube = {
			id: deviceId,
			customName: customName || deviceName,
			deviceName: deviceName,
			macAddress: macAddress,
			dateAdded: now,
			lastConnected: now
		};

		// Check if cube already exists
		const existingIndex = cubes.findIndex(c => c.id === deviceId);
		if (existingIndex >= 0) {
			// Update existing cube
			cubes[existingIndex] = {
				...cubes[existingIndex],
				customName: customName || cubes[existingIndex].customName,
				macAddress: macAddress || cubes[existingIndex].macAddress,
				lastConnected: now
			};
		} else {
			// Add new cube
			cubes = [...cubes, newCube];
		}

		saveCubesToStorage(cubes);
	},

	removeCube(deviceId: string) {
		cubes = cubes.filter(c => c.id !== deviceId);
		saveCubesToStorage(cubes);
	},

	renameCube(deviceId: string, newName: string) {
		const cube = cubes.find(c => c.id === deviceId);
		if (cube) {
			cube.customName = newName;
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	updateLastConnected(deviceId: string) {
		const cube = cubes.find(c => c.id === deviceId);
		if (cube) {
			cube.lastConnected = Date.now();
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);
		}
	},

	getCube(deviceId: string): SavedCube | undefined {
		return cubes.find(c => c.id === deviceId);
	}
};
