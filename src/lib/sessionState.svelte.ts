import { browser } from '$app/environment';
import type { Session, SessionSettings } from './types/session';
import { GROUP_IDS, GROUP_DEFINITIONS } from './types/group';

const STORAGE_KEY = 'sessions';
const ACTIVE_SESSION_KEY = 'activeSessionId';

const DEFAULT_SETTINGS: SessionSettings = {
	caseMode: 'group',
	categorySelection: Object.fromEntries(
		GROUP_IDS.map((id) => [id, GROUP_DEFINITIONS[id].categories.map(() => true)])
	) as any,
	trainStateSelection: { unlearned: false, learning: true, finished: false },
	trainGroupSelection: { basic: true, basicBack: true, advanced: true, expert: true },
	trainSideSelection: { left: true, right: true },
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
		const storedSessions = localStorage.getItem(STORAGE_KEY);
		if (storedSessions) {
			this.sessions = JSON.parse(storedSessions).map((s: Session) => ({
				...s,
				settings: { ...DEFAULT_SETTINGS, ...s.settings }
			}));
		} else {
			// Create default session if none
			this.createSession('Default Session', true);
		}

		const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
		if (storedActiveId && this.sessions.find(s => s.id === storedActiveId)) {
			this.activeSessionId = storedActiveId;
		} else if (this.sessions.length > 0) {
			this.activeSessionId = this.sessions[0].id;
		}
	}

	save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
		if (this.activeSessionId) {
			localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
		}
	}

	createSession(name: string, isDefault = false) {
		const newSession: Session = {
			id: crypto.randomUUID(),
			name,
			settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
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
		this.sessions = this.sessions.filter(s => s.id !== id);
		if (this.activeSessionId === id) {
			this.activeSessionId = this.sessions[0]?.id || null;
		}
		this.save();
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
