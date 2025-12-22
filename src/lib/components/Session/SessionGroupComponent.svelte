<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import SessionCategoryComponent from '$lib/components/Session/SessionCategoryComponent.svelte';
	import { Accordion, AccordionItem } from '$lib/components/Accordion';
	import type { StickerColor } from '$lib/types/stickering';

	let {
		groupId,
		crossColor,
		frontColor,
		selectedCases = $bindable()
	}: {
		groupId: GroupId;
		crossColor: StickerColor;
		frontColor: StickerColor;
		selectedCases: Record<string, boolean>;
	} = $props();

	const groupDefinition = GROUP_DEFINITIONS[groupId];
	const categories = groupDefinition.categories;

	// Track which categories are open (all closed by default for compact view)
	let categoriesOpen = $state(categories.map(() => false));
</script>

<Accordion multiple>
	{#each categories as category, categoryIndex}
		<AccordionItem bind:open={categoriesOpen[categoryIndex]}>
			{#snippet header()}
				<div class="flex items-center gap-3">
					<span class="text-base font-semibold">{category.name}</span>
					<span class="text-sm text-gray-500 dark:text-gray-400">({category.cases.length} cases)</span>
				</div>
			{/snippet}
			<SessionCategoryComponent
				{groupId}
				{categoryIndex}
				{crossColor}
				{frontColor}
				bind:selectedCases
			/>
		</AccordionItem>
	{/each}
</Accordion>
