<script lang="ts">
	import { P } from 'flowbite-svelte';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { statistics } from '$lib/statisticsState.svelte';
	import { trainState, trainCaseQueue, jumpToSolve, jumpToFirstUnsolved } from '$lib/trainCaseQueue.svelte';
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import { formatTime } from '$lib/utils/statistics';
	import type { Solve } from '$lib/types/statisticsState';
	import CaseStatsModal from '../Modals/CaseStatsModal.svelte';
	import type { CaseId } from '$lib/types/group';
	
	// Store reference to the single shared modal
	let activeModal: CaseStatsModal | undefined = $state();
	// State for the currently active case in the modal
	let activeGroupId = $state<GroupId>('basic');
	let activeCaseId = $state<CaseId>(1);
	
	// Find the most recent unsolved case in the queue
	const mostRecentUnsolvedCase = $derived(() => {
		// Go through the queue from current index forward to find first unsolved
		for (let i = trainState.index; i < trainCaseQueue.length; i++) {
			if (trainCaseQueue[i].solveId === undefined) {
				return trainCaseQueue[i];
			}
		}
		return undefined;
	});
	
	// Create a unified list for animation purposes
	// Each item has a unique key and can be either unsolved or a solve
	type ListItem = {
		key: string;
		type: 'unsolved' | 'solved';
		solve?: Solve;
	};
	
	const listItems = $derived(() => {
		const items: ListItem[] = [];
		
		// Add unsolved case at the top if it exists
		if (mostRecentUnsolvedCase()) {
			items.push({
				key: 'unsolved',
				type: 'unsolved'
			});
		}
		
		// Add all solves in reverse chronological order
		const solves = [...statistics].reverse();
		for (const solve of solves) {
			items.push({
				key: `solve-${solve.id}`,
				type: 'solved',
				solve
			});
		}
		
		return items;
	});
	
	function getGroupDisplayName(groupId: GroupId): string {
		const def = GROUP_DEFINITIONS[groupId];
		return def ? def.editName : groupId;
	}
	
	function handleStatsClick(e: MouseEvent, groupId: GroupId, caseId: CaseId) {
		e.stopPropagation();
		// Update the active case for the modal
		activeGroupId = groupId;
		activeCaseId = caseId;
		
		// Open the modal
		if (activeModal) {
			activeModal.openModal();
		}
	}
</script>

<div class="flex h-full flex-col p-4">
	<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">All Solves</h3>
	
	<div class="flex-1 overflow-y-auto">
		{#if listItems().length === 0}
			<P class="text-gray-500">No solves recorded yet.</P>
		{:else}
			<ul class="space-y-2">
				{#each listItems() as item (item.key)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
					<li
						class="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800
						{item.type === 'unsolved'
							? trainState.current === mostRecentUnsolvedCase()
								? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
								: 'border-gray-200 dark:border-gray-700'
							: trainState.current?.solveId === item.solve?.id
								? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
								: 'border-gray-200 dark:border-gray-700'}"
						onclick={item.type === 'unsolved' ? jumpToFirstUnsolved : () => jumpToSolve(item.solve!.id)}
						role="button"
						tabindex="0"
						animate:flip={{ duration: 400 }}
						transition:slide={{ duration: 300 }}
					>
						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								{#if item.type === 'unsolved'}
									{@const unsolvedCase = mostRecentUnsolvedCase()!}
									<span class="font-medium text-gray-900 dark:text-white">
										{getGroupDisplayName(unsolvedCase.groupId)} #{unsolvedCase.caseId}
									</span>
								{:else}
									<span class="font-medium text-gray-900 dark:text-white">
										{getGroupDisplayName(item.solve!.groupId)} #{item.solve!.caseId}
									</span>
								{/if}
							</div>
							<div class="text-right">
								{#if item.type === 'unsolved'}
									{@const unsolvedCase = mostRecentUnsolvedCase()!}
									<span 
										role="button"
										tabindex="0"
										class="font-mono text-sm text-gray-400 dark:text-gray-500 cursor-pointer hover:underline hover:text-gray-600 dark:hover:text-gray-300"
										onclick={(e) => handleStatsClick(e, unsolvedCase.groupId, unsolvedCase.caseId)}
										onkeydown={(e) => e.key === 'Enter' && handleStatsClick(e as any, unsolvedCase.groupId, unsolvedCase.caseId)}
									>
										Unsolved
									</span>
								{:else}
									<span
										role="button"
										tabindex="0"
										class="font-mono text-sm cursor-pointer hover:underline {item.solve!.time !== null
											? 'text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200'
											: 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}"
										onclick={(e) => handleStatsClick(e, item.solve!.groupId, item.solve!.caseId)}
										onkeydown={(e) => e.key === 'Enter' && handleStatsClick(e as any, item.solve!.groupId, item.solve!.caseId)}
									>
										{formatTime(item.solve!.time)}
									</span>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<!-- Single shared modal for displaying statistics -->
<CaseStatsModal 
	bind:this={activeModal}
	groupId={activeGroupId}
	caseId={activeCaseId}
/>
