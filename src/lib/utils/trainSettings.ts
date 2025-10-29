import type { TrainSettings } from '$lib/types/TrainSettings';
import type { TrainState } from '$lib/types/caseState';
import type { GroupId } from '$lib/types/group';
import { globalState } from '$lib/globalState.svelte';
import { casesState } from '$lib/casesState.svelte';
import { GROUP_IDS } from '$lib/types/group';

let savedTrainSettings: TrainSettings | null = null;

function getTrainSettings(): TrainSettings {
	// Create a mapping of case IDs to their train states for each group
	const trainState: Record<GroupId, Record<number, TrainState>> = {} as Record<
		GroupId,
		Record<number, TrainState>
	>;

	for (const groupId of GROUP_IDS) {
		trainState[groupId] = {};
		for (const [caseId, caseState] of Object.entries(casesState[groupId])) {
			trainState[groupId][Number(caseId)] = caseState.trainState;
		}
	}

	return {
		trainStateSelection: { ...globalState.trainStateSelection },
		trainGroupSelection: { ...globalState.trainStateSelection },
		trainSideSelection: { ...globalState.trainStateSelection },
		trainState
	};
}

export function saveTrainSettings() {
	savedTrainSettings = getTrainSettings();
}

export function areTrainSettingsUnchanged(): boolean {
	if (!savedTrainSettings) return false;
	return JSON.stringify(savedTrainSettings) === JSON.stringify(getTrainSettings());
}
