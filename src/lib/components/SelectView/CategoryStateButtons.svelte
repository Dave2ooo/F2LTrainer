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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex items-center gap-1"
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => e.stopPropagation()}
>
	<button
		type="button"
		class="rounded border-3 border-theme-border md:border-4"
		class:size-5={!allUnlearned}
		class:size-7={allUnlearned}
		class:md:size-6={!allUnlearned}
		class:md:size-8={allUnlearned}
		style="background-color: {TrainStateColors.unlearned}"
		onclick={(e) => {
			e.stopPropagation();
			setCategoryState('unlearned');
		}}
		aria-label="Set all cases to unlearned"
	></button>
	<button
		type="button"
		class="rounded"
		class:size-5={!allLearning}
		class:size-7={allLearning}
		class:md:size-6={!allLearning}
		class:md:size-8={allLearning}
		style="background-color: {TrainStateColors.learning}"
		onclick={(e) => {
			e.stopPropagation();
			setCategoryState('learning');
		}}
		aria-label="Set all cases to learning"
	></button>
	<button
		type="button"
		class="rounded"
		class:size-5={!allFinished}
		class:size-7={allFinished}
		class:md:size-6={!allFinished}
		class:md:size-8={allFinished}
		style="background-color: {TrainStateColors.finished}"
		onclick={(e) => {
			e.stopPropagation();
			setCategoryState('finished');
		}}
		aria-label="Set all cases to finished"
	></button>
</div>
