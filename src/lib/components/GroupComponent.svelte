<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import { GROUP_SCRAMBLES, GROUP_ALGORITHMS } from '$lib/data';
	import CategoryComponent from '$lib/components/CategoryComponent.svelte';
	import { Accordion, AccordionItem } from 'flowbite-svelte';

	let {
		groupId
	}: {
		groupId: GroupId;
	} = $props();

	const groupDefinition = GROUP_DEFINITIONS[groupId];
	const categories = groupDefinition.categories;
</script>

<Accordion multiple>
	{#each categories as category, categoryIndex}
		<AccordionItem open>
			{#snippet header()}
				{category.name}
			{/snippet}
			<CategoryComponent {groupId} {categoryIndex} />
		</AccordionItem>
	{/each}
</Accordion>
