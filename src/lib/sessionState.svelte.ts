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
	crossColor: ['white'],
	frontColor: ['red'],
	smartCubeEnabled: false
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
		if (storedSessions && Array.isArray(storedSessions) && storedSessions.length > 0) {
			this.sessions = storedSessions.map((s: Session) => ({
				...s,
				settings: { ...DEFAULT_SETTINGS, ...s.settings }
			}));
		} else {
			// Create default session if none found or loaded array was empty
            this.sessions = []; // Ensure it's empty before pushing to avoid duplicates if something weird happened
			this.createSession('Default Session', true);
		}

		const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
		// Validate that the stored active ID actually exists in our loaded sessions
		if (storedActiveId && this.sessions.find(s => s.id === storedActiveId)) {
			this.activeSessionId = storedActiveId;
		} else {
            // Fallback to the first non-archived session, or just the first one
            const firstActive = this.sessions.find(s => !s.archived);
			this.activeSessionId = firstActive ? firstActive.id : this.sessions[0].id;
		}
	}

	save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
		if (this.activeSessionId) {
			localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
		}
	}

	createSession(name: string, isDefault = false, settings: Partial<SessionSettings> = {}) {
		const newSession: Session = {
			id: crypto.randomUUID(),
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

	updateSession(id: string, updates: Partial<Session>) {
		const session = this.sessions.find(s => s.id === id);
		if (session) {
			Object.assign(session, updates);
			this.save();
		}
	}

	deleteSession(id: string) {
		const session = this.sessions.find(s => s.id === id);
		if (!session) return;

		// Count active (non-archived) sessions
		const activeCount = this.sessions.filter(s => !s.archived).length;

		// Prevent deleting the last reachable session
		if (activeCount <= 1 && !session.archived) {
			alert('Cannot delete the last active session');
			return;
		}

		// Soft delete
		session.archived = true;
		
		// If we deleted the current active session, switch to another valid one
		if (this.activeSessionId === id) {
			const nextSession = this.sessions.find(s => !s.archived && s.id !== id);
			this.activeSessionId = nextSession?.id || null;
		}
		this.save();
	}

	restoreSession(id: string) {
		const session = this.sessions.find(s => s.id === id);
		if (session) {
			session.archived = false;
			this.save();
		}
	}

	setActiveSession(id: string) {
		this.activeSessionId = id;
		this.save();
	}

	get activeSession() {
		return this.sessions.find(s => s.id === this.activeSessionId);
	}
}

export const sessionState = new SessionState();
