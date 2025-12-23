<script lang="ts">
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { casesState } from '$lib/casesState.svelte';
	import { GROUP_DEFINITIONS } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';

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

	let solveCount = $derived(
		currentTrainCase
			? statisticsState.statistics.filter(
					(s) =>
						s.groupId === currentTrainCase!.groupId &&
						s.caseId === currentTrainCase!.caseId &&
						s.side === currentTrainCase!.side
				).length
			: 0
	);
</script>

{#if currentTrainCase && caseState}
	<div class="mt-4 flex flex-col items-center gap-2 text-center">
		<button
			type="button"
			class="text-sm text-theme-text-secondary underline hover:text-gray-900 dark:hover:text-white"
			onclick={() => (globalState.showDetails = !globalState.showDetails)}
		>
			{globalState.showDetails ? 'Hide Details' : 'Show Details'}
		</button>

		{#if globalState.showDetails}
			<p class="text-sm text-theme-text-secondary">
				{groupName}, Case {currentTrainCase.caseId}, Scramble {currentTrainCase.scramble}, AUF {aufText},
				{trainStateText}, Algorithm {algorithmIndex}, {sideText} Slot, Solve Counter: {solveCount}
			</p>
		{/if}
	</div>
{/if}
