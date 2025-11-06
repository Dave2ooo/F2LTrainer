<script lang="ts">
	import Toast from './Toast.svelte';
	import { toastState, removeToast, addToast } from '$lib/toastState.svelte';
	import { casesState, TrainStateLabels, getCaseName } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { GROUP_IDS } from '$lib/types/group';
	import { browser } from '$app/environment';

	// Track previous trainState values to detect changes
	const previousTrainStates = $state(new Map<string, string>());

	// Initialize tracking with current states
	if (browser) {
		for (const groupId of GROUP_IDS) {
			for (const [caseIdStr, caseState] of Object.entries(casesState[groupId])) {
				const key = `${groupId}-${caseIdStr}`;
				previousTrainStates.set(key, caseState.trainState);
			}
		}
	}

	// Watch for trainState changes using $effect
	if (browser) {
		$effect(() => {
			for (const groupId of GROUP_IDS) {
				for (const [caseIdStr, caseState] of Object.entries(casesState[groupId])) {
					const key = `${groupId}-${caseIdStr}`;
					const currentState = caseState.trainState;
					const previousState = previousTrainStates.get(key);

					// If state changed, show a toast
					if (previousState !== undefined && previousState !== currentState) {
						const caseId = Number(caseIdStr);
						const staticData = casesStatic[groupId][caseId];
						const caseName = getCaseName(staticData);
						const stateLabel = TrainStateLabels[currentState];

						const message = `${caseName} → ${stateLabel}`;

						addToast(message, 'success', 3000);

						// Update tracking
						previousTrainStates.set(key, currentState);
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
