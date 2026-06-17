<script lang="ts">
	import type { GroupId, CaseId } from '$lib/types/group';
	import type { TrainState } from '$lib/types/caseState';
	import { casesState, TrainStateColors, updateCaseState } from '$lib/casesState.svelte';
	import { Button } from 'flowbite-svelte';

	let {
		groupId,
		categoryCases
	}: {
		groupId: GroupId;
		categoryCases: readonly CaseId[];
	} = $props();

	function setCategoryState(state: TrainState) {
		for (const caseId of categoryCases) {
			updateCaseState(groupId, caseId, {
				trainState: state
			});
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
	<Button
		color={'none' as any}
		type="button"
		class="rounded border-3 border-theme-border p-0 focus:ring-2 md:border-4 {!allUnlearned
			? 'size-5 md:size-6'
			: 'size-7 md:size-8'}"
		style="background-color: {TrainStateColors.unlearned}"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			setCategoryState('unlearned');
		}}
		aria-label="Set all cases to unlearned"
	></Button>
	<Button
		color={'none' as any}
		type="button"
		class="rounded p-0 focus:ring-2 {!allLearning ? 'size-5 md:size-6' : 'size-7 md:size-8'}"
		style="background-color: {TrainStateColors.learning}"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			setCategoryState('learning');
		}}
		aria-label="Set all cases to learning"
	></Button>
	<Button
		color={'none' as any}
		type="button"
		class="rounded p-0 focus:ring-2 {!allFinished ? 'size-5 md:size-6' : 'size-7 md:size-8'}"
		style="background-color: {TrainStateColors.finished}"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			setCategoryState('finished');
		}}
		aria-label="Set all cases to finished"
	></Button>
</div>
