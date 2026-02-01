<script lang="ts">
	import {
		casesState,
		TrainStateColors,
		TrainStateTextColors,
		TrainStateLabels,
		updateCaseState
	} from '$lib/casesState.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { Trash2 } from '@lucide/svelte';

	// Props
	let { onremove }: { onremove?: () => void } = $props();

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	let currentTrainCaseTrainState = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState
			: 'unlearned'
	);

	let canRemoveFromSession = $derived(
		sessionState.activeSession?.settings.caseMode === 'individual'
	);

	const triggerId = `train-state-dd-${Math.random().toString(36).slice(2)}`;
	let dropdownOpen = $state(false);

	function handleRemove() {
		if (currentTrainCase && sessionState.activeSession) {
			const key = `${currentTrainCase.groupId}-${currentTrainCase.caseId}`;
			// Remove from session settings
			if (sessionState.activeSession.settings.selectedCases) {
				// Svelte 5 state proxy should trigger updates
				delete sessionState.activeSession.settings.selectedCases[key];
				sessionState.save();
			}

			dropdownOpen = false;
			onremove?.();
		}
	}
</script>

{#if currentTrainCase}
	<div>
		<Button
			id={triggerId}
			class="text-left {currentTrainCaseTrainState === 'unlearned'
				? 'text-gray-900 dark:text-white'
				: ''}"
			style="background: {TrainStateColors[currentTrainCaseTrainState]}; {TrainStateTextColors[
				currentTrainCaseTrainState
			]
				? `color: ${TrainStateTextColors[currentTrainCaseTrainState]};`
				: ''} {currentTrainCaseTrainState === 'unlearned'
				? `box-shadow: inset 0 0 0 2px var(--color-theme-border);`
				: ''}"
			aria-haspopup="true"
			aria-label={TrainStateLabels[currentTrainCaseTrainState]}
			title={TrainStateLabels[currentTrainCaseTrainState]}
			type="button"
		>
			{TrainStateLabels[currentTrainCaseTrainState]}
			<ChevronDownOutline class="ms-2 inline h-5 w-5" />
		</Button>

		<Dropdown simple class="w-44" triggeredBy="#{triggerId}" bind:isOpen={dropdownOpen}>
			{#each TRAIN_STATES as trainState}
				<DropdownItem
					onclick={() => {
						updateCaseState(currentTrainCase.groupId, currentTrainCase.caseId, {
							trainState
						});
						dropdownOpen = false;
					}}
					class="w-full text-center {trainState === 'unlearned'
						? 'text-gray-900 dark:text-white'
						: ''}"
					style="background: {TrainStateColors[trainState]}; {TrainStateTextColors[trainState]
						? `color: ${TrainStateTextColors[trainState]};`
						: ''}"
				>
					{TrainStateLabels[trainState]}
				</DropdownItem>
			{/each}
			{#if canRemoveFromSession}
				<div class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
				<DropdownItem
					onclick={handleRemove}
					class="w-full text-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
				>
					<div class="flex items-center justify-center gap-2">
						<Trash2 size={16} />
						<span>Remove</span>
					</div>
				</DropdownItem>
			{/if}
		</Dropdown>
	</div>
{/if}
