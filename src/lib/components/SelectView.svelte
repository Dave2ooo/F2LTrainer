<script lang="ts">
	import { Tabs, TabItem } from 'flowbite-svelte';
	import GroupComponent from '$lib/components/GroupComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';

	let selectedGroup: GroupId = globalState.selectedGroup;

	$effect(() => {
		if (globalState.selectedGroup !== selectedGroup) {
			selectedGroup = globalState.selectedGroup;
		}
	});

	$effect(() => {
		if (selectedGroup !== globalState.selectedGroup) {
			globalState.selectedGroup = selectedGroup;
		}
	});
</script>

<Tabs bind:selected={selectedGroup} tabStyle="underline">
	{#each GROUP_IDS as groupId}
		<TabItem key={groupId} title={GROUP_DEFINITIONS[groupId].name}>
			<GroupComponent {groupId} />
		</TabItem>
	{/each}
</Tabs>
