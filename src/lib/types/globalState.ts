import type { GroupId } from './group';

export type View = 'select' | 'train';

export type HintAlgorithm = 'step' | 'allAtOnce' | 'always' | 'hidden';
export type HintStickering = 'f2l' | 'fully' | 'centers-only';

export type SessionSettingsTab = 'selection' | 'training' | 'appearance';

export interface GlobalState {
	categoriesOpenedObj: Record<GroupId, boolean[]>;
	view: View;
	selectedGroup: GroupId;
	playOnAlgChange: boolean;
	showDetails: boolean;
	trainHideTwistyPlayer: boolean;
	hasUsedTimer: boolean;
	hasUsedTwistyPlayer: boolean;
	hasClickedCaseCard: boolean;
	rightPaneOpen: boolean;
	cameraLatitude: number;
	cameraLongitude: number;
	isSyncing: boolean;
	eoOrientedColor: string;
	eoUnorientedColor: string;
	showAdvancedTraining: boolean;
	showAdvancedAppearance: boolean;
	sessionSettingsTab: SessionSettingsTab;
}
