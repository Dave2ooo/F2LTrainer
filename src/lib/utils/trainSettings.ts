import type { TrainSettings } from '$lib/types/TrainSettings';
import type { TrainState } from '$lib/types/caseState';
import type { GroupId } from '$lib/types/group';
import { globalState } from '$lib/globalState.svelte';
import { casesState } from '$lib/casesState.svelte';
import { GROUP_IDS } from '$lib/types/group';

class TrainSettingsManager {
	savedTrainSettings: TrainSettings | null = null;

	constructor() {
		this.savedTrainSettings = null;
	}

	getTrainSettings(): TrainSettings {
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
			trainGroupSelection: { ...globalState.trainGroupSelection },
			trainSideSelection: { ...globalState.trainSideSelection },
			crossColor: globalState.crossColor,
			frontColor: globalState.frontColor,
			trainState
		};
	}

	public saveTrainSettings() {
		this.savedTrainSettings = this.getTrainSettings();
	}

	public areTrainSettingsUnchanged(): boolean {
		if (!this.savedTrainSettings) return false;
		return JSON.stringify(this.savedTrainSettings) === JSON.stringify(this.getTrainSettings());
	}
}

export const trainSettingsManager = new TrainSettingsManager();
