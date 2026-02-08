import type { ConvexClient } from 'convex/browser';
import type { CaseState } from '$lib/types/caseState';
import type { GroupId, CaseId } from '$lib/types/group';
import { api } from '../../convex/_generated/api';
import type { CaseStateData } from '../../convex/caseStates';

/**
 * Service for syncing case states with Convex.
 * Only executes Convex operations when authenticated.
 */
class CaseStatesSyncService {
	private client: ConvexClient | null = null;
	private _isAuthenticated = false;
	private pendingUpdates: Map<string, { groupId: GroupId; caseId: CaseId; caseState: CaseState }> =
		new Map();
	private batchTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly BATCH_DELAY_MS = 1000; // Batch updates for 1 second

	/**
	 * Called when auth state changes (from ConvexClerkSync)
	 */
	setClient(client: ConvexClient) {
		this.client = client;
	}

	setAuthenticated(authenticated: boolean) {
		this._isAuthenticated = authenticated;
		// Clear pending updates if logged out
		if (!authenticated) {
			this.clearBatch();
		}
	}

	get isAuthenticated() {
		return this._isAuthenticated;
	}

	private clearBatch() {
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}
		this.pendingUpdates.clear();
	}

	/**
	 * Convert nested case states to flat format for Convex
	 */
	private flattenCaseStates(
		nestedStates: Record<GroupId, Record<CaseId, CaseState>>
	): CaseStateData[] {
		const flattened: CaseStateData[] = [];

		for (const [groupId, groupCases] of Object.entries(nestedStates)) {
			for (const [caseIdStr, caseState] of Object.entries(groupCases)) {
				flattened.push({
					groupId,
					caseId: Number(caseIdStr),
					trainState: caseState.trainState,
					algorithmSelectionLeft: caseState.algorithmSelection.left,
					algorithmSelectionRight: caseState.algorithmSelection.right,
					customAlgorithmLeft: caseState.customAlgorithm.left,
					customAlgorithmRight: caseState.customAlgorithm.right,
					identicalAlgorithm: caseState.identicalAlgorithm,
					lastModified: caseState.lastModified
				});
			}
		}

		return flattened;
	}

	/**
	 * Convert flat case states from Convex to nested format
	 */
	private unflattenCaseStates(
		flatStates: CaseStateData[]
	): Record<GroupId, Record<CaseId, CaseState>> {
		const nested: Record<string, Record<number, CaseState>> = {};

		for (const flat of flatStates) {
			if (!nested[flat.groupId]) {
				nested[flat.groupId] = {};
			}

			nested[flat.groupId][flat.caseId] = {
				trainState: flat.trainState,
				algorithmSelection: {
					left: flat.algorithmSelectionLeft,
					right: flat.algorithmSelectionRight
				},
				customAlgorithm: {
					left: flat.customAlgorithmLeft,
					right: flat.customAlgorithmRight
				},
				identicalAlgorithm: flat.identicalAlgorithm,
				lastModified: flat.lastModified
			};
		}

		return nested as Record<GroupId, Record<CaseId, CaseState>>;
	}

	/**
	 * Update a single case state in Convex (if authenticated) - batched for efficiency
	 */
	async updateCaseState(groupId: GroupId, caseId: CaseId, caseState: CaseState): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		// Add to batch
		const key = `${groupId}:${caseId}`;
		this.pendingUpdates.set(key, { groupId, caseId, caseState });

		// Reset batch timeout
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
		}

		// Schedule batch processing
		this.batchTimeout = setTimeout(() => this.processBatch(), this.BATCH_DELAY_MS);
	}

	/**
	 * Process all pending case state updates as a batch
	 */
	private async processBatch(): Promise<void> {
		if (!this._isAuthenticated || !this.client || this.pendingUpdates.size === 0) {
			return;
		}

		try {
			const updates = Array.from(this.pendingUpdates.values());
			const flatStates = updates.map(({ groupId, caseId, caseState }) => ({
				groupId,
				caseId,
				trainState: caseState.trainState,
				algorithmSelectionLeft: caseState.algorithmSelection.left,
				algorithmSelectionRight: caseState.algorithmSelection.right,
				customAlgorithmLeft: caseState.customAlgorithm.left,
				customAlgorithmRight: caseState.customAlgorithm.right,
				identicalAlgorithm: caseState.identicalAlgorithm,
				lastModified: caseState.lastModified
			}));

			const result = await this.client.mutation(api.caseStates.bulkUpsertCaseStates, {
				caseStates: flatStates
			});

			if (result.errors && result.errors.length > 0) {
				console.warn('[CaseStatesSyncService] Batch update had errors:', result.errors);
			}

			console.log(
				`[CaseStatesSyncService] Batch update complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`
			);
		} catch (error) {
			console.error('[CaseStatesSyncService] Failed to process batch update:', error);
		} finally {
			this.clearBatch();
		}
	}

	/**
	 * Force immediate processing of any pending updates
	 */
	async flushPendingUpdates(): Promise<void> {
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}
		await this.processBatch();
	}

	/**
	 * Sync localStorage case states with Convex on first login.
	 * - Uploads local case states to Convex (upsert with lastModified comparison)
	 * - Fetches all Convex case states and merges with local
	 * Returns the merged case states to update localStorage
	 */
	async syncOnLogin(
		localCaseStates: Record<GroupId, Record<CaseId, CaseState>>
	): Promise<Record<GroupId, Record<CaseId, CaseState>>> {
		if (!this._isAuthenticated || !this.client) {
			return localCaseStates;
		}

		try {
			// First, upload local case states to Convex (handles conflicts via lastModified)
			const flatLocalStates = this.flattenCaseStates(localCaseStates);
			if (flatLocalStates.length > 0) {
				const result = await this.client.mutation(api.caseStates.bulkUpsertCaseStates, {
					caseStates: flatLocalStates
				});

				if (result.errors && result.errors.length > 0) {
					console.warn('[CaseStatesSyncService] Login sync had errors:', result.errors);
				}

				console.log(
					`[CaseStatesSyncService] Bulk upsert complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`
				);
			}

			// Then fetch all case states from Convex (now includes our uploads)
			const convexStates = await this.client.query(api.caseStates.getCaseStatesForCurrentUser, {});

			// Convert back to nested format
			const mergedStates = this.unflattenCaseStates(convexStates);

			console.log(`[CaseStatesSyncService] Synced ${convexStates.length} case states from Convex`);
			return mergedStates as Record<GroupId, Record<CaseId, CaseState>>;
		} catch (error) {
			console.error('[CaseStatesSyncService] Sync on login failed:', error);
			// Return local states as fallback
			return localCaseStates;
		}
	}

	/**
	 * Pull case states from Convex (page load sync - Convex is source of truth).
	 * Does NOT upload local case states - only fetches from Convex.
	 * This ensures deletions on other devices propagate correctly.
	 */
	async pullFromConvex(): Promise<Record<GroupId, Record<CaseId, CaseState>>> {
		if (!this._isAuthenticated || !this.client) {
			return {} as Record<GroupId, Record<CaseId, CaseState>>;
		}

		try {
			const convexStates = await this.client.query(api.caseStates.getCaseStatesForCurrentUser, {});

			// Convert to nested format
			const nestedStates = this.unflattenCaseStates(convexStates);

			console.log(`[CaseStatesSyncService] Pulled ${convexStates.length} case states from Convex`);
			return nestedStates as Record<GroupId, Record<CaseId, CaseState>>;
		} catch (error) {
			console.error('[CaseStatesSyncService] Pull from Convex failed:', error);
			return {} as Record<GroupId, Record<CaseId, CaseState>>;
		}
	}
}

export const caseStatesSyncService = new CaseStatesSyncService();
