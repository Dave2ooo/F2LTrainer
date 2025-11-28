<script lang="ts">
	import { P } from 'flowbite-svelte';
	import { statistics } from '$lib/statisticsState.svelte';
	import { trainState, trainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	
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
	
	// Get all solves in reverse chronological order (most recent first)
	const allSolves = $derived(() => {
		return [...statistics].reverse();
	});
	
	function formatTime(timeSec: number | null): string {
		if (timeSec === null) return '-';
		return timeSec.toFixed(2);
	}
	
	function getGroupDisplayName(groupId: GroupId): string {
		const def = GROUP_DEFINITIONS[groupId];
		return def ? def.editName : groupId;
	}
</script>

<div class="flex h-full flex-col p-4">
	<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">All Solves</h3>
	
	<div class="flex-1 overflow-y-auto">
		{#if !mostRecentUnsolvedCase() && allSolves().length === 0}
			<P class="text-gray-500">No solves recorded yet.</P>
		{:else}
			<ul class="space-y-2">
				<!-- Show most recent unsolved case at the top -->
				{#if mostRecentUnsolvedCase()}
					<li class="rounded-lg border-2 border-primary-500 bg-primary-50 p-3 dark:border-primary-400 dark:bg-primary-900/20">
						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								<span class="font-medium text-gray-900 dark:text-white">
									{getGroupDisplayName(mostRecentUnsolvedCase()!.groupId)} #{mostRecentUnsolvedCase()!.caseId}
								</span>
							</div>
							<div class="text-right">
								<span class="font-mono text-sm text-gray-400 dark:text-gray-500">
									Unsolved
								</span>
							</div>
						</div>
					</li>
				{/if}
				
				<!-- Show all solved cases -->
				{#each allSolves() as solve}
					<li class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								<span class="font-medium text-gray-900 dark:text-white">
									{getGroupDisplayName(solve.groupId)} #{solve.caseId}
								</span>
							</div>
							<div class="text-right">
								<span class="font-mono text-sm {solve.time !== null ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}">
									{formatTime(solve.time)}
								</span>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
