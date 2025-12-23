import type { Auf } from './trainCase';
import type { Side } from '$lib/types/Side';
import type { CaseId, GroupId } from './group';

export type Solve = {
	id: number;
	groupId: GroupId;
	caseId: CaseId;
	time: number | null; // Time in centiseconds (1/100s), or null for untimed solves
	timestamp: number;
	auf: Auf;
	side: Side;
	scrambleSelection: number;
	sessionId?: number;
};

export type CompressedGroupId = 'b' | 'bb' | 'a' | 'e';
export type CompressedSide = 'l' | 'r';
export type CompressedAuf = 0 | 1 | 2 | 3; // '' -> 0, 'U' -> 1, 'U2' -> 2, "U'" -> 3

export type CompressedSolve = {
	id: number;
	gId: CompressedGroupId;
	cId: number;
	t: number | null;
	ts: number;
	a: CompressedAuf;
	s: CompressedSide;
	ss: number;
	sid?: number;
};

export type StatisticsState = Solve[];
