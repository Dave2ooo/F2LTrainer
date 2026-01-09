import { describe, it, expect } from 'vitest';
import { calculateRollingAo5, calculateRollingAo12 } from './statistics';
import type { Solve } from '$lib/types/statisticsState';

describe('calculateRollingAo5', () => {
	it('should return null for first 4 solves', () => {
		const solves: Solve[] = [
			{
				id: '1',
				time: 500,
				groupId: 'basic',
				caseId: 1,
				timestamp: 1,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '2',
				time: 600,
				groupId: 'basic',
				caseId: 1,
				timestamp: 2,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '3',
				time: 700,
				groupId: 'basic',
				caseId: 1,
				timestamp: 3,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '4',
				time: 800,
				groupId: 'basic',
				caseId: 1,
				timestamp: 4,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			}
		];

		const result = calculateRollingAo5(solves);
		expect(result).toEqual([undefined, undefined, undefined, undefined]);
	});

	it('should calculate Ao5 starting from 5th solve', () => {
		const solves: Solve[] = [
			{
				id: '1',
				time: 500,
				groupId: 'basic',
				caseId: 1,
				timestamp: 1,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '2',
				time: 600,
				groupId: 'basic',
				caseId: 1,
				timestamp: 2,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '3',
				time: 700,
				groupId: 'basic',
				caseId: 1,
				timestamp: 3,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '4',
				time: 800,
				groupId: 'basic',
				caseId: 1,
				timestamp: 4,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '5',
				time: 900,
				groupId: 'basic',
				caseId: 1,
				timestamp: 5,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			}
		];

		const result = calculateRollingAo5(solves);
		// For 5 solves: 500, 600, 700, 800, 900
		// Remove min (500) and max (900): 600, 700, 800
		// Average: (600 + 700 + 800) / 3 = 700
		expect(result[4]).toBe(700);
	});

	it('should calculate rolling Ao5 for each solve after the 5th', () => {
		const solves: Solve[] = [
			{
				id: '1',
				time: 500,
				groupId: 'basic',
				caseId: 1,
				timestamp: 1,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '2',
				time: 600,
				groupId: 'basic',
				caseId: 1,
				timestamp: 2,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '3',
				time: 700,
				groupId: 'basic',
				caseId: 1,
				timestamp: 3,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '4',
				time: 800,
				groupId: 'basic',
				caseId: 1,
				timestamp: 4,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '5',
				time: 900,
				groupId: 'basic',
				caseId: 1,
				timestamp: 5,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '6',
				time: 550,
				groupId: 'basic',
				caseId: 1,
				timestamp: 6,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			}
		];

		const result = calculateRollingAo5(solves);
		// For 6th solve (last 5: 600, 700, 800, 900, 550)
		// Remove min (550) and max (900): 600, 700, 800
		// Average: (600 + 700 + 800) / 3 = 700
		expect(result[5]).toBe(700);
	});

	it('should skip undefined times when calculating', () => {
		const solves: Solve[] = [
			{
				id: '1',
				time: 500,
				groupId: 'basic',
				caseId: 1,
				timestamp: 1,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '2',
				// time is undefined (untimed solve)
				groupId: 'basic',
				caseId: 1,
				timestamp: 2,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '3',
				time: 600,
				groupId: 'basic',
				caseId: 1,
				timestamp: 3,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '4',
				time: 700,
				groupId: 'basic',
				caseId: 1,
				timestamp: 4,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '5',
				time: 800,
				groupId: 'basic',
				caseId: 1,
				timestamp: 5,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			},
			{
				id: '6',
				time: 900,
				groupId: 'basic',
				caseId: 1,
				timestamp: 6,
				auf: '' as const,
				side: 'right',
				scrambleSelection: 0
			}
		];

		const result = calculateRollingAo5(solves);
		// We have 6 solves total: 500, null, 600, 700, 800, 900
		// Non-null times accumulate: [500], [500], [500,600], [500,600,700], [500,600,700,800], [500,600,700,800,900]
		// At index 5 (6th solve), we have 5 non-null times
		// Last 5 non-null: 500, 600, 700, 800, 900
		// Remove min (500) and max (900): 600, 700, 800
		// Average: (600 + 700 + 800) / 3 = 700
		expect(result[5]).toBe(700);
	});
});

describe('calculateRollingAo12', () => {
	it('should return null for first 11 solves', () => {
		const solves: Solve[] = Array.from({ length: 11 }, (_, i) => ({
			id: String(i + 1),
			time: (i + 1) * 100,
			groupId: 'basic' as const,
			caseId: 1,
			timestamp: i + 1,
			auf: '' as const,
			side: 'right' as const,
			scrambleSelection: 0
		}));

		const result = calculateRollingAo12(solves);
		expect(result.every((v) => v === undefined)).toBe(true);
	});

	it('should calculate Ao12 starting from 12th solve', () => {
		const solves: Solve[] = Array.from({ length: 12 }, (_, i) => ({
			id: String(i + 1),
			time: (i + 1) * 100,
			groupId: 'basic' as const,
			caseId: 1,
			timestamp: i + 1,
			auf: '' as const,
			side: 'right' as const,
			scrambleSelection: 0
		}));
		// Times: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200
		// Remove min (100) and max (1200): 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100
		// Average: (200 + 300 + 400 + 500 + 600 + 700 + 800 + 900 + 1000 + 1100) / 10 = 6500 / 10 = 650

		const result = calculateRollingAo12(solves);
		expect(result[11]).toBe(650);
	});

	it('should calculate rolling Ao12 for each solve after the 12th', () => {
		const solves: Solve[] = Array.from({ length: 13 }, (_, i) => ({
			id: String(i + 1),
			time: (i + 1) * 100,
			groupId: 'basic' as const,
			caseId: 1,
			timestamp: i + 1,
			auf: '' as const,
			side: 'right' as const,
			scrambleSelection: 0
		}));

		const result = calculateRollingAo12(solves);
		// For 13th solve, last 12 are: 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300
		// Remove min (200) and max (1300): 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200
		// Average: (300 + 400 + 500 + 600 + 700 + 800 + 900 + 1000 + 1100 + 1200) / 10 = 7500 / 10 = 750
		expect(result[12]).toBe(750);
	});

	it('should skip undefined times when calculating', () => {
		const solves: Solve[] = [
			...Array.from({ length: 10 }, (_, i) => ({
				id: String(i + 1),
				time: (i + 1) * 100,
				groupId: 'basic' as const,
				caseId: 1,
				timestamp: i + 1,
				auf: '' as const,
				side: 'right' as const,
				scrambleSelection: 0
			})),
			{
				id: '11',
				// time is undefined (untimed solve)
				groupId: 'basic' as const,
				caseId: 1,
				timestamp: 11,
				auf: '' as const,
				side: 'right' as const,
				scrambleSelection: 0
			},
			{
				id: '12',
				time: 1100,
				groupId: 'basic' as const,
				caseId: 1,
				timestamp: 12,
				auf: '' as const,
				side: 'right' as const,
				scrambleSelection: 0
			},
			{
				id: '13',
				time: 1200,
				groupId: 'basic' as const,
				caseId: 1,
				timestamp: 13,
				auf: '' as const,
				side: 'right' as const,
				scrambleSelection: 0
			}
		];

		const result = calculateRollingAo12(solves);
		// We have 13 solves total with indices 0-12
		// Non-null times: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, null, 1100, 1200
		// At index 12 (13th solve), we have 12 non-null times
		// Last 12 non-null: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200
		// Remove min (100) and max (1200): 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100
		// Average: (200 + 300 + 400 + 500 + 600 + 700 + 800 + 900 + 1000 + 1100) / 10 = 6500 / 10 = 650
		expect(result[12]).toBe(650);
	});
});
