<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { getCaseName } from '$lib/casesState.svelte';
	import type { CaseId, GroupId } from '$lib/types/group';
	import type { StickerColor } from '$lib/types/stickering';

	let {
		groupId,
		caseId,
		crossColor,
		frontColor,
		selected = $bindable()
	}: {
		groupId: GroupId;
		caseId: CaseId;
		crossColor: StickerColor;
		frontColor: StickerColor;
		selected?: boolean;
	} = $props();

	let twistyPlayerRef: any;
	let scramble = $state('');
	let alg = $state('');

	const staticData = casesStatic[groupId][caseId];
	const side = 'right'; // Always use right side for simplicity

	let isSelected = $derived(selected ?? false);

	function toggleSelection() {
		selected = !isSelected;
	}
</script>

<button
	type="button"
	onclick={toggleSelection}
	class="flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all hover:shadow-md
		{isSelected
		? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
		: 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'}"
>
	<!-- Case Name -->
	<span class="text-sm font-semibold {isSelected ? 'text-blue-700 dark:text-blue-300' : ''}">
		{getCaseName(staticData)}
	</span>

	<!-- TwistyPlayer -->
	<div class="size-20">
		<TwistyPlayer
			bind:this={twistyPlayerRef}
			bind:scramble
			bind:alg
			{groupId}
			{caseId}
			algorithmSelection={undefined}
			{side}
			{crossColor}
			{frontColor}
			controlPanel="none"
			class="size-full"
			logNormalizedPattern={false}
		/>
	</div>
</button>
