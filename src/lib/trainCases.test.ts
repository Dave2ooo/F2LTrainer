import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gernerateTrainCases } from './trainCases';
import type { SessionSettings } from './types/session';

// Create a mutable settings object for tests
const createMockSettings = (): SessionSettings => ({
	caseMode: 'group',
	categorySelection: {} as any,
	trainGroupSelection: { basic: true, basicBack: false, advanced: false, expert: false },
	trainStateSelection: { unlearned: false, learning: true, finished: false },
	trainSideSelection: { right: true, left: false },
	selectedCases: {},
	frequencyMode: 'smart',
	smartFrequencySolved: false,
	smartFrequencyTime: false,
	trainMode: 'classic',
	trainAddAuf: false,
	trainShowTimer: false,
	trainHintAlgorithm: 'step',
	trainHintStickering: 'f2l',
	backView: 'none',
	backViewEnabled: false,
	crossColor: ['white'],
	frontColor: ['red'],
	smartCubeEnabled: false,
	drillTimeBetweenCases: 1000
});

let mockSettings = createMockSettings();

// Mock statistics array that can be mutated
const mockStatistics: any[] = [];

// Mock dependencies
vi.mock('./sessionState.svelte', () => {
	return {
		get sessionState() {
			return {
				activeSession: {
					get settings() {
						return mockSettings;
					}
				}
			};
		},
		get DEFAULT_SETTINGS() {
			return createMockSettings();
		}
	};
});

vi.mock('./statisticsState.svelte', () => ({
	get statisticsState() {
		return {
			statistics: mockStatistics
		};
	}
}));

vi.mock('./casesState.svelte', () => ({
	casesState: {
		basic: {
			1: { trainState: 'learning' },
			2: { trainState: 'learning' },
			3: { trainState: 'learning' }
		}
	},
	getCaseScramblePool: () => ["R U R'"]
}));

vi.mock('./casesStatic', () => ({
	casesStatic: {
		basic: {
			1: { pieceToHide: 'none', ignoreAUF: false },
			2: { pieceToHide: 'none', ignoreAUF: false },
			3: { pieceToHide: 'none', ignoreAUF: false }
		}
	}
}));

vi.mock('./types/group', () => ({
	GROUP_DEFINITIONS: {
		basic: { categories: [] }
	}
}));

describe('gernerateTrainCases', () => {
	beforeEach(() => {
		// Reset mock settings to defaults
		mockSettings = createMockSettings();
		// Clear statistics
		mockStatistics.length = 0;
	});

	it('should generate cases with equal frequency when smart frequency is disabled', () => {
		const result = gernerateTrainCases();
		// 3 cases selected, 1 side each -> 3 total
		expect(result.length).toBe(3);
		const counts = result.reduce(
			(acc, c) => {
				acc[c.caseId] = (acc[c.caseId] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		expect(counts[1]).toBe(1);
		expect(counts[2]).toBe(1);
		expect(counts[3]).toBe(1);
	});

	it('should prioritize less solved cases when smartFrequencySolved is enabled', () => {
		mockSettings.smartFrequencySolved = true;

		// Case 1: 14 solves (Deficit vs max 20 = 6 -> weight 1 + 6/3 = 3)
		// Case 2: 17 solves (Deficit vs max 20 = 3 -> weight 1 + 3/3 = 2)
		// Case 3: 20 solves (Deficit vs max 20 = 0 -> weight 1)

		// Mock statistics
		mockStatistics.push(
			...Array(14).fill({ groupId: 'basic', caseId: 1, side: 'right', time: 100 }),
			...Array(17).fill({ groupId: 'basic', caseId: 2, side: 'right', time: 100 }),
			...Array(20).fill({ groupId: 'basic', caseId: 3, side: 'right', time: 100 })
		);

		const result = gernerateTrainCases();

		const counts = result.reduce(
			(acc, c) => {
				acc[c.caseId] = (acc[c.caseId] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		expect(counts[1]).toBe(3); // Weight 3
		expect(counts[2]).toBe(2); // Weight 2
		expect(counts[3]).toBe(1); // Weight 1
	});

	it('should prioritize slower cases when smartFrequencyTime is enabled', () => {
		mockSettings.smartFrequencyTime = true;

		// Setup:
		// Case 1: 600 (Ao5)
		// Case 2: 400 (Ao5)
		// Case 3: 200 (Ao5)

		// Overall Average Calculation:
		// (600 + 400 + 200) / 3 = 400.

		// Weights:
		// Case 1 (600): Diff 600 - 400 = 200. 200/100 = 2. Weight 1 + 2 = 3.
		// Case 2 (400): Diff 400 - 400 = 0. Weight 1.
		// Case 3 (200): Diff 200 - 400 = -200. Weight 1.

		mockStatistics.push(
			{ groupId: 'basic', caseId: 1, side: 'right', time: 600 },
			{ groupId: 'basic', caseId: 2, side: 'right', time: 400 },
			{ groupId: 'basic', caseId: 3, side: 'right', time: 200 }
		);

		const result = gernerateTrainCases();

		const counts = result.reduce(
			(acc, c) => {
				acc[c.caseId] = (acc[c.caseId] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		expect(counts[1]).toBe(3);
		expect(counts[2]).toBe(1);
		expect(counts[3]).toBe(1);
	});
});
