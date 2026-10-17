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

	let viewModes = [
		{ value: 'standard', name: 'Standard' },
		{ value: 'paired', name: 'Paired EO' }
	];

	const isDev = new URLSearchParams(window.location.search).has('dev');
	if (!isDev) globalState.selectViewMode = 'standard';
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

			<div class="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
				<Button
					color="alternative"
					class="flex-1 gap-2 shadow-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
					onclick={() => (isFilterOpen = !isFilterOpen)}
				>
					<Funnel size={16} />
					{isFilterOpen ? 'Hide Filter' : 'Filter Cases'}
				</Button>
				{#if isDev}
					<select
						bind:value={globalState.selectViewMode}
						class="appearance-auto bg-none block rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					>
						{#each viewModes as mode}
							<option value={mode.value}>{mode.name}</option>
						{/each}
					</select>
				{/if}
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
