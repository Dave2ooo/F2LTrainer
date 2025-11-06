<script lang="ts">
	import Toast from './Toast.svelte';
	import {
		toastState,
		removeToast,
		addToast,
		DEFAULT_TOAST_DURATION
	} from '$lib/toastState.svelte';
	import { casesState, TrainStateLabels, getCaseName } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { GROUP_IDS } from '$lib/types/group';
	import { browser } from '$app/environment';

	// Track previous trainState values to detect changes
	const previousTrainStates = $state(new Map<string, string>());

	// Watch for trainState changes using $effect
	if (browser) {
		$effect(() => {
			for (const groupId of GROUP_IDS) {
				for (const [caseIdStr, caseState] of Object.entries(casesState[groupId])) {
					const key = `${groupId}-${caseIdStr}`;
					const currentState = caseState.trainState;
					const previousState = previousTrainStates.get(key);

					// Initialize tracking on first run
					if (previousState === undefined) {
						previousTrainStates.set(key, currentState);
						continue;
					}

					// If state changed, show a toast
					if (previousState !== currentState) {
						const caseId = Number(caseIdStr);
						const staticData = casesStatic[groupId]?.[caseId];

						// Check if staticData exists before using it
						if (staticData) {
							const caseName = getCaseName(staticData);
							const stateLabel = TrainStateLabels[currentState];
							const message = `${caseName} → ${stateLabel}`;

							addToast(message, 'success', DEFAULT_TOAST_DURATION);

							// Update tracking
							previousTrainStates.set(key, currentState);
						}
					}
				}
			}
		});
	}
</script>

<div class="toast-container fixed right-4 bottom-4 z-50 flex flex-col gap-2">
	{#each toastState.notifications as toast (toast.id)}
		<Toast
			message={toast.message}
			type={toast.type}
			duration={toast.duration}
			onClose={() => removeToast(toast.id)}
		/>
	{/each}
</div>
