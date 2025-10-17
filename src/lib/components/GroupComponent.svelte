<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import CategoryComponent from '$lib/components/CategoryComponent.svelte';
	import { Accordion, AccordionItem } from 'flowbite-svelte';
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
				{category.name}
			{/snippet}
			<CategoryComponent {groupId} {categoryIndex} />
		</AccordionItem>
	{/each}
</Accordion>
