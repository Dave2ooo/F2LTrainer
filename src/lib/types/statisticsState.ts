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
	// Drill mode timing (optional - only set for drill mode solves)
	recognitionTime?: number | null; // Time from case display to first non-U move (centiseconds)
	executionTime?: number | null; // Time from first non-U move to F2L solved (centiseconds)
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
	// Drill mode timing (optional)
	rt?: number | null; // recognitionTime compressed
	et?: number | null; // executionTime compressed
};

export type StatisticsState = Solve[];
