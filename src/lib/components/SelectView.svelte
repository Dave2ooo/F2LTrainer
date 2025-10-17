<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import GroupComponent from '$lib/components/GroupComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';

	const groupIds = Object.keys(GROUP_DEFINITIONS) as GroupId[];
</script>

<Tabs bind:selected={globalState.selectedGroup} tabStyle="underline">
	{#each groupIds as groupId (groupId)}
		<TabItem key={groupId} title={GROUP_DEFINITIONS[groupId].name}>
			<GroupComponent {groupId} />
		</TabItem>
	{/each}
</Tabs>
