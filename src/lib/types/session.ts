import type { GroupId } from './group';
import type { TrainState } from './caseState';
import type { Side } from './Side';
import type { View, HintAlgorithm, HintStickering } from './globalState';
import type { StickerColor } from './stickering';

export type CaseMode = 'group' | 'individual';
export type FrequencyMode = 'smart' | 'recap';
export type TrainMode = 'classic' | 'drill';

// Settings for a training session
export interface SessionSettings {
	// General
	caseMode: CaseMode;

	// Case Selection (Group Mode)
	categorySelection: Record<GroupId, boolean[]>; // Mirror logic from GlobalState but scoped
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<GroupId, boolean>;
	trainSideSelection: Record<Side, boolean>;

	// Case Selection (Individual Mode)
	selectedCases: Record<string, boolean>; // Key format: "groupId-caseId"

	// Frequency
	frequencyMode: FrequencyMode;
	smartFrequencySolved: boolean; // if frequencyMode === 'smart'
	smartFrequencyTime: boolean; // if frequencyMode === 'smart'
	trainMode: TrainMode;
	trainAddAuf: boolean;
	trainShowTimer: boolean;

	// Hints / Visuals
	trainHintAlgorithm: HintAlgorithm;
	trainHintStickering: HintStickering;
	backView: 'none' | 'floating';
	backViewEnabled: boolean; // Controls back-view attribute: true = "top-right", false = "none"
	crossColor: string[];
	frontColor: string[];

	// Smart Cube
	smartCubeEnabled: boolean;
	
	// Drill Mode
	drillTimeBetweenCases: number; // Seconds between cases in drill mode
}

export interface Session {
	id: string;
	name: string;
	settings: SessionSettings;
	createdAt: number;
	lastPlayedAt: number;
	lastModified: number;
	archived: boolean; // Soft deletion flag
	favorite?: boolean; // Pin to top of dropdown
}
