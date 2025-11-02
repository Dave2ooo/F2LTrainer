<script lang="ts">
	import type { HintAlgorithm } from '$lib/types/globalState';

	interface Props {
		alg: string;
		visible: boolean;
		hintCounter: number;
		hintMode: HintAlgorithm;
		onclick: () => void;
	}

	let { alg, visible, hintCounter, hintMode, onclick }: Props = $props();

	// Compute the displayed algorithm based on hint mode and counter
	let displayedAlg = $derived.by(() => {
		if (!visible) return '';

		if (hintMode === 'always') {
			// Always show the full algorithm
			return alg;
		} else if (hintCounter === -1) {
			// Not clicked yet - show placeholder
			return '';
		} else if (hintMode === 'allAtOnce') {
			// Show full algorithm after first click
			return alg;
		} else if (hintMode === 'step') {
			// Show step-by-step
			const algList = alg.split(' ').filter((move) => move.trim() !== '');
			return algList.slice(0, hintCounter).join(' ');
		}
		return '';
	});

	let showPlaceholder = $derived(visible && hintCounter === -1 && hintMode !== 'always');
	let showAlgorithm = $derived(visible && displayedAlg !== '');

	// Parse the algorithm into individual moves for consistent display
	let algMoves = $derived.by(() => {
		if (!showAlgorithm) return [];
		return displayedAlg.split(' ').filter((move) => move.trim() !== '');
	});
</script>

{#if visible}
	<div
		{onclick}
		role="button"
		tabindex="0"
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
		class="cursor-pointer rounded border border-gray-300 bg-white p-3 text-center shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	>
		{#if showPlaceholder}
			<span class="text-sm text-gray-500">Press to show hint</span>
		{:else if showAlgorithm}
			<div class="inline-flex flex-wrap items-center justify-center gap-1 font-mono text-base">
				{#each algMoves as move}
					<span class="rounded bg-gray-100 px-2 py-1 text-gray-800">{move}</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}
