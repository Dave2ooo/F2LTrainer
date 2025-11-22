<script lang="ts">
	import { Modal, Badge } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { statistics } from '$lib/statisticsState.svelte';
	import { calculateBestTime, calculateAo5, formatTime } from '$lib/utils/statistics';
	import { globalState } from '$lib/globalState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import { type CaseId, type GroupId, GROUP_DEFINITIONS } from '$lib/types/group';
	import { casesState } from '$lib/casesState.svelte';
	import Close from './Buttons/Close.svelte';

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	function onClose() {
		open = false;
	}

	function removeTime(index: number) {
		// times is reversed for display, so we need to calculate the original index
		const originalIndex = times.length - 1 - index;
		statistics[groupId][caseId].times.splice(originalIndex, 1);
		// Also decrement solves count if it tracks total solves separately
		if (statistics[groupId][caseId].solves > 0) {
			statistics[groupId][caseId].solves--;
		}
	}

	const caseStats = $derived(statistics[groupId][caseId]);
	const times = $derived(caseStats.times);
	const bestTime = $derived(calculateBestTime(times));
	const ao5 = $derived(calculateAo5(times));
	// const solves = $derived(caseStats.solves);
	const solves = $derived(caseStats.times.length);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

	const caseState = casesState[groupId][caseId];
	const title = GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId;
</script>

<Modal bind:open {title} size="sm" outsideclose={true} autoclose={false}>
	<div class="flex flex-col items-center gap-4">
		<TwistyPlayer
			{groupId}
			{caseId}
			algorithmSelection={caseState.algorithmSelection}
			customAlgorithm={caseState.customAlgorithm}
			side="right"
			{crossColor}
			{frontColor}
			controlPanel="bottom-row"
			experimentalDragInput="auto"
			class="size-50 md:size-70"
		/>

		<div class="grid grid-cols-3 gap-4 text-center w-full">
			<div class="flex flex-col">
				<span class="text-sm text-gray-500 dark:text-gray-400">Solves</span>
				<span class="text-xl font-bold">{solves}</span>
			</div>
			<div class="flex flex-col">
				<span class="text-sm text-gray-500 dark:text-gray-400">Best</span>
				<span class="text-xl font-bold">{formatTime(bestTime)}</span>
			</div>
			<div class="flex flex-col">
				<span class="text-sm text-gray-500 dark:text-gray-400">Ao5</span>
				<span class="text-xl font-bold">{formatTime(ao5)}</span>
			</div>
		</div>

		{#if times.length > 0}
			<div class="w-full">
				<h4 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">History</h4>
				<div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
					{#each times.slice().reverse() as time, index}
						<Badge
							class="text-sm"
							border
							dismissable
							onclose={(e: any) => {
								e?.preventDefault?.();
								removeTime(index);
							}}>{formatTime(time)}</Badge
						>
					{/each}
				</div>
			</div>
		{/if}

		<Close {onClose} />
	</div>
</Modal>
