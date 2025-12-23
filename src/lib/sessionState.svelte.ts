import { browser } from '$app/environment';
import type { Session, SessionSettings } from './types/session';
import { GROUP_IDS, GROUP_DEFINITIONS } from './types/group';
import { loadFromLocalStorage } from '$lib/utils/localStorage';

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
	trainShowTimer: true,
	trainHintAlgorithm: 'step',
	trainHintStickering: 'f2l',
	backView: 'none',
	backViewEnabled: false,
	crossColor: ['white'],
	frontColor: ['red'],
	smartCubeEnabled: false
};

class SessionState {
	sessions: Session[] = $state([]);
	activeSessionId: number | null = $state(null);

	constructor() {
		if (browser) {
			this.load();
		}
	}

	// Get the next available session ID
	private getNextId(): number {
		if (this.sessions.length === 0) return 0;
		const maxId = Math.max(...this.sessions.map((s) => s.id));
		return maxId + 1;
	}

	load() {
		const storedSessions = loadFromLocalStorage<Session[]>(STORAGE_KEY);

		// Check if we have any sessions in localStorage
		if (storedSessions && Array.isArray(storedSessions) && storedSessions.length > 0) {
			// Load existing sessions and merge with default settings to include any new settings
			this.sessions = storedSessions.map((s: Session) => ({
				...s,
				// Merge stored settings with defaults to ensure new settings have default values
				settings: { ...DEFAULT_SETTINGS, ...s.settings }
			}));
		} else {
			// This is the first time the user visits OR localStorage is empty
			// Create the default session only once
			this.sessions = [];
			this.createSession('Default Session', true);
			// After creating default session, return early as activeSessionId is already set
			return;
		}

		// Handle active session selection
		const storedActiveIdStr = localStorage.getItem(ACTIVE_SESSION_KEY);
		const storedActiveId = storedActiveIdStr ? parseInt(storedActiveIdStr, 10) : null;
		// Validate that the stored active ID actually exists in our loaded sessions
		if (
			storedActiveId !== null &&
			!isNaN(storedActiveId) &&
			this.sessions.find((s) => s.id === storedActiveId)
		) {
			this.activeSessionId = storedActiveId;
		} else {
			// Fallback to the first non-archived session, or just the first one
			const firstActive = this.sessions.find((s) => !s.archived);
			if (firstActive) {
				this.activeSessionId = firstActive.id;
			} else if (this.sessions.length > 0) {
				this.activeSessionId = this.sessions[0].id;
			} else {
				// This should not happen, but if all sessions are somehow missing,
				// create a default session as fallback
				console.warn('No valid sessions found, creating default session');
				this.createSession('Default Session', true);
			}
		}
	}

	save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
		if (this.activeSessionId !== null) {
			localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId.toString());
		}
	}

	createSession(name: string, isDefault = false, settings: Partial<SessionSettings> = {}) {
		const newSession: Session = {
			id: this.getNextId(),
			name,
			settings: JSON.parse(JSON.stringify({ ...DEFAULT_SETTINGS, ...settings })),
			createdAt: Date.now(),
			lastPlayedAt: Date.now(),
			solveCount: 0
		};
		this.sessions.push(newSession);
		if (isDefault) {
			this.activeSessionId = newSession.id;
		}
		this.save();
		return newSession;
	}

	updateSession(id: number, updates: Partial<Session>) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			Object.assign(session, updates);
			this.save();
		}
	}

	deleteSession(id: number) {
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
	}

	restoreSession(id: number) {
		const session = this.sessions.find((s) => s.id === id);
		if (session) {
			session.archived = false;
			this.save();
		}
	}

	setActiveSession(id: number) {
		this.activeSessionId = id;
		this.save();
	}

	get activeSession() {
		return this.sessions.find((s) => s.id === this.activeSessionId);
	}
}

export const sessionState = new SessionState();
