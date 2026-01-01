import type { GlobalState } from '$lib/types/globalState';
import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from './types/group';
import { loadFromLocalStorage } from './utils/localStorage';
import { sessionState, DEFAULT_SETTINGS } from './sessionState.svelte';

export const GLOBAL_STATE_STORAGE_KEY = 'globalState';

// Helper to create collapsed categories (UI state)
const createCollapsedCategories = (): Record<GroupId, boolean[]> =>
	Object.fromEntries(
		GROUP_IDS.map((groupId) => [groupId, GROUP_DEFINITIONS[groupId].categories.map(() => true)])
	) as Record<GroupId, boolean[]>;

// Load only EPHEMERAL/GLOBAL UI state from local storage.
// We no longer load settings from here, as they come from sessionState.
interface EphemeralState {
	view: 'select' | 'train';
	categoriesOpenedObj: Record<GroupId, boolean[]>;
	selectedGroup: GroupId;
	playOnAlgChange: boolean;
	showDetails: boolean;
	hasUsedTimer: boolean;
	hasUsedTwistyPlayer: boolean;
	hasClickedCaseCard: boolean;
	trainHideTwistyPlayer: boolean;
	rightPaneOpen: boolean;
}

const defaultEphemeralState: EphemeralState = {
	view: 'select',
	categoriesOpenedObj: createCollapsedCategories(),
	selectedGroup: 'basic',
	playOnAlgChange: true,
	showDetails: false,
	trainHideTwistyPlayer: false,
	hasUsedTimer: false,
	hasUsedTwistyPlayer: false,
	hasClickedCaseCard: false,
	rightPaneOpen: true
};

const persistedEphemeralState =
	loadFromLocalStorage<Partial<EphemeralState>>(GLOBAL_STATE_STORAGE_KEY);

// Initialize ephemeral state
const ephemeralState = $state<EphemeralState>({
	...defaultEphemeralState,
	...(persistedEphemeralState || {})
});

// Create a proxy object that implements GlobalState interface
// It redirects settings access to sessionState.activeSession.settings
// and keeps UI state local.
export const globalState: GlobalState = {
	// Proxy Properties (Read/Write from Active Session)
	get trainHintAlgorithm() {
		return (
			sessionState.activeSession?.settings.trainHintAlgorithm ?? DEFAULT_SETTINGS.trainHintAlgorithm
		);
	},
	set trainHintAlgorithm(v) {
		if (sessionState.activeSession) sessionState.activeSession.settings.trainHintAlgorithm = v;
	},

	// Ephemeral/Global UI Properties (Read/Write from local state)
	get view() {
		return ephemeralState.view;
	},
	set view(v) {
		ephemeralState.view = v;
	},

	get categoriesOpenedObj() {
		return ephemeralState.categoriesOpenedObj;
	},
	set categoriesOpenedObj(v) {
		ephemeralState.categoriesOpenedObj = v;
	},

	get selectedGroup() {
		return ephemeralState.selectedGroup;
	},
	set selectedGroup(v) {
		ephemeralState.selectedGroup = v;
	},

	get playOnAlgChange() {
		return ephemeralState.playOnAlgChange;
	},
	set playOnAlgChange(v) {
		ephemeralState.playOnAlgChange = v;
	},

	get showDetails() {
		return ephemeralState.showDetails;
	},
	set showDetails(v) {
		ephemeralState.showDetails = v;
	},

	get trainHideTwistyPlayer() {
		return ephemeralState.trainHideTwistyPlayer;
	},
	set trainHideTwistyPlayer(v) {
		ephemeralState.trainHideTwistyPlayer = v;
	},

	get hasUsedTimer() {
		return ephemeralState.hasUsedTimer;
	},
	set hasUsedTimer(v) {
		ephemeralState.hasUsedTimer = v;
	},

	get hasUsedTwistyPlayer() {
		return ephemeralState.hasUsedTwistyPlayer;
	},
	set hasUsedTwistyPlayer(v) {
		ephemeralState.hasUsedTwistyPlayer = v;
	},

	get hasClickedCaseCard() {
		return ephemeralState.hasClickedCaseCard;
	},
	set hasClickedCaseCard(v) {
		ephemeralState.hasClickedCaseCard = v;
	},

	get rightPaneOpen() {
		return ephemeralState.rightPaneOpen;
	},
	set rightPaneOpen(v) {
		ephemeralState.rightPaneOpen = v;
	}
};
