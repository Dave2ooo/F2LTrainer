<script lang="ts">
	import type { GroupId, CaseId } from '$lib/types/group';
	import type { TrainState } from '$lib/types/caseState';
	import { casesState, TrainStateColors } from '$lib/casesState.svelte';

	let {
		groupId,
		categoryCases
	}: {
		groupId: GroupId;
		categoryCases: readonly CaseId[];
	} = $props();

	function setCategoryState(state: TrainState) {
		for (const caseId of categoryCases) {
			casesState[groupId][caseId].trainState = state;
		}
	}

	function getCategoryStateCounts() {
		let unlearnedCount = 0;
		let learningCount = 0;
		let finishedCount = 0;

		for (const caseId of categoryCases) {
			const state = casesState[groupId][caseId].trainState;
			if (state === 'unlearned') unlearnedCount++;
			else if (state === 'learning') learningCount++;
			else if (state === 'finished') finishedCount++;
		}

		return { unlearnedCount, learningCount, finishedCount };
	}

	const counts = $derived(getCategoryStateCounts());
	const totalCases = categoryCases.length;
	const allUnlearned = $derived(counts.unlearnedCount === totalCases);
	const allLearning = $derived(counts.learningCount === totalCases);
	const allFinished = $derived(counts.finishedCount === totalCases);
</script>

<div class="flex gap-1">
	<button
		type="button"
		class="border border-gray-300 dark:border-gray-600"
		class:w-6={!allUnlearned}
		class:h-6={!allUnlearned}
		class:w-8={allUnlearned}
		class:h-8={allUnlearned}
		style="background-color: {TrainStateColors.unlearned}"
		onclick={() => setCategoryState('unlearned')}
		aria-label="Set all cases to unlearned"
	></button>
	<button
		type="button"
		class="border border-gray-300 dark:border-gray-600"
		class:w-6={!allLearning}
		class:h-6={!allLearning}
		class:w-8={allLearning}
		class:h-8={allLearning}
		style="background-color: {TrainStateColors.learning}"
		onclick={() => setCategoryState('learning')}
		aria-label="Set all cases to learning"
	></button>
	<button
		type="button"
		class="border border-gray-300 dark:border-gray-600"
		class:w-6={!allFinished}
		class:h-6={!allFinished}
		class:w-8={allFinished}
		class:h-8={allFinished}
		style="background-color: {TrainStateColors.finished}"
		onclick={() => setCategoryState('finished')}
		aria-label="Set all cases to finished"
	></button>
</div>
