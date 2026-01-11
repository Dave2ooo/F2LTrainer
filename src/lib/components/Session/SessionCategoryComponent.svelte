<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId, type CaseId } from '$lib/types/group';
	import SessionCaseCard from '$lib/components/Session/SessionCaseCard.svelte';
	import type { StickerColor } from '$lib/types/stickering';

	let {
		groupId,
		categoryIndex,
		crossColor,
		frontColor,
		selectedCases = $bindable()
	}: {
		groupId: GroupId;
		categoryIndex: number;
		crossColor: StickerColor;
		frontColor: StickerColor;
		selectedCases: Record<string, boolean>;
	} = $props();

	const groupDefinition = GROUP_DEFINITIONS[groupId];
	const category = groupDefinition.categories[categoryIndex];
	const categoryCases = category.cases;

	function getCaseKey(caseId: CaseId): string {
		return `${groupId}-${caseId}`;
	}
</script>

<div class="flex flex-wrap gap-1 p-0">
	{#each categoryCases as caseId}
		{@const caseKey = getCaseKey(caseId)}
		<SessionCaseCard
			{groupId}
			{caseId}
			{crossColor}
			{frontColor}
			bind:selected={selectedCases[caseKey]}
		/>
	{/each}
</div>
