<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import GroupComponent from '$lib/components/GroupComponent.svelte';
	import { createGroupState, GROUP_DEFINITIONS, GROUPS, type GroupId } from '$lib/types/group';

	const groupIds = Object.keys(GROUP_DEFINITIONS) as GroupId[];
</script>

<Tabs tabStyle="underline">
	{#each groupIds as groupId (groupId)}
		<TabItem title={GROUP_DEFINITIONS[groupId].name}>
			<GroupComponent {groupId} />
		</TabItem>
	{/each}
</Tabs>
