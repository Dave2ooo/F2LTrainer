/**
 * Saved cubes management store
 * Persists cube information to localStorage for quick reconnection
 */

import { savedCubesSyncService } from '$lib/services/savedCubesSyncService';

export interface SavedCube {
	uuid: string; // Globally unique ID for sync (crypto.randomUUID())
	id: string; // Bluetooth device ID or MAC
	deviceName?: string; // Original device name from Bluetooth
	customName: string; // User-provided name
	macAddress?: string; // MAC address if available
	dateAdded: number; // Timestamp when added
	lastConnected: number; // Timestamp of last connection
	lastModified: number; // For sync conflict resolution
	deletedAt?: number; // Soft delete timestamp
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
		return cubes.filter((c) => !c.deletedAt);
	},

	addCube(id: string, deviceName: string, customName?: string, macAddress?: string) {
		const now = Date.now();
		const normalizedMac = macAddress?.toLowerCase();

		// Find all existing cubes that could represent this physical cube
		// This handles migrating old browser IDs and deduping if multiple entries exist
		const matchingIndexes: number[] = [];
		for (let i = 0; i < cubes.length; i++) {
			const c = cubes[i];

			if (c.id === id) {
				matchingIndexes.push(i);
				continue;
			}
			if (normalizedMac && c.macAddress?.toLowerCase() === normalizedMac) {
				matchingIndexes.push(i);
				continue;
			}
			if (!normalizedMac && !c.macAddress && (c.customName === deviceName || c.deviceName === deviceName)) {
				matchingIndexes.push(i);
				continue;
			}
		}

		if (matchingIndexes.length > 0) {
			// Keep the oldest entry to preserve uuid and original dateAdded
			matchingIndexes.sort((a, b) => cubes[a].dateAdded - cubes[b].dateAdded);
			
			const primaryIndex = matchingIndexes[0];
			const primaryCube = cubes[primaryIndex];

			cubes[primaryIndex] = {
				...primaryCube,
				id, // Migrate to new stable ID
				deviceName,
				customName: customName || primaryCube.customName,
				macAddress: normalizedMac || primaryCube.macAddress,
				lastConnected: now,
				lastModified: now,
				deletedAt: undefined
			};

			// Soft delete any duplicates
			for (let i = 1; i < matchingIndexes.length; i++) {
				const dupIndex = matchingIndexes[i];
				cubes[dupIndex] = {
					...cubes[dupIndex],
					deletedAt: now,
					lastModified: now
				};
				savedCubesSyncService.deleteCube(cubes[dupIndex].uuid);
			}

			// Capture reference before array reassignment for robustness
			const updatedPrimary = cubes[primaryIndex];
			cubes = [...cubes];

			// Sync update
			savedCubesSyncService.updateCube(updatedPrimary.uuid, {
				customName: updatedPrimary.customName,
				macAddress: updatedPrimary.macAddress,
				lastConnected: now,
				lastModified: now,
				deletedAt: undefined
			});
		} else {
			// Add new cube
			const newCube: SavedCube = {
				uuid: crypto.randomUUID(),
				id,
				deviceName,
				customName: customName || deviceName,
				macAddress: normalizedMac,
				dateAdded: now,
				lastConnected: now,
				lastModified: now
			};
			cubes = [...cubes, newCube];

			// Sync add
			savedCubesSyncService.addCube(newCube);
		}

		saveCubesToStorage(cubes);
	},

	removeCube(deviceId: string) {
		const cube = cubes.find((c) => c.id === deviceId && !c.deletedAt);
		if (cube) {
			const now = Date.now();
			cube.deletedAt = now;
			cube.lastModified = now;
			cubes = [...cubes];
			saveCubesToStorage(cubes);

			savedCubesSyncService.deleteCube(cube.uuid);
		}
	},

	renameCube(deviceId: string, newName: string) {
		const cube = cubes.find((c) => c.id === deviceId && !c.deletedAt);
		if (cube) {
			cube.customName = newName;
			cube.lastModified = Date.now();
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);

			savedCubesSyncService.updateCube(cube.uuid, {
				customName: newName,
				lastModified: cube.lastModified
			});
		}
	},

	updateLastConnected(deviceId: string) {
		const cube = cubes.find((c) => c.id === deviceId && !c.deletedAt);
		if (cube) {
			cube.lastConnected = Date.now();
			cube.lastModified = Date.now(); // Also update lastModified for sync
			cubes = [...cubes]; // Trigger reactivity
			saveCubesToStorage(cubes);

			savedCubesSyncService.updateCube(cube.uuid, {
				lastConnected: cube.lastConnected,
				lastModified: cube.lastModified
			});
		}
	},

	getCube(deviceId: string): SavedCube | undefined {
		return cubes.find((c) => c.id === deviceId && !c.deletedAt);
	},

	getCubeByMac(macAddress: string): SavedCube | undefined {
		const normalizedMac = macAddress.toLowerCase();
		return cubes.find((c) => c.macAddress?.toLowerCase() === normalizedMac && !c.deletedAt);
	},

	/**
	 * Handle login sync - merge with Convex
	 */
	async handleLoginSync(): Promise<void> {
		try {
			const activeCubes = await savedCubesSyncService.syncOnLogin(cubes);
			cubes = activeCubes;
			saveCubesToStorage(cubes);
		} catch (error) {
			console.error('Failed to handle login sync for saved cubes:', error);
		}
	},

	/**
	 * Handle page load sync - pull from Convex
	 */
	async handlePageLoadSync(): Promise<void> {
		try {
			const remoteCubes = await savedCubesSyncService.pullFromConvex();
			if (remoteCubes.length > 0) {
				cubes = remoteCubes;
				saveCubesToStorage(cubes);
			}
		} catch (error) {
			console.error('Failed to handle page load sync for saved cubes:', error);
		}
	}
};
