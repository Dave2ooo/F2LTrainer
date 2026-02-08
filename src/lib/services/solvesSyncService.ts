import type { ConvexClient } from 'convex/browser';
import type { Solve } from '$lib/types/statisticsState';
import { api } from '../../convex/_generated/api';

/**
 * Service for syncing solves with Convex.
 * Only executes Convex operations when authenticated.
 */
class SolvesSyncService {
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
	 * Add a solve to Convex (if authenticated)
	 */
	async addSolve(solve: Solve): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.solves.addSolve, { solve });
		} catch (error) {
			console.error('[SolvesSyncService] Failed to add solve to Convex:', error);
		}
	}

	/**
	 * Update a solve's time in Convex (if authenticated)
	 */
	async updateSolve(id: string, time: number, timestamp?: number): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.solves.updateSolve, { id, time, timestamp });
		} catch (error) {
			console.error('[SolvesSyncService] Failed to update solve in Convex:', error);
		}
	}

	/**
	 * Delete a solve from Convex (if authenticated)
	 */
	async deleteSolve(id: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.solves.deleteSolve, { id });
		} catch (error) {
			console.error('[SolvesSyncService] Failed to delete solve from Convex:', error);
		}
	}

	/**
	 * Delete all solves for a session from Convex (if authenticated)
	 */
	async deleteSolvesBySession(sessionId: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			const count = await this.client.mutation(api.solves.deleteSolvesBySession, { sessionId });
			console.log(`[SolvesSyncService] Deleted ${count} solves for session ${sessionId}`);
		} catch (error) {
			console.error('[SolvesSyncService] Failed to delete session solves from Convex:', error);
		}
	}

	/**
	 * Move all solves from one session to another (if authenticated)
	 */
	async moveSolvesToSession(sourceSessionId: string, targetSessionId: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			const count = await this.client.mutation(api.solves.moveSolvesToSession, {
				sourceSessionId,
				targetSessionId
			});
			console.log(
				`[SolvesSyncService] Moved ${count} solves from session ${sourceSessionId} to ${targetSessionId}`
			);
		} catch (error) {
			console.error('[SolvesSyncService] Failed to move session solves in Convex:', error);
		}
	}

	/**
	 * Sync localStorage solves with Convex on login.
	 * - Uploads local solves (including deleted ones) to Convex (upsert with timestamp comparison)
	 * - Fetches all Convex solves
	 * - Filters out deleted solves (they're now in Convex, no need in localStorage)
	 * Returns only active solves to update localStorage
	 */
	async syncOnLogin(localSolves: Solve[]): Promise<Solve[]> {
		if (!this._isAuthenticated || !this.client) {
			return localSolves;
		}

		try {
			// First, upload local solves to Convex (handles conflicts via timestamp)
			if (localSolves.length > 0) {
				const activeLocal = localSolves.filter((s) => !s.deletedAt).length;
				const deletedLocal = localSolves.length - activeLocal;
				console.log(
					`[SolvesSyncService] Uploading ${localSolves.length} local solves (${activeLocal} active, ${deletedLocal} deleted)`
				);

				const result = await this.client.mutation(api.solves.bulkUpsertSolves, {
					solves: localSolves
				});
				console.log(
					`[SolvesSyncService] Bulk upsert complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`
				);
			}

			// Then fetch all solves from Convex (now includes our uploads)
			// Include deleted solves to preserve offline deletions
			const convexSolves = await this.client.query(api.solves.getSolvesForCurrentUser, {
				includeDeleted: true
			});

			// Convert Convex solves to our Solve type (strip Convex-specific fields)
			const allSolves: Solve[] = convexSolves.map((s) => ({
				id: s.id,
				groupId: s.groupId as Solve['groupId'],
				caseId: s.caseId,
				time: s.time,
				timestamp: s.timestamp,
				auf: s.auf as Solve['auf'],
				side: (s.side ?? 'right') as Solve['side'],
				scrambleSelection: s.scrambleSelection,
				sessionId: s.sessionId,
				recognitionTime: s.recognitionTime,
				executionTime: s.executionTime,
				trainMode: s.trainMode as Solve['trainMode'],
				deletedAt: s.deletedAt
			}));

			const activeCount = allSolves.filter((s) => !s.deletedAt).length;
			const deletedCount = allSolves.length - activeCount;
			console.log(
				`[SolvesSyncService] Synced ${allSolves.length} solves from Convex (${activeCount} active, ${deletedCount} deleted)`
			);

			// Filter out deleted solves - they're now in Convex, no need to keep in localStorage
			const activeSolves = allSolves.filter((s) => !s.deletedAt);
			if (deletedCount > 0) {
				console.log(
					`[SolvesSyncService] Removing ${deletedCount} deleted solve(s) from localStorage (now synced to Convex)`
				);
			}
			return activeSolves;
		} catch (error) {
			console.error('[SolvesSyncService] Sync on login failed:', error);
			// Return local solves as fallback
			return localSolves;
		}
	}

	/**
	 * Pull solves from Convex (page load sync - Convex is source of truth).
	 * Does NOT upload local solves - only fetches from Convex.
	 * This ensures deletions on other devices propagate correctly.
	 */
	async pullFromConvex(): Promise<Solve[]> {
		if (!this._isAuthenticated || !this.client) {
			return [];
		}

		try {
			// Include deleted solves to preserve offline deletions across syncs
			const convexSolves = await this.client.query(api.solves.getSolvesForCurrentUser, {
				includeDeleted: true
			});

			// Convert Convex solves to our Solve type
			const solves: Solve[] = convexSolves.map((s) => ({
				id: s.id,
				groupId: s.groupId as Solve['groupId'],
				caseId: s.caseId,
				time: s.time,
				timestamp: s.timestamp,
				auf: s.auf as Solve['auf'],
				side: (s.side ?? 'right') as Solve['side'],
				scrambleSelection: s.scrambleSelection,
				sessionId: s.sessionId,
				recognitionTime: s.recognitionTime,
				executionTime: s.executionTime,
				trainMode: s.trainMode as Solve['trainMode'],
				deletedAt: s.deletedAt
			}));

			const activeCount = solves.filter((s) => !s.deletedAt).length;
			const deletedCount = solves.length - activeCount;
			console.log(
				`[SolvesSyncService] Pulled ${solves.length} solves from Convex (${activeCount} active, ${deletedCount} deleted)`
			);
			return solves;
		} catch (error) {
			console.error('[SolvesSyncService] Pull from Convex failed:', error);
			return [];
		}
	}
}

export const solvesSyncService = new SolvesSyncService();
