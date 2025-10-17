<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import { GROUP_SCRAMBLES, GROUP_ALGORITHMS } from '$lib/data';
	import CaseCard from '$lib/components/CaseCard.svelte';

	let {
		groupId,
		categoryIndex
	}: {
		groupId: GroupId;
		categoryIndex: number;
	} = $props();

	const groupDefinition = GROUP_DEFINITIONS[groupId];
	const category = groupDefinition.categories[categoryIndex];
	const categoryCases = category.cases;
	const scrambleArray = GROUP_SCRAMBLES[groupId];
	const algorithmArray = GROUP_ALGORITHMS[groupId];
</script>

<div class="flex flex-wrap gap-2">
	{#each categoryCases as caseId}
		<CaseCard
			alg={algorithmArray[caseId][0]}
			setupAlg={scrambleArray[caseId][0]}
			stickering={undefined}
		/>
	{/each}
</div>
