import { casesStatic } from './casesStatic';
import { loadFromLocalStorage } from './utils/localStorage';
import type { AlgorithmSelection, CaseState, CustomAlgorithm, TrainState } from './types/caseState';
import { GROUP_IDS, type CaseId, type GroupId } from './types/group';
import type { CaseStatic } from './types/casesStatic';
import type { Side } from '$lib/types/Side';
import { mirrorAlg } from './utils/mirrorAlg';

export const createCaseState = (): CaseState => ({
	trainState: 'unlearned',
	algorithmSelection: { left: 0, right: 0 },
	customAlgorithm: { left: '', right: '' },
	identicalAlgorithm: true
});

const createGroupCasesState = (groupId: GroupId): Record<CaseId, CaseState> => {
	const caseEntries = Object.keys(casesStatic[groupId]).map((caseIdString) => {
		const caseId = Number(caseIdString) as CaseId;
		const state = createCaseState();

		if (groupId === 'basic') {
			if (caseId === 3) {
				state.trainState = 'finished';
			} else if (caseId === 1 || caseId === 2) {
				state.trainState = 'learning';
			}
		}

		return [caseId, state];
	});

	return Object.fromEntries(caseEntries) as Record<CaseId, CaseState>;
};

const createDefaultCasesState = (): Record<GroupId, Record<CaseId, CaseState>> =>
	Object.fromEntries(
		GROUP_IDS.map((groupId) => [groupId, createGroupCasesState(groupId)])
	) as Record<GroupId, Record<CaseId, CaseState>>;

export const CASES_STATE_STORAGE_KEY = 'casesState';

type PersistedCasesState = Partial<Record<GroupId, Partial<Record<CaseId, Partial<CaseState>>>>>;

export const casesState: Record<GroupId, Record<CaseId, CaseState>> = $state(
	createDefaultCasesState()
);

const validateAlgorithmSelection = (
	selection: number | null,
	algPoolLength: number
): number | null => {
	if (selection === null) return null;
	if (typeof selection !== 'number') return 0;
	if (selection < 0) return 0;
	if (selection >= algPoolLength) return Math.max(0, algPoolLength - 1);
	return selection;
};

const persistedCasesState = loadFromLocalStorage<PersistedCasesState>(CASES_STATE_STORAGE_KEY);

if (persistedCasesState && typeof persistedCasesState === 'object') {
	for (const groupId of GROUP_IDS) {
		const persistedGroup = persistedCasesState[groupId];
		if (!persistedGroup || typeof persistedGroup !== 'object') {
			if (persistedGroup !== undefined) {
				console.warn(
					`[CasesState] Skipping invalid persisted group "${groupId}":`,
					persistedGroup
				);
			}
			continue;
		}

		for (const [caseIdString, caseState] of Object.entries(casesState[groupId])) {
			const caseId = Number(caseIdString) as CaseId;
			const persistedCase = persistedGroup[caseId];

			if (!persistedCase || typeof persistedCase !== 'object') {
				if (persistedCase !== undefined) {
					console.warn(
						`[CasesState] Skipping invalid persisted case "${groupId}/${caseId}":`,
						persistedCase
					);
				}
				continue;
			}

			// Validate algorithm selection indices before assigning
			const staticData = casesStatic[groupId][caseId];
			const algPoolLength = staticData?.algPool?.length ?? 0;

			if (
				persistedCase.algorithmSelection &&
				typeof persistedCase.algorithmSelection === 'object' &&
				algPoolLength > 0
			) {
				const validated: AlgorithmSelection = {
					left: validateAlgorithmSelection(persistedCase.algorithmSelection.left, algPoolLength),
					right: validateAlgorithmSelection(persistedCase.algorithmSelection.right, algPoolLength)
				};
				persistedCase.algorithmSelection = validated;
			}

			Object.assign(caseState, persistedCase);
		}
	}
}

export function getCaseAlg(
	staticData: CaseStatic,
	algorithmSelection: AlgorithmSelection,
	customAlgorithm: CustomAlgorithm,
	side: Side
): string {
	const algorithmSelectionSide = algorithmSelection[side];
	const customAlgorithmSide = customAlgorithm[side];

	if (algorithmSelectionSide === null) return customAlgorithmSide;

	const algorithmPool = staticData.algPool;

	let alg: string | undefined = undefined;
	if (
		typeof algorithmSelectionSide === 'number' &&
		algorithmSelectionSide >= 0 &&
		algorithmSelectionSide < algorithmPool.length
	) {
		alg = algorithmPool[algorithmSelectionSide];
	}
	if (!alg) {
		console.error(
			`Algorithm index out of bounds or missing: group/case=${staticData.caseId}, side=${side}, selection=${algorithmSelectionSide}, pool=`,
			algorithmPool
		);
		alg = algorithmPool[0] || '';
	}

	return side === 'left' ? mirrorAlg(alg) : alg;
}

export function getCaseScramble(staticData: CaseStatic, side: Side, scrambleSelection?: number) {
	const scramblePool = staticData.scramblePool;

	let scramble: string;

	if (scrambleSelection !== undefined) {
		scramble = scramblePool[scrambleSelection];
	} else {
		scramble = scramblePool[0];
	}

	return side === 'left' ? mirrorAlg(scramble) : scramble;
}

export function getCaseScramblePool(staticData: CaseStatic) {
	return staticData.scramblePool;
}

export function getCaseName(staticData: CaseStatic) {
	return staticData.caseName || staticData.caseId.toString();
}

export const TrainStateColors: Record<TrainState, string> = {
	unlearned: 'rgba(0, 0, 0, 0)',
	learning: 'rgb(236 236 0)',
	finished: 'rgb(0, 223, 0)'
};

export function getCaseBorderClass(trainState: TrainState): string {
	switch (trainState) {
		case 'unlearned':
			return 'border-theme-border';
		case 'learning':
			return 'border-black';
		case 'finished':
			return 'border-black';
	}
}

export function getCaseTextClass(trainState: TrainState): string {
	switch (trainState) {
		case 'unlearned':
			return 'text-theme-border';
		case 'learning':
			return 'text-black';
		case 'finished':
			return 'text-black';
	}
}

export const TrainStateTextColors: Record<TrainState, string> = {
	unlearned: '',
	learning: 'black',
	finished: 'black'
};

export const TrainStateLabels: Record<TrainState, string> = {
	unlearned: 'Unlearned',
	learning: 'Learning',
	finished: 'Finished'
};
