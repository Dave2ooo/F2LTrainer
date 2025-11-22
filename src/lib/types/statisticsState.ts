import type { CaseId, GroupId } from './group';

export type CaseStatistics = {
	solves: number;
	times: number[];
};

export type StatisticsState = Record<GroupId, Record<CaseId, CaseStatistics>>;
