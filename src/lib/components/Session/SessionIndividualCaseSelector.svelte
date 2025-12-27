<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import SessionGroupComponent from '$lib/components/Session/SessionGroupComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import type { StickerColor } from '$lib/types/stickering';
	import { casesStatic } from '$lib/casesStatic';

	let {
		crossColor,
		frontColor,
		selectedCases = $bindable()
	}: {
		crossColor: StickerColor;
		frontColor: StickerColor;
		selectedCases: Record<string, boolean>;
	} = $props();

	let selectedGroup: GroupId = $state('basic');

	// Calculate selected and total cases per group
	function getGroupCaseCounts(groupId: GroupId) {
		const caseIds = Object.keys(casesStatic[groupId]);
		const totalCases = caseIds.length;
		const selectedCount = caseIds.filter((caseId) => selectedCases[`${groupId}-${caseId}`]).length;
		return { selected: selectedCount, total: totalCases };
	}
</script>

<Tabs
	bind:selected={selectedGroup}
	tabStyle="underline"
	classes={{
		content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-0'
	}}
>
	{#each GROUP_IDS as groupId}
		{@const counts = getGroupCaseCounts(groupId)}
		<TabItem key={groupId}>
			{#snippet titleSlot()}
				<span class="text-sm font-semibold">
					{GROUP_DEFINITIONS[groupId].name}
					<span class="ml-1 text-xs text-gray-500 dark:text-gray-400">
						({counts.selected}/{counts.total})
					</span>
				</span>
			{/snippet}
			<SessionGroupComponent {groupId} {crossColor} {frontColor} bind:selectedCases />
		</TabItem>
	{/each}
</Tabs>
