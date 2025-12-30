<script lang="ts">
	import {
		casesState,
		TrainStateColors,
		TrainStateTextColors,
		TrainStateLabels
	} from '$lib/casesState.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	let currentTrainCaseTrainState = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState
			: 'unlearned'
	);

	const triggerId = `train-state-dd-${Math.random().toString(36).slice(2)}`;
	let dropdownOpen = $state(false);
</script>

{#if currentTrainCase}
	<div>
		<Button
			id={triggerId}
			class="text-left"
			style="background: {TrainStateColors[
				currentTrainCaseTrainState
			]}; color: {TrainStateTextColors[currentTrainCaseTrainState]}; {currentTrainCaseTrainState ===
			'unlearned'
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
						casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState = trainState;
						dropdownOpen = false;
					}}
					class="w-full text-center"
					style="background: {TrainStateColors[trainState]}; color: {TrainStateTextColors[
						trainState
					]};"
				>
					{TrainStateLabels[trainState]}
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>
{/if}
