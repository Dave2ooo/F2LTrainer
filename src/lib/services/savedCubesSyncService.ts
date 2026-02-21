import type { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import type { SavedCube } from '$lib/bluetooth/savedCubes.svelte';

/**
 * Service for syncing saved cubes with Convex.
 * Only executes Convex operations when authenticated.
 */
class SavedCubesSyncService {
	private client: ConvexClient | null = null;
	private _isAuthenticated = false;

	/**
	 * Called when auth state changes (from ConvexClerkSync)
	 */
	setClient(client: ConvexClient) {
		this.client = client;
	}

	setAuthenticated(authenticated: boolean) {
		this._isAuthenticated = authenticated;
	}

	get isAuthenticated() {
		return this._isAuthenticated;
	}

	/**
	 * Add a saved cube to Convex (if authenticated)
	 */
	async addCube(cube: SavedCube): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			// Map SavedCube to schema-compatible object (omit local-only 'id')
			const convexCube = {
				uuid: cube.uuid,
				name: cube.customName,
				macAddress: cube.macAddress,
				dateAdded: cube.dateAdded,
				lastConnected: cube.lastConnected,
				lastModified: cube.lastModified,
				deletedAt: undefined // New cubes aren't deleted
			};
			await this.client.mutation(api.savedCubes.addCube, { cube: convexCube });
		} catch (error) {
			console.error('[SavedCubesSyncService] Failed to add cube to Convex:', error);
		}
	}

	/**
	 * Update a saved cube in Convex (if authenticated)
	 */
	async updateCube(uuid: string, updates: Partial<SavedCube>): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			const convexUpdates: any = {};
			if (updates.customName) convexUpdates.name = updates.customName;
			if (updates.macAddress) convexUpdates.macAddress = updates.macAddress;
			if (updates.lastConnected) convexUpdates.lastConnected = updates.lastConnected;

			// Handle deletedAt for undeletion (undefined means undelete)
			if ('deletedAt' in updates) {
				convexUpdates.deletedAt = updates.deletedAt ?? null;
			}

			// Always update lastModified
			convexUpdates.lastModified = updates.lastModified || Date.now();

			await this.client.mutation(api.savedCubes.updateCube, { uuid, updates: convexUpdates });
		} catch (error) {
			console.error('[SavedCubesSyncService] Failed to update cube in Convex:', error);
		}
	}

	/**
	 * Delete a saved cube from Convex (if authenticated)
	 */
	async deleteCube(uuid: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.savedCubes.deleteCube, { uuid });
		} catch (error) {
			console.error('[SavedCubesSyncService] Failed to delete cube from Convex:', error);
		}
	}

	/**
	 * Sync localStorage cubes with Convex on login.
	 */
	async syncOnLogin(localCubes: SavedCube[]): Promise<SavedCube[]> {
		if (!this._isAuthenticated || !this.client) {
			return localCubes;
		}

		try {
			// 1. Upload local cubes
			if (localCubes.length > 0) {
				const convexCubes = localCubes.map((c) => ({
					uuid: c.uuid,
					name: c.customName,
					macAddress: c.macAddress,
					dateAdded: c.dateAdded,
					lastConnected: c.lastConnected,
					lastModified: c.lastModified,
					deletedAt: c.deletedAt
				}));
				await this.client.mutation(api.savedCubes.bulkUpsertCubes, {
					cubes: convexCubes
				});
			}

			// 2. Fetch all from Convex
			const serverCubes = await this.client.query(api.savedCubes.getSavedCubesForCurrentUser, {
				includeDeleted: true
			});

			// 3. Merge/Convert
			const mergedCubes: SavedCube[] = serverCubes
				.map((s) => ({
					uuid: s.uuid,
					id: s.uuid, // Use uuid as local ID since we don't have the original bluetooth ID
					customName: s.name,
					macAddress: s.macAddress,
					dateAdded: s.dateAdded,
					lastConnected: s.lastConnected,
					lastModified: s.lastModified
					// We don't put deletedAt in SavedCube interface, we filter them out.
				}))
				.filter((c) => {
					// Check if the server record is deleted
					const serverRecord = serverCubes.find((s) => s.uuid === c.uuid);
					return !serverRecord?.deletedAt;
				});

			console.log(`[SavedCubesSyncService] Synced ${mergedCubes.length} cubes from Convex`);
			return mergedCubes;
		} catch (error) {
			console.error('[SavedCubesSyncService] Sync on login failed:', error);
			return localCubes;
		}
	}

	/**
	 * Pull cubes from Convex (page load sync).
	 */
	async pullFromConvex(): Promise<SavedCube[]> {
		if (!this._isAuthenticated || !this.client) {
			return [];
		}

		try {
			const serverCubes = await this.client.query(api.savedCubes.getSavedCubesForCurrentUser, {
				includeDeleted: false
			});

			const cubes: SavedCube[] = serverCubes.map((s) => ({
				uuid: s.uuid,
				id: s.uuid, // Fallback ID
				customName: s.name,
				macAddress: s.macAddress,
				dateAdded: s.dateAdded,
				lastConnected: s.lastConnected,
				lastModified: s.lastModified
			}));

			console.log(`[SavedCubesSyncService] Pulled ${cubes.length} cubes from Convex`);
			return cubes;
		} catch (error) {
			console.error('[SavedCubesSyncService] Pull from Convex failed:', error);
			return [];
		}
	}
}

export const savedCubesSyncService = new SavedCubesSyncService();
