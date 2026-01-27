import { browser } from '$app/environment';
import { api } from '../../convex/_generated/api.js';
import type { Id } from '../../convex/_generated/dataModel';
import type { ConvexClient } from 'convex/browser';

import type { Solve } from '../types/statisticsState';
import { loadFromLocalStorage, saveToLocalStorage } from '$lib/utils/localStorage.js';
import { compressStatistics, STATISTICS_STATE_STORAGE_KEY } from '$lib/statisticsState.svelte.js';

class SolveStore {
	localSolves = $state<Solve[] | null>([]);
	convexSolves = $state<Solve[] | null>([]);
	isAuthenticated = $state(false);

	constructor() {
		if (browser) {
			const localSolves = localStorage.getItem('offlineTasks');
			if (localSolves) {
				this.localSolves = loadFromLocalStorage<any[]>(STATISTICS_STATE_STORAGE_KEY);
			}
		}
	}

	setAuthStatus(status: boolean) {
		this.isAuthenticated = status;
	}

	get allSolves() {
		return this.isAuthenticated ? this.convexSolves : this.localSolves;
	}

	setConvexSolves(solves: Solve[]) {
		this.convexSolves = solves;
	}

	saveLocal() {
		if (browser) {
			localStorage.setItem('offlineTasks', JSON.stringify(this.localSolves));
			// saveToLocalStorage(STATISTICS_STATE_STORAGE_KEY, compressStatistics(this.allSolves));
		}
	}
}
