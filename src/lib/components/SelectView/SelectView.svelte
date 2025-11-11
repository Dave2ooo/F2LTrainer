<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import GroupComponent from '$lib/components/SelectView/GroupComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';

	let selectedGroup: GroupId = $state(globalState.selectedGroup);

	$effect(() => {
		globalState.selectedGroup = selectedGroup;
	});
</script>

<Tabs
	bind:selected={selectedGroup}
	tabStyle="underline"
	classes={{
		content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4'
	}}
	class="tabs-header"
>
	{#each GROUP_IDS as groupId}
		<TabItem key={groupId}>
			{#snippet titleSlot()}
				<span class="tab-heading">{GROUP_DEFINITIONS[groupId].name}</span>
			{/snippet}
			<GroupComponent {groupId} />
		</TabItem>
	{/each}
</Tabs>

<style>
	/* Increase font size for tab headings */
	.tab-heading {
		font-size: 1.5rem;
		font-weight: bold;
	}
</style>
