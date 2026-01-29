import { browser } from '$app/environment';
import type { Session, SessionSettings } from './types/session';
import { GROUP_IDS, GROUP_DEFINITIONS } from './types/group';
import { loadFromLocalStorage } from '$lib/utils/localStorage';
import { sessionsSyncService } from '$lib/services/sessionsSyncService';

const STORAGE_KEY = 'sessions';
const ACTIVE_SESSION_KEY = 'activeSessionId';

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
	smartCubeEnabled: false,
	drillTimeBetweenCases: 1.0,
	drillHideTwistyPlayer: false
};

class SessionState {
	sessions: Session[] = $state([]);
	activeSessionId: string | null = $state(null);

	constructor() {
		if (browser) {
			this.load();
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

		if (storedActiveId !== null && this.sessions.find((s) => s.id === storedActiveId)) {
			this.activeSessionId = storedActiveId;
		} else {
			// Fallback to the first non-archived session
			const firstActive = this.sessions.find((s) => !s.archived);
			if (firstActive) {
				this.activeSessionId = firstActive.id;
			} else if (this.sessions.length > 0) {
				this.activeSessionId = this.sessions[0].id;
			} else {
				console.warn('No valid sessions found, creating default session');
				this.createSession('Default Session', true);
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

	// Completely remove a session from the list (used for cancelling creation)
	hardDeleteSession(id: string) {
		const index = this.sessions.findIndex((s) => s.id === id);
		if (index !== -1) {
			// If we are deleting the active session, switch to another one first
			if (this.activeSessionId === id) {
				const nextSession = this.sessions.find((s) => !s.archived && s.id !== id);
				this.activeSessionId = nextSession?.id || null;
			}

			this.sessions.splice(index, 1);
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

		// Count active (non-archived) sessions
		const activeCount = this.sessions.filter((s) => !s.archived).length;

		// Prevent deleting the last reachable session
		if (activeCount <= 1 && !session.archived) {
			alert('Cannot delete the last active session');
			return;
		}

		// Soft delete
		session.archived = true;

		// If we deleted the current active session, switch to another valid one
		if (this.activeSessionId === id) {
			const nextSession = this.sessions.find((s) => !s.archived && s.id !== id);
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

	/**
	 * Handle login sync - merge localStorage sessions with Convex
	 */
	async handleLoginSync(): Promise<void> {
		try {
			const mergedSessions = await sessionsSyncService.syncOnLogin(this.sessions);
			this.sessions = mergedSessions;

			// Ensure we have an active session
			if (
				this.activeSessionId === null ||
				!this.sessions.find((s) => s.id === this.activeSessionId)
			) {
				const firstActive = this.sessions.find((s) => !s.archived);
				if (firstActive) {
					this.activeSessionId = firstActive.id;
				} else if (this.sessions.length > 0) {
					this.activeSessionId = this.sessions[0].id;
				}
			}

			this.save();
			console.log('[SessionState] Login sync complete, now have', this.sessions.length, 'sessions');
		} catch (error) {
			console.error('[SessionState] Login sync failed:', error);
		}
	}
}

export const sessionState = new SessionState();
