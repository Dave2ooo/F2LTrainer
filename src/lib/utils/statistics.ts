import type { TimeEntry } from '$lib/types/statisticsState';

export function calculateBestTime(times: TimeEntry[]): number | null {
	if (times.length === 0) return null;
	return Math.min(...times.map((t) => t.time));
}

export function calculateAo5(times: TimeEntry[]): number | null {
	if (times.length < 5) return null;

	const last5 = times.slice(-5).map((t) => t.time);
	// Sort to easily remove best and worst
	const sorted = [...last5].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle3 = sorted.slice(1, 4);
	// Average remaining 3
	const sum = middle3.reduce((a, b) => a + b, 0);
	return sum / 3;
}

export function calculateAo12(times: TimeEntry[]): number | null {
	if (times.length < 12) return null;

	const last12 = times.slice(-12).map((t) => t.time);
	// Sort to easily remove best and worst
	const sorted = [...last12].sort((a, b) => a - b);
	// Remove best (first) and worst (last)
	const middle10 = sorted.slice(1, 11);
	// Average remaining 10
	const sum = middle10.reduce((a, b) => a + b, 0);
	return sum / 10;
}

export function formatTime(time: number | null): string {
	if (time === null) return '-';
	return time.toFixed(2);
}
