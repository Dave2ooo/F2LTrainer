<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import CaseCard from '$lib/components/SelectView/CaseCard.svelte';
	import { globalState } from '$lib/globalState.svelte';

	let {
		groupId,
		categoryIndex
	}: {
		groupId: GroupId;
		categoryIndex: number;
	} = $props();

	const groupDefinition = $derived(GROUP_DEFINITIONS[groupId]);
	const category = $derived(
		globalState.selectViewMode === 'paired' && groupDefinition.pairedCategories
			? groupDefinition.pairedCategories[categoryIndex]
			: groupDefinition.categories[categoryIndex]
	);
	const categoryCases = $derived(category.cases);
</script>

<div class="flex flex-wrap gap-2">
	{#each categoryCases as caseOrPair}
		{#if Array.isArray(caseOrPair) || (typeof caseOrPair === 'object' && 'length' in caseOrPair)}
			<div
				class="flex flex-col sm:flex-row w-full sm:w-auto border-2 border-black dark:border-white p-0 rounded-2xl"
			>
				{#each caseOrPair as caseId, i}
					{#if i > 0}
						<div class="hidden sm:block w-px self-stretch bg-black dark:bg-white"></div>
						<div class="sm:hidden h-px self-stretch bg-black dark:bg-white"></div>
					{/if}
					<div id="case-{groupId}-{caseId}" class="w-full sm:w-auto case-wrapper">
						<CaseCard
							{groupId}
							{caseId}
							noBorder
							cornerClass={i === 0
								? 'rounded-t-[14px] rounded-b-none sm:rounded-l-[14px] sm:rounded-r-none'
								: 'rounded-t-none rounded-b-[14px] sm:rounded-l-none sm:rounded-r-[14px]'}
						/>
					</div>
				{/each}
			</div>
		{:else}
			<div id="case-{groupId}-{caseOrPair}" class="w-full sm:w-auto case-wrapper">
				<CaseCard {groupId} caseId={caseOrPair as number} />
			</div>
		{/if}
	{/each}
</div>
