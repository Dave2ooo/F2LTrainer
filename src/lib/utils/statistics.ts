import type { Solve } from '$lib/types/statisticsState';
import type { CaseId, GroupId } from '$lib/types/group';

export function getSolvesForCase(
	solves: Solve[],
	groupId: GroupId,
	caseId: CaseId
): Solve[] {
	return solves.filter((s) => s.groupId === groupId && s.caseId === caseId);
}

export function calculateBestTime(solves: Solve[]): number | null {
	const times = solves.map((s) => s.time).filter((t): t is number => t !== null);
	if (times.length === 0) return null;
	return Math.min(...times);
}

export function calculateAo5(solves: Solve[]): number | null {
	const times = solves.map((s) => s.time).filter((t): t is number => t !== null);
	if (times.length < 5) return null;

	// Get last 5 solves
	const last5 = times.slice(-5);
	// Sort to easily remove best and worst
	const sorted = [...last5].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle3 = sorted.slice(1, 4);
	// Average remaining 3
	const sum = middle3.reduce((a, b) => a + b, 0);
	return sum / 3;
}

export function calculateAo12(solves: Solve[]): number | null {
	const times = solves.map((s) => s.time).filter((t): t is number => t !== null);
	if (times.length < 12) return null;

	// Get last 12 solves
	const last12 = times.slice(-12);
	// Sort to easily remove best and worst
	const sorted = [...last12].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle10 = sorted.slice(1, 11);
	// Average remaining 10
	const sum = middle10.reduce((a, b) => a + b, 0);
	return sum / 10;
}

export function formatTime(timeInCentiseconds: number | null): string {
	if (timeInCentiseconds === null) return '-';
	// Time is stored as centiseconds (1/100s), format as XX.XX
	const seconds = Math.floor(timeInCentiseconds / 100);
	const centiseconds = timeInCentiseconds % 100;
	return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}
