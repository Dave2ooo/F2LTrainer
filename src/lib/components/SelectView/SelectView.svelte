<script lang="ts">
	import { Tabs, TabItem, Button } from 'flowbite-svelte';
	import GroupComponent from '$lib/components/SelectView/GroupComponent.svelte';
	import FilterComponent from '$lib/components/SelectView/FilterComponent.svelte';
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import { globalState } from '$lib/globalState.svelte';
	import { Funnel } from '@lucide/svelte';

	let selectedTab = $state(globalState.selectedGroup);
	let isFilterOpen = $state(false);
	let previousTab = globalState.selectedGroup;

	$effect(() => {
		globalState.selectedGroup = selectedTab as GroupId;
		if (selectedTab !== previousTab) {
			isFilterOpen = false;
			previousTab = selectedTab;
		}
	});
</script>

<Tabs
	bind:selected={selectedTab}
	tabStyle="underline"
	class="items-end flex-wrap wrap-tabs"
	classes={{
		content: 'p-0 bg-gray-50 rounded-lg dark:bg-gray-800 mt-0'
	}}
>
	{#each GROUP_IDS as groupId}
		<TabItem key={groupId}>
			{#snippet titleSlot()}
				{@const [word1, word2] = GROUP_DEFINITIONS[groupId].name.split(' ')}
				<span class="tab-text-container text-base font-bold md:text-lg text-center leading-tight">
					<span>{word1}</span>
					<span>{word2}</span>
				</span>
			{/snippet}

			<div class="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
				<Button
					color="alternative"
					class="w-full gap-2 shadow-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
					onclick={() => (isFilterOpen = !isFilterOpen)}
				>
					<Funnel size={16} />
					{isFilterOpen ? 'Hide Filter' : 'Filter Cases'}
				</Button>
			</div>

			{#if isFilterOpen}
				<FilterComponent
					onJumpToGroup={(gId: GroupId) => {
						selectedTab = gId;
						isFilterOpen = false;
					}}
				/>
			{:else}
				<GroupComponent {groupId} />
			{/if}
		</TabItem>
	{/each}
</Tabs>

<style>
	.tab-text-container {
		display: flex;
		flex-direction: row;
		gap: 0.25rem;
		align-items: center;
		justify-content: center;
	}
	@media (max-width: 550px) {
		:global(.wrap-tabs > li) {
			flex: 1 1 0%;
			min-width: min-content;
		}
		:global(.wrap-tabs > li > button) {
			width: 100%;
			justify-content: center;
			text-align: center;
		}
		.tab-text-container {
			flex-direction: column;
			gap: 0;
		}
	}
</style>
