import type { GroupId } from './group';
import type { TrainState } from './caseState';
import type { Side } from './Side';
import type { View, HintAlgorithm, HintStickering } from './globalState';
import type { StickerColor } from './stickering';

export type CaseMode = 'group' | 'individual';
export type FrequencyMode = 'smart' | 'recap';

export interface SessionSettings {
	// General
	caseMode: CaseMode;
	
	// Case Selection (Group Mode)
	categorySelection: Record<GroupId, boolean[]>; // Mirror logic from GlobalState but scoped
	trainStateSelection: Record<TrainState, boolean>;
	trainGroupSelection: Record<GroupId, boolean>;
	trainSideSelection: Record<Side, boolean>;
	
	// Case Selection (Individual Mode) - Future proofing, maybe just list of case IDs
	// selectedCases?: string[]; 

	// Frequency
	frequencyMode: FrequencyMode;
	smartFrequencySolved: boolean; // if frequencyMode === 'smart'
	smartFrequencyTime: boolean;   // if frequencyMode === 'smart'
	trainAddAuf: boolean;
	trainShowTimer: boolean;

	// Hints / Visuals
	trainHintAlgorithm: HintAlgorithm;
	trainHintStickering: HintStickering;
	backView: 'none' | 'floating';
	crossColor: string[];
	frontColor: string[];

	// Smart Cube
	smartCubeEnabled: boolean;
}

export interface Session {
	id: string;
	name: string;
	settings: SessionSettings;
	createdAt: number;
	lastPlayedAt: number;
	solveCount: number; // Cache for display
}
