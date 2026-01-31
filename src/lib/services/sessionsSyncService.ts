import type { ConvexClient } from 'convex/browser';
import type { Session } from '$lib/types/session';
import { api } from '../../convex/_generated/api';

/**
 * Service for syncing sessions with Convex.
 * Only executes Convex operations when authenticated.
 * activeSessionId is NOT synced - it remains local-only.
 */
class SessionsSyncService {
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
	 * Add a session to Convex (if authenticated)
	 */
	async addSession(session: Session): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.sessions.addSession, { session });
		} catch (error) {
			console.error('[SessionsSyncService] Failed to add session to Convex:', error);
		}
	}

	/**
	 * Update a session in Convex (if authenticated)
	 */
	async updateSession(id: string, updates: Partial<Session>): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.sessions.updateSession, { id, updates });
		} catch (error) {
			console.error('[SessionsSyncService] Failed to update session in Convex:', error);
		}
	}

	/**
	 * Delete (archive) a session in Convex (if authenticated)
	 */
	async deleteSession(id: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.sessions.deleteSession, { id });
		} catch (error) {
			console.error('[SessionsSyncService] Failed to delete session in Convex:', error);
		}
	}

	/**
	 * Restore (unarchive) a session in Convex (if authenticated)
	 */
	async restoreSession(id: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.sessions.restoreSession, { id });
		} catch (error) {
			console.error('[SessionsSyncService] Failed to restore session in Convex:', error);
		}
	}

	/**
	 * Permanently delete a session from Convex (if authenticated)
	 */
	async hardDeleteSession(id: string): Promise<void> {
		if (!this._isAuthenticated || !this.client) return;

		try {
			await this.client.mutation(api.sessions.hardDeleteSession, { id });
		} catch (error) {
			console.error('[SessionsSyncService] Failed to hard delete session in Convex:', error);
		}
	}

	/**
	 * Sync localStorage sessions with Convex on first login.
	 * - Uploads local sessions to Convex (upsert with lastModified comparison)
	 * - Fetches all Convex sessions and merges with local
	 * Returns the merged session list to update localStorage
	 */
	async syncOnLogin(localSessions: Session[]): Promise<Session[]> {
		if (!this._isAuthenticated || !this.client) {
			return localSessions;
		}

		try {
			// First, upload local sessions to Convex (handles conflicts via lastModified)
			if (localSessions.length > 0) {
				const result = await this.client.mutation(api.sessions.bulkUpsertSessions, {
					sessions: localSessions
				});
				console.log(
					`[SessionsSyncService] Bulk upsert complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`
				);
			}

			// Then fetch all sessions from Convex (now includes our uploads)
			const convexSessions = await this.client.query(api.sessions.getSessionsForCurrentUser, {});

			// Import DEFAULT_SETTINGS for merging
			const { DEFAULT_SETTINGS } = await import('$lib/sessionState.svelte');

			// Convert Convex sessions to our Session type (strip Convex-specific fields)
			// Merge with DEFAULT_SETTINGS to ensure new settings have default values
			const mergedSessions: Session[] = convexSessions.map((s) => ({
				id: s.id,
				name: s.name,
				settings: { ...DEFAULT_SETTINGS, ...s.settings },
				createdAt: s.createdAt,
				lastPlayedAt: s.lastPlayedAt,
				lastModified: s.lastModified,
				archived: s.archived,
				deleted: s.deleted,
				deletedAt: s.deletedAt,
				favorite: s.favorite
			}));

			console.log(`[SessionsSyncService] Synced ${mergedSessions.length} sessions from Convex`);
			return mergedSessions;
		} catch (error) {
			console.error('[SessionsSyncService] Sync on login failed:', error);
			// Return local sessions as fallback
			return localSessions;
		}
	}

	/**
	 * Pull sessions from Convex (page load sync - Convex is source of truth).
	 * Does NOT upload local sessions - only fetches from Convex.
	 * This ensures deletions on other devices propagate correctly.
	 */
	async pullFromConvex(): Promise<Session[]> {
		if (!this._isAuthenticated || !this.client) {
			return [];
		}

		try {
			const convexSessions = await this.client.query(api.sessions.getSessionsForCurrentUser, {});

			// Import DEFAULT_SETTINGS for merging
			const { DEFAULT_SETTINGS } = await import('$lib/sessionState.svelte');

			// Convert Convex sessions to our Session type
			const sessions: Session[] = convexSessions.map((s) => ({
				id: s.id,
				name: s.name,
				settings: { ...DEFAULT_SETTINGS, ...s.settings },
				createdAt: s.createdAt,
				lastPlayedAt: s.lastPlayedAt,
				lastModified: s.lastModified,
				archived: s.archived,
				deleted: s.deleted,
				deletedAt: s.deletedAt,
				favorite: s.favorite
			}));

			console.log(`[SessionsSyncService] Pulled ${sessions.length} sessions from Convex`);
			return sessions;
		} catch (error) {
			console.error('[SessionsSyncService] Pull from Convex failed:', error);
			return [];
		}
	}
}

export const sessionsSyncService = new SessionsSyncService();
