<script lang="ts">
	import { casesState, TrainStateColors, TrainStateTextColors } from '$lib/casesState.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { Select } from 'flowbite-svelte';

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	let currentTrainCaseTrainState = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState
			: 'unlearned'
	);
</script>

{#if currentTrainCase}
	<Select
		bind:value={casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState}
		style="background: {TrainStateColors[currentTrainCaseTrainState]}; color: {TrainStateTextColors[
			currentTrainCaseTrainState
		]}"
		placeholder=""
	>
		{#each TRAIN_STATES as trainState}
			<option
				value={trainState}
				style="background: {TrainStateColors[trainState]}; color: {TrainStateTextColors[
					trainState
				]}">{trainState}</option
			>
		{/each}
	</Select>
{/if}
