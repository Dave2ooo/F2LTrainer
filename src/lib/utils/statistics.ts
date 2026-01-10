import type { Solve } from '$lib/types/statisticsState';
import type { CaseId, GroupId } from '$lib/types/group';

export function getSolvesForCase(solves: Solve[], groupId: GroupId, caseId: CaseId): Solve[] {
	return solves.filter((s) => s.groupId === groupId && s.caseId === caseId);
}

/**
 * Get the effective time for a solve, preferring time, then falling back to executionTime.
 * This handles different training modes which store time in different fields.
 */
export function getEffectiveTime(solve: Solve): number | undefined {
	return solve.time ?? solve.executionTime;
}

export function calculateBestTime(solves: Solve[]): number | undefined {
	const times = solves.map((s) => getEffectiveTime(s)).filter((t): t is number => t !== undefined);
	if (times.length === 0) return undefined;
	const best = Math.min(...times);
	return Math.round(best);
}

export function calculateMean(solves: Solve[]): number | undefined {
	const times = solves.map((s) => getEffectiveTime(s)).filter((t): t is number => t !== undefined);
	if (times.length === 0) return undefined;
	const sum = times.reduce((a, b) => a + b, 0);
	return Math.round(sum / times.length);
}

export function calculateAo5(solves: Solve[]): number | undefined {
	const times = solves.map((s) => getEffectiveTime(s)).filter((t): t is number => t !== undefined);
	if (times.length < 5) return undefined;

	// Get last 5 solves
	const last5 = times.slice(-5);
	// Sort to easily remove best and worst
	const sorted = [...last5].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle3 = sorted.slice(1, 4);
	// Average remaining 3
	const sum = middle3.reduce((a, b) => a + b, 0);
	const average = sum / 3;
	return Math.round(average);
}

export function calculateAo12(solves: Solve[]): number | undefined {
	const times = solves.map((s) => getEffectiveTime(s)).filter((t): t is number => t !== undefined);
	if (times.length < 12) return undefined;

	// Get last 12 solves
	const last12 = times.slice(-12);
	// Sort to easily remove best and worst
	const sorted = [...last12].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle10 = sorted.slice(1, 11);
	// Average remaining 10
	const sum = middle10.reduce((a, b) => a + b, 0);
	const average = sum / 10;
	return Math.round(average);
}

export function formatTime(timeInCentiseconds: number | undefined): string {
	if (timeInCentiseconds === undefined) return '-';
	// Time is stored as centiseconds (1/100s), format as XX.XX
	// Round to ensure we're working with integers
	const rounded = Math.round(timeInCentiseconds);
	const seconds = Math.floor(rounded / 100);
	const centiseconds = rounded % 100;
	return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate rolling Ao5 values for each solve in the history.
 * Returns an array where each element is the Ao5 up to that point,
 * or undefined if there aren't enough solves yet.
 * The returned array has the same length as the input solves array.
 */
export function calculateRollingAo5(solves: Solve[]): (number | undefined)[] {
	const result: (number | undefined)[] = [];
	const nonNullTimes: number[] = [];

	for (let i = 0; i < solves.length; i++) {
		const currentTime = getEffectiveTime(solves[i]);

		// Add current time to our running list if it's not undefined
		if (currentTime !== undefined) {
			nonNullTimes.push(currentTime);
		}

		// Check if we have enough non-null times for Ao5
		if (nonNullTimes.length < 5) {
			result.push(undefined);
		} else {
			// Get last 5 non-null times
			const last5 = nonNullTimes.slice(-5);
			// Sort to easily remove best and worst
			const sorted = [...last5].sort((a, b) => a - b);
			// Remove best (first) and worst (last)
			const middle3 = sorted.slice(1, 4);
			// Average remaining 3
			const sum = middle3.reduce((a, b) => a + b, 0);
			const average = sum / 3;
			result.push(Math.round(average));
		}
	}

	return result;
}

/**
 * Calculate rolling Ao12 values for each solve in the history.
 * Returns an array where each element is the Ao12 up to that point,
 * or undefined if there aren't enough solves yet.
 * The returned array has the same length as the input solves array.
 */
export function calculateRollingAo12(solves: Solve[]): (number | undefined)[] {
	const result: (number | undefined)[] = [];
	const nonNullTimes: number[] = [];

	for (let i = 0; i < solves.length; i++) {
		const currentTime = getEffectiveTime(solves[i]);

		// Add current time to our running list if it's not undefined
		if (currentTime !== undefined) {
			nonNullTimes.push(currentTime);
		}

		// Check if we have enough non-null times for Ao12
		if (nonNullTimes.length < 12) {
			result.push(undefined);
		} else {
			// Get last 12 non-null times
			const last12 = nonNullTimes.slice(-12);
			// Sort to easily remove best and worst
			const sorted = [...last12].sort((a, b) => a - b);
			// Remove best (first) and worst (last)
			const middle10 = sorted.slice(1, 11);
			// Average remaining 10
			const sum = middle10.reduce((a, b) => a + b, 0);
			const average = sum / 10;
			result.push(Math.round(average));
		}
	}

	return result;
}
