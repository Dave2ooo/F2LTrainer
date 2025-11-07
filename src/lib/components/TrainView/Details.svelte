<script lang="ts">
	import { P, Button } from 'flowbite-svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { casesState } from '$lib/casesState.svelte';
	import { GROUP_DEFINITIONS } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';

	let currentTrainCase = $derived(trainState.current);
	let caseState = $derived(
		currentTrainCase ? casesState[currentTrainCase.groupId][currentTrainCase.caseId] : undefined
	);
	let groupName = $derived(
		currentTrainCase ? GROUP_DEFINITIONS[currentTrainCase.groupId].name : ''
	);
	let algorithmIndex = $derived(
		currentTrainCase && caseState ? (caseState.algorithmSelection[currentTrainCase.side] ?? 0) : 0
	);
	let trainStateText = $derived(
		caseState ? caseState.trainState.charAt(0).toUpperCase() + caseState.trainState.slice(1) : ''
	);
	let sideText = $derived(
		currentTrainCase
			? currentTrainCase.side.charAt(0).toUpperCase() + currentTrainCase.side.slice(1)
			: ''
	);
	let aufText = $derived(currentTrainCase?.auf || '');
</script>

{#if currentTrainCase && caseState}
	<Button onclick={() => (globalState.showDetails = !globalState.showDetails)}>
		{globalState.showDetails ? 'Hide Details' : 'Show Details'}
	</Button>

	{#if globalState.showDetails}
		<P size="lg" weight="semibold">
			{groupName}, Case {currentTrainCase.caseId}, Scramble {currentTrainCase.scramble}, AUF {aufText},
			{trainStateText}, Algorithm {algorithmIndex}, {sideText} Slot, Solve Counter: {caseState.solveCount}
		</P>
	{/if}
{/if}
