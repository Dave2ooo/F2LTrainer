import { browser } from '$app/environment';
import type { Session, SessionSettings } from './types/session';
import { GROUP_IDS, GROUP_DEFINITIONS } from './types/group';
import { loadFromLocalStorage } from '$lib/utils/localStorage';
import { sessionsSyncService } from '$lib/services/sessionsSyncService';

const STORAGE_KEY = 'sessions';
const ACTIVE_SESSION_KEY = 'activeSessionId';

// Keep deleted sessions for 7 days to allow offline deletions to sync
const DELETED_SESSION_RETENTION_DAYS = 7;
const DELETED_SESSION_RETENTION_MS = DELETED_SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const DEFAULT_SETTINGS: SessionSettings = {
	caseMode: 'group',
	categorySelection: Object.fromEntries(
		GROUP_IDS.map((id) => [id, GROUP_DEFINITIONS[id].categories.map(() => true)])
	) as any,
	trainStateSelection: { unlearned: false, learning: true, finished: false },
	trainGroupSelection: { basic: true, basicBack: true, advanced: true, expert: true },
	trainSideSelection: { left: true, right: true },
	selectedCases: {},
	frequencyMode: 'smart',
	smartFrequencySolved: false,
	smartFrequencyTime: false,
	trainMode: 'classic',
	trainAddAuf: true,
	trainShowTimer: false,
	trainHintAlgorithm: 'step',
	trainHintStickering: 'f2l',
	backView: 'none',
	backViewEnabled: false,
	crossColor: ['white'],
	frontColor: ['red'],
	trainLearnEO: false,
	drillTimeBetweenCases: 1.0,
	drillHideTwistyPlayer: false
};

class SessionState {
	sessions: Session[] = $state([]);
	activeSessionId: string | null = $state(null);

	constructor() {
		if (browser) {
			this.load();

			// Auto-save and cleanup old deleted sessions
			$effect.root(() => {
				$effect(() => {
					// Filter out old deleted sessions to keep localStorage clean
					// Keep recent deleted sessions (last 7 days) as a safety buffer for offline deletions
					const now = Date.now();
					const sessionsToSave = this.sessions.filter((session) => {
						if (!session.deletedAt) return true; // Keep all active sessions
						// Keep only deleted sessions from the last 7 days
						return now - session.deletedAt < DELETED_SESSION_RETENTION_MS;
					});

					const removedCount = this.sessions.length - sessionsToSave.length;
					if (removedCount > 0) {
						console.log(
							`[SessionState] Cleaned up ${removedCount} old deleted session(s) from localStorage`
						);
						// Update the sessions array if we removed any
						this.sessions = sessionsToSave;
					}

					this.save();
				});
			});
		}
	}

	load() {
		const storedSessions = loadFromLocalStorage<Session[]>(STORAGE_KEY);

		// Check if we have any sessions in localStorage
		if (storedSessions && Array.isArray(storedSessions) && storedSessions.length > 0) {
			// Load existing sessions and merge with default settings
			this.sessions = storedSessions.map((s: Session) => ({
				...s,
				// Merge stored settings with defaults to ensure new settings have default values
				settings: { ...DEFAULT_SETTINGS, ...s.settings }
			}));
		} else {
			// This is the first time the user visits OR localStorage is empty
			this.sessions = [];
			this.createSession('Default Session', true);
			return;
		}

		// Handle active session selection
		const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);

		if (
			storedActiveId !== null &&
			this.sessions.find((s) => s.id === storedActiveId && !s.deletedAt)
		) {
			this.activeSessionId = storedActiveId;
		} else {
			// Fallback to the first non-archived, non-deleted session
			const firstActive = this.sessions.find((s) => !s.archived && !s.deletedAt);
			if (firstActive) {
				this.activeSessionId = firstActive.id;
			} else {
				// Fallback to first non-deleted session (even if archived)
				const firstVisible = this.sessions.find((s) => !s.deletedAt);
				if (firstVisible) {
					this.activeSessionId = firstVisible.id;
				} else {
					console.warn('No valid sessions found, creating default session');
					this.createSession('Default Session', true);
				}
			}
		}
	}

	save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
		if (this.activeSessionId !== null) {
			localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
		}
	}

	createSession(
		name: string,
		isDefault = false,
		settings: Partial<SessionSettings> = {},
		save = true
	) {
		const newSession: Session = {
			id: crypto.randomUUID(),
			name,
			settings: JSON.parse(JSON.stringify({ ...DEFAULT_SETTINGS, ...settings })),
			createdAt: Date.now(),
			lastPlayedAt: Date.now(),
			lastModified: Date.now(),
			archived: false
		};
		this.sessions.push(newSession);
		if (isDefault) {
			this.activeSessionId = newSession.id;
		}
		if (save) {
			this.save();
			// Sync to Convex if authenticated
			sessionsSyncService.addSession(newSession);
		}
		return newSession;
	}

	// Hard delete a session (marks as deleted, syncs to Convex)
	hardDeleteSession(id: string) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			// If we are deleting the active session, switch to another one first
			if (this.activeSessionId === id) {
				const nextSession = this.sessions.find((s) => !s.archived && !s.deletedAt && s.id !== id);
				this.activeSessionId = nextSession?.id || null;
			}

			// Mark as deleted instead of removing from array
			// This allows offline deletions to sync when logging in
			session.deletedAt = Date.now();
			session.lastModified = Date.now();
			this.save();
			// Sync hard delete to Convex if authenticated
			sessionsSyncService.hardDeleteSession(id);
		}
	}

	updateSession(id: string, updates: Partial<Session>) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			Object.assign(session, updates, { lastModified: Date.now() });
			this.save();
			// Sync to Convex if authenticated
			sessionsSyncService.updateSession(id, { ...updates, lastModified: Date.now() });
		}
	}

	deleteSession(id: string) {
		const session = this.sessions.find((s) => s.id === id);
		if (!session) return;

		// Count active (non-archived, non-deleted) sessions
		const activeCount = this.sessions.filter((s) => !s.archived && !s.deletedAt).length;

		// Prevent deleting the last reachable session
		if (activeCount <= 1 && !session.archived) {
			alert('Cannot delete the last active session');
			return;
		}

		// Soft delete (archive)
		session.archived = true;
		session.lastModified = Date.now();

		// If we deleted the current active session, switch to another valid one
		if (this.activeSessionId === id) {
			const nextSession = this.sessions.find((s) => !s.archived && !s.deletedAt && s.id !== id);
			this.activeSessionId = nextSession?.id || null;
		}
		this.save();
		// Sync to Convex if authenticated
		sessionsSyncService.deleteSession(id);
	}

	restoreSession(id: string) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			session.archived = false;
			session.lastModified = Date.now();
			this.save();
			// Sync to Convex if authenticated
			sessionsSyncService.restoreSession(id);
		}
	}

	duplicateSession(id: string) {
		const session = this.sessions.find((s) => s.id === id);
		if (!session) return null;

		const newSession: Session = {
			id: crypto.randomUUID(),
			name: `${session.name} (Copy)`,
			settings: JSON.parse(JSON.stringify(session.settings)),
			createdAt: Date.now(),
			lastPlayedAt: Date.now(),
			lastModified: Date.now(),
			archived: false
		};
		this.sessions.push(newSession);
		this.activeSessionId = newSession.id;
		this.save();
		// Sync to Convex if authenticated
		sessionsSyncService.addSession(newSession);
		return newSession;
	}

	toggleFavorite(id: string) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			session.favorite = !session.favorite;
			this.save();
			// Sync to Convex if authenticated
			sessionsSyncService.updateSession(id, {
				favorite: session.favorite,
				lastModified: Date.now()
			});
		}
	}

	setActiveSession(id: string) {
		this.activeSessionId = id;
		this.save();
	}

	get activeSession() {
		return this.sessions.find((s) => s.id === this.activeSessionId);
	}

	// Get all sessions that are not deleted (includes archived)
	get visibleSessions() {
		return this.sessions.filter((s) => !s.deletedAt);
	}

	// Get all non-deleted, non-archived sessions
	get activeSessions() {
		return this.sessions.filter((s) => !s.deletedAt && !s.archived);
	}

	/**
	 * Handle login sync - merge localStorage sessions with Convex (first time)
	 * Deleted sessions are synced to Convex then removed from localStorage
	 */
	async handleLoginSync(): Promise<void> {
		try {
			const activeSessions = await sessionsSyncService.syncOnLogin(this.sessions);
			this.sessions = activeSessions;

			// Ensure we have a valid active session (not deleted, not archived)
			const currentActive = this.sessions.find((s) => s.id === this.activeSessionId);
			if (
				this.activeSessionId === null ||
				!currentActive ||
				currentActive.deletedAt ||
				currentActive.archived
			) {
				// Switch to first non-archived, non-deleted session
				const firstActive = this.sessions.find((s) => !s.archived && !s.deletedAt);
				if (firstActive) {
					this.activeSessionId = firstActive.id;
				} else {
					// Fallback to first non-deleted session (even if archived)
					const firstVisible = this.sessions.find((s) => !s.deletedAt);
					if (firstVisible) {
						this.activeSessionId = firstVisible.id;
					}
				}
			}

			this.save();
			console.log(
				'[SessionState] Login sync complete, now have',
				this.sessions.length,
				'active sessions (deleted sessions removed after sync to Convex)'
			);
		} catch (error) {
			console.error('[SessionState] Login sync failed:', error);
		}
	}

	/**
	 * Handle page load sync - pull from Convex (Convex is source of truth)
	 */
	async handlePageLoadSync(): Promise<void> {
		try {
			const convexSessions = await sessionsSyncService.pullFromConvex();
			if (convexSessions.length > 0) {
				this.sessions = convexSessions;

				// Ensure we have a valid active session (not deleted, not archived)
				const currentActive = this.sessions.find((s) => s.id === this.activeSessionId);
				if (
					this.activeSessionId === null ||
					!currentActive ||
					currentActive.deletedAt ||
					currentActive.archived
				) {
					// Switch to first non-archived, non-deleted session
					const firstActive = this.sessions.find((s) => !s.archived && !s.deletedAt);
					if (firstActive) {
						this.activeSessionId = firstActive.id;
					} else {
						// Fallback to first non-deleted session (even if archived)
						const firstVisible = this.sessions.find((s) => !s.deletedAt);
						if (firstVisible) {
							this.activeSessionId = firstVisible.id;
						}
					}
				}

				this.save();
				console.log(
					'[SessionState] Page load sync complete, now have',
					this.sessions.length,
					'sessions'
				);
				// Clean up old deleted sessions after successful sync
				this.cleanupOldDeletedSessions();
			}
		} catch (error) {
			console.error('[SessionState] Page load sync failed:', error);
		}
	}

	/**
	 * Remove deleted sessions older than the retention period from memory
	 */
	private cleanupOldDeletedSessions(): void {
		const now = Date.now();
		const initialCount = this.sessions.length;

		// Filter out old deleted sessions
		const filteredSessions = this.sessions.filter((session) => {
			if (!session.deletedAt) return true; // Keep all active sessions
			// Keep only deleted sessions from the last 7 days
			return now - session.deletedAt < DELETED_SESSION_RETENTION_MS;
		});

		const removedCount = initialCount - filteredSessions.length;
		if (removedCount > 0) {
			this.sessions = filteredSessions;
			console.log(`[SessionState] Cleaned up ${removedCount} old deleted session(s) from memory`);
		}
	}
}

export const sessionState = new SessionState();
