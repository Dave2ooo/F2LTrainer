import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import { GROUP_IDS, type CaseId, type GroupId } from './types/group';
import { casesStatic } from './casesStatic';
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
		ss: solve.scrambleSelection,
		sid: solve.sessionId
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
		scrambleSelection: compressed.ss !== undefined ? compressed.ss : 0,
		sessionId: compressed.sid
	};
}

// Load raw data which could be Solve[] or CompressedSolve[]
const persistedData = loadFromLocalStorage<any[]>(STATISTICS_STATE_STORAGE_KEY);

let initialState: StatisticsState = [];

if (persistedData && Array.isArray(persistedData)) {
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
class StatisticsStateManager {
    allSolves: StatisticsState = $state([]);
    nextSolveId = $state(0);

    constructor(initialData: StatisticsState) {
        this.allSolves = initialData;
        
        let maxId = -1;
        for (const solve of initialData) {
            if (solve.id > maxId) maxId = solve.id;
        }
        this.nextSolveId = maxId + 1;

        $effect.root(() => {
            $effect(() => {
                saveToLocalStorage(STATISTICS_STATE_STORAGE_KEY, compressStatistics(this.allSolves));
            });
        });
    }

    get statistics() {
        if (!sessionState.activeSessionId) return [];
        return this.allSolves.filter(s => s.sessionId === sessionState.activeSessionId);
    }

    getNextSolveId(): number {
        return this.nextSolveId++;
    }

    addSolve(solve: Solve) {
        // Auto-assign active session ID if missing
        if (!solve.sessionId && sessionState.activeSessionId) {
            solve.sessionId = sessionState.activeSessionId;
        }
        this.allSolves.push(solve);
    }

    updateSolve(id: number, time: number) {
        const solve = this.allSolves.find((s) => s.id === id);
        if (solve) {
            solve.time = time;
        }
    }

    removeSolve(id: number) {
        const index = this.allSolves.findIndex((s) => s.id === id);
        if (index !== -1) {
            this.allSolves.splice(index, 1);
        }
    }
}

export const statisticsState = new StatisticsStateManager(initialState);

export function compressStatistics(stats: StatisticsState): CompressedSolve[] {
	return stats.map(compressSolve);
}
