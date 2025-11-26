import { loadFromLocalStorage } from './utils/localStorage';
import { GROUP_IDS, type CaseId, type GroupId } from './types/group';
import { casesStatic } from './casesStatic';
import type { StatisticsState, CaseStatistics, TimeEntry } from './types/statisticsState';

export const STATISTICS_STATE_STORAGE_KEY = 'statistics';

// Global solve ID counter - starts from 0 and increments with each solve
let nextSolveId = $state(0);

export function getNextSolveId(): number {
	return nextSolveId++;
}

export function setNextSolveId(id: number): void {
	nextSolveId = id;
}

const createCaseStatistics = (): CaseStatistics => ({
	solves: 0,
	times: []
});

const createGroupStatisticsState = (groupId: GroupId): Record<CaseId, CaseStatistics> => {
	const caseEntries = Object.keys(casesStatic[groupId]).map((caseId) => [
		Number(caseId) as CaseId,
		createCaseStatistics()
	]);

	return Object.fromEntries(caseEntries) as Record<CaseId, CaseStatistics>;
};

const createDefaultStatisticsState = (): StatisticsState =>
	Object.fromEntries(
		GROUP_IDS.map((groupId) => [groupId, createGroupStatisticsState(groupId)])
	) as StatisticsState;

const persistedStatisticsState = loadFromLocalStorage<Partial<StatisticsState>>(
	STATISTICS_STATE_STORAGE_KEY
);

const initialState = createDefaultStatisticsState();

// Track the highest solve ID found in persisted data
let maxSolveId = -1;

if (persistedStatisticsState) {
	for (const groupId of GROUP_IDS) {
		const persistedGroup = persistedStatisticsState[groupId];
		if (!persistedGroup) continue;

		for (const [caseIdString, caseStats] of Object.entries(initialState[groupId])) {
			const caseId = Number(caseIdString) as CaseId;
			const persistedCase = persistedGroup[caseId];

			if (persistedCase) {
				Object.assign(caseStats, persistedCase);
				
				// Find the highest solve ID in the times array
				if (persistedCase.times && Array.isArray(persistedCase.times)) {
					for (const timeEntry of persistedCase.times) {
						if (typeof timeEntry === 'object' && 'id' in timeEntry && typeof timeEntry.id === 'number') {
							if (timeEntry.id > maxSolveId) {
								maxSolveId = timeEntry.id;
							}
						}
					}
				}
			}
		}
	}
}

// Set the next solve ID to be one more than the highest found
nextSolveId = maxSolveId + 1;

export const statistics: StatisticsState = $state(initialState);
