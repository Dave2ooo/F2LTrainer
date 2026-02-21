/**
 * Saved cubes management store
 * Persists cube information to localStorage for quick reconnection
 */

import { savedCubesSyncService } from '$lib/services/savedCubesSyncService';

export interface SavedCube {
	uuid: string; // Globally unique ID for sync (crypto.randomUUID())
	id: string; // Bluetooth device ID (browser-specific, not synced)
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

	addCube(deviceId: string, deviceName: string, customName?: string, macAddress?: string) {
		const now = Date.now();

		// Normalize MAC address to lowercase for case-insensitive comparison
		const normalizedMac = macAddress?.toLowerCase();

		// First, check if a cube with the same MAC address already exists
		// This handles the case where deviceId changes between connections
		let existingMacIndex = normalizedMac ? cubes.findIndex((c) => c.macAddress?.toLowerCase() === normalizedMac) : -1;

		// Also check for deviceId match (might be a stale entry)
		const existingIdIndex = cubes.findIndex((c) => c.id === deviceId);

		if (existingMacIndex >= 0) {
			// Found a cube with matching MAC - update it
			const existingCube = cubes[existingMacIndex];

			// If there's a DIFFERENT entry with the same deviceId, remove it (stale entry)
			if (existingIdIndex >= 0 && existingIdIndex !== existingMacIndex) {
				cubes = cubes.filter((_, i) => i !== existingIdIndex);
				// Recalculate the MAC index after removal
				existingMacIndex = cubes.findIndex((c) => c.macAddress?.toLowerCase() === normalizedMac);
			}

			if (existingMacIndex >= 0) {
				cubes[existingMacIndex] = {
					...cubes[existingMacIndex],
					id: deviceId, // Update deviceId in case it changed
					customName: customName || cubes[existingMacIndex].customName,
					macAddress: normalizedMac || cubes[existingMacIndex].macAddress,
					lastConnected: now,
					lastModified: now,
					deletedAt: undefined // Undelete if it was soft-deleted
				};
				cubes = [...cubes]; // Trigger reactivity
				
				// Sync update
				savedCubesSyncService.updateCube(cubes[existingMacIndex].uuid, {
					customName: cubes[existingMacIndex].customName,
					macAddress: cubes[existingMacIndex].macAddress,
					lastConnected: now,
					lastModified: now,
					deletedAt: undefined // Undelete in cloud
				});
			}
		} else if (existingIdIndex >= 0) {
			cubes[existingIdIndex] = {
				...cubes[existingIdIndex],
				customName: customName || cubes[existingIdIndex].customName,
				macAddress: normalizedMac || cubes[existingIdIndex].macAddress,
				lastConnected: now,
				lastModified: now,
				deletedAt: undefined // Undelete if it was soft-deleted
			};
			cubes = [...cubes]; // Trigger reactivity

			// Sync update
			savedCubesSyncService.updateCube(cubes[existingIdIndex].uuid, {
				customName: cubes[existingIdIndex].customName,
				macAddress: cubes[existingIdIndex].macAddress,
				lastConnected: now,
				lastModified: now,
				deletedAt: undefined // Undelete in cloud
			});
		} else {
			// Add new cube
			const newCube: SavedCube = {
				uuid: crypto.randomUUID(),
				id: deviceId,
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
		const cube = cubes.find((c) => c.id === deviceId);
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
		const cube = cubes.find((c) => c.id === deviceId);
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
		const cube = cubes.find((c) => c.id === deviceId);
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
		return cubes.find((c) => c.id === deviceId);
	},

	getCubeByMac(macAddress: string): SavedCube | undefined {
		const normalizedMac = macAddress.toLowerCase();
		return cubes.find((c) => c.macAddress?.toLowerCase() === normalizedMac);
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
