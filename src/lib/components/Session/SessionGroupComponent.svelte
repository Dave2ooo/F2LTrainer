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
		{@const selectedCount = category.cases.filter((id) => selectedCases[`${groupId}-${id}`]).length}
		{@const allSelected = selectedCount === category.cases.length}
		{@const noneSelected = selectedCount === 0}
		{@const isIndeterminate = !allSelected && !noneSelected}
		<AccordionItem bind:open={categoriesOpen[categoryIndex]}>
			{#snippet header()}
				<div class="flex items-center gap-3">
					<input
						type="checkbox"
						checked={allSelected}
						indeterminate={isIndeterminate}
						class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
						onclick={(e) => {
							e.stopPropagation();
							// Toggle all cases in this category
							const newValue = !allSelected;
							category.cases.forEach((caseId) => {
								selectedCases[`${groupId}-${caseId}`] = newValue;
							});
						}}
					/>
					<span class="text-base font-semibold">{category.name}</span>
					<span class="text-sm text-gray-500 dark:text-gray-400"
						>({selectedCount}/{category.cases.length})</span
					>
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
