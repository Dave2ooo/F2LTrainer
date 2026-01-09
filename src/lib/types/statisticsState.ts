import type { Auf } from './trainCase';
import type { Side } from '$lib/types/Side';
import type { CaseId, GroupId } from './group';

export type TrainMode = 'classic' | 'smart' | 'drill';

export type Solve = {
	id: string;
	groupId: GroupId;
	caseId: CaseId;
	time?: number; // Time in centiseconds (1/100s), undefined for untimed solves
	timestamp: number;
	auf: Auf;
	side: Side;
	scrambleSelection: number;
	sessionId?: string;
	// Drill mode timing (optional - only set for drill mode solves)
	recognitionTime?: number; // Time from case display to first non-U move (centiseconds)
	executionTime?: number; // Time from first non-U move to F2L solved (centiseconds)
	trainMode: TrainMode;
};

export type CompressedGroupId = 'b' | 'bb' | 'a' | 'e';
export type CompressedSide = 'l' | 'r';
export type CompressedAuf = 0 | 1 | 2 | 3; // '' -> 0, 'U' -> 1, 'U2' -> 2, "U'" -> 3

export type CompressedSolve = {
	id: string;
	gId: CompressedGroupId;
	cId: number;
	t?: number;
	ts: number;
	a: CompressedAuf;
	s: CompressedSide;
	sid?: string;
	// Drill mode timing (optional)
	rt?: number; // recognitionTime compressed
	et?: number; // executionTime compressed
	m: 'c' | 's' | 'd'; // trainMode compressed
};

export type StatisticsState = Solve[];
