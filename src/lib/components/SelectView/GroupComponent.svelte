<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import CategoryComponent from '$lib/components/SelectView/CategoryComponent.svelte';
	import CategoryStateButtons from '$lib/components/SelectView/CategoryStateButtons.svelte';
	import { Accordion, AccordionItem } from '$lib/components/Accordion';
	import { globalState } from '$lib/globalState.svelte';

	let {
		groupId
	}: {
		groupId: GroupId;
	} = $props();

	const groupDefinition = GROUP_DEFINITIONS[groupId];
	const categories = groupDefinition.categories;
	const categoriesOpenedArr = globalState.categoriesOpenedObj[groupId];
</script>

<Accordion multiple>
	{#each categories as category, categoryIndex}
		<AccordionItem bind:open={categoriesOpenedArr[categoryIndex]}>
			{#snippet header()}
				<div class="flex h-8 items-center gap-3">
					<span class="text-lg md:text-xl">{category.name}</span>
					<CategoryStateButtons {groupId} categoryCases={category.cases} />
				</div>
			{/snippet}
			<CategoryComponent {groupId} {categoryIndex} />
		</AccordionItem>
	{/each}
</Accordion>
