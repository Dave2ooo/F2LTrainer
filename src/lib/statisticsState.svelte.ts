import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import { type GroupId } from './types/group';
import type {
	StatisticsState,
	Solve,
	CompressedSolve,
	CompressedGroupId,
	CompressedSide,
	CompressedAuf
} from './types/statisticsState';
import type { Auf } from './types/trainCase';
import type { Side } from './types/Side';

export const STATISTICS_STATE_STORAGE_KEY = 'solves';

const GROUP_ID_MAP: Record<GroupId, CompressedGroupId> = {
	basic: 'b',
	basicBack: 'bb',
	advanced: 'a',
	expert: 'e'
};

const REVERSE_GROUP_ID_MAP: Record<CompressedGroupId, GroupId> = {
	b: 'basic',
	bb: 'basicBack',
	a: 'advanced',
	e: 'expert'
};

const SIDE_MAP: Record<Side, CompressedSide> = {
	left: 'l',
	right: 'r'
};

const REVERSE_SIDE_MAP: Record<CompressedSide, Side> = {
	l: 'left',
	r: 'right'
};

const AUF_MAP: Record<Auf, CompressedAuf> = {
	'': 0,
	U: 1,
	U2: 2,
	"U'": 3
};

const REVERSE_AUF_MAP: Record<CompressedAuf, Auf> = {
	0: '',
	1: 'U',
	2: 'U2',
	3: "U'"
};

const MODE_MAP: Record<NonNullable<Solve['trainMode']>, NonNullable<CompressedSolve['m']>> = {
	classic: 'c',
	smart: 's',
	drill: 'd'
};

const REVERSE_MODE_MAP: Record<
	NonNullable<CompressedSolve['m']>,
	NonNullable<Solve['trainMode']>
> = {
	c: 'classic',
	s: 'smart',
	d: 'drill'
};

import { sessionState } from '$lib/sessionState.svelte';

function compressSolve(solve: Solve): CompressedSolve {
	return {
		id: solve.id,
		gId: GROUP_ID_MAP[solve.groupId],
		cId: solve.caseId,
		t: solve.time,
		ts: Math.floor(solve.timestamp / 1000),
		a: AUF_MAP[solve.auf],
		s: SIDE_MAP[solve.side],
		sid: solve.sessionId,
		rt: solve.recognitionTime,
		et: solve.executionTime,
		m: MODE_MAP[solve.trainMode]
	};
}

function decompressSolve(compressed: CompressedSolve): Solve {
	return {
		id: compressed.id,
		groupId: REVERSE_GROUP_ID_MAP[compressed.gId],
		caseId: compressed.cId,
		time: compressed.t,
		timestamp: compressed.ts * 1000,
		// Default values for legacy data if fields are missing
		auf: compressed.a !== undefined ? REVERSE_AUF_MAP[compressed.a] : '',
		side: compressed.s !== undefined ? REVERSE_SIDE_MAP[compressed.s] : 'right',
		scrambleSelection: 0,
		sessionId: compressed.sid,
		// Drill mode timing (optional)
		recognitionTime: compressed.rt,
		executionTime: compressed.et,
		trainMode: REVERSE_MODE_MAP[compressed.m]
	};
}

// Load raw data which could be Solve[] or CompressedSolve[]
const persistedData = loadFromLocalStorage<any[]>(STATISTICS_STATE_STORAGE_KEY);

let initialState: StatisticsState = [];

if (persistedData && Array.isArray(persistedData)) {
	console.log('Loading from localStorage');
	initialState = persistedData
		.filter((item) => {
			const isValid = item !== null && typeof item === 'object';
			if (!isValid) {
				console.warn('[StatisticsState] Skipping invalid solve entry:', item);
			}
			return isValid;
		})
		.map((item) => {
			// Check if it's already compressed (has 'gId')
			if ('gId' in item) {
				return decompressSolve(item as CompressedSolve);
			}
			// Assume it's uncompressed (legacy from previous step)
			return item as Solve;
		});
} else if (persistedData !== null && persistedData !== undefined) {
	console.warn('[StatisticsState] Skipping invalid persisted data (not an array):', persistedData);
}

// Internal state holding ALL solves
// Internal state holding ALL solves
class StatisticsStateManager {
	allSolves: StatisticsState = $state([]);
	isAuthenticated = $state(false);

	constructor(initialData: StatisticsState) {
		this.allSolves = initialData;

		$effect.root(() => {
			$effect(() => {
				saveToLocalStorage(STATISTICS_STATE_STORAGE_KEY, compressStatistics(this.allSolves));
			});
		});
	}

	get statistics() {
		if (sessionState.activeSessionId === null) return [];
		return this.allSolves.filter((s) => s.sessionId === sessionState.activeSessionId);
	}

	addSolve(solve: Solve) {
		// Auto-assign active session ID if missing
		if (!solve.sessionId && sessionState.activeSessionId !== null) {
			solve.sessionId = sessionState.activeSessionId;
		}
		this.allSolves.push(solve);

		// Update the session's lastPlayedAt timestamp
		if (solve.sessionId) {
			sessionState.updateSession(solve.sessionId, { lastPlayedAt: Date.now() });
		}
	}

	updateSolve(id: string, time: number) {
		const solve = this.allSolves.find((s) => s.id === id);
		if (solve) {
			solve.time = time;
		}
	}

	removeSolve(id: string) {
		const index = this.allSolves.findIndex((s) => s.id === id);
		if (index !== -1) {
			this.allSolves.splice(index, 1);
		}
	}

	clearSession(sessionId: string) {
		// Filter out all solves belonging to the given session
		// We do this by keeping only solves that do NOT match the sessionId
		const inputLength = this.allSolves.length;

		// Create a new array with only the solves we want to keep
		// modifying array in place with filter is cleaner in Svelte 5 state proxy
		const keptSolves = this.allSolves.filter((s) => s.sessionId !== sessionId);

		// If we removed anything, update the state
		if (keptSolves.length !== inputLength) {
			// Clear and repopulate to trigger reactivity correctly
			this.allSolves.length = 0;
			this.allSolves.push(...keptSolves);
		}
	}

	getSolveCountForSession(sessionId: string): number {
		return this.allSolves.filter((s) => s.sessionId === sessionId).length;
	}

	moveSessionSolves(sourceSessionId: string, targetSessionId: string): number {
		let movedCount = 0;
		for (const solve of this.allSolves) {
			if (solve.sessionId === sourceSessionId) {
				solve.sessionId = targetSessionId;
				movedCount++;
			}
		}
		return movedCount;
	}
}

export const statisticsState = new StatisticsStateManager(initialState);

export function compressStatistics(stats: StatisticsState): CompressedSolve[] {
	return stats.map(compressSolve);
}
