<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import SessionGroupComponent from '$lib/components/Session/SessionGroupComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import type { StickerColor } from '$lib/types/stickering';

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
</script>

<Tabs
	bind:selected={selectedGroup}
	tabStyle="underline"
	classes={{
		content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-2'
	}}
>
	{#each GROUP_IDS as groupId}
		<TabItem key={groupId}>
			{#snippet titleSlot()}
				<span class="text-sm font-semibold">{GROUP_DEFINITIONS[groupId].name}</span>
			{/snippet}
			<SessionGroupComponent
				{groupId}
				{crossColor}
				{frontColor}
				bind:selectedCases
			/>
		</TabItem>
	{/each}
</Tabs>
