import { loadFromLocalStorage } from './utils/localStorage';
import { GROUP_IDS, type CaseId, type GroupId } from './types/group';
import { casesStatic } from './casesStatic';
import type { StatisticsState, CaseStatistics } from './types/statisticsState';

export const STATISTICS_STATE_STORAGE_KEY = 'statistics';

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

if (persistedStatisticsState) {
	for (const groupId of GROUP_IDS) {
		const persistedGroup = persistedStatisticsState[groupId];
		if (!persistedGroup) continue;

		for (const [caseIdString, caseStats] of Object.entries(initialState[groupId])) {
			const caseId = Number(caseIdString) as CaseId;
			const persistedCase = persistedGroup[caseId];

			if (persistedCase) {
				Object.assign(caseStats, persistedCase);
			}
		}
	}
}

export const statistics: StatisticsState = $state(initialState);
