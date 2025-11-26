import type { CaseId, GroupId } from './group';

export type TimeEntry = {
	id: number;
	time: number;
};

export type CaseStatistics = {
	solves: number;
	times: TimeEntry[];
};

export type StatisticsState = Record<GroupId, Record<CaseId, CaseStatistics>>;
