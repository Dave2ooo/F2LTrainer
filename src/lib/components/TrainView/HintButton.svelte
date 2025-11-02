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
			const algList = alg.split(' ').filter(move => move.trim() !== '');
			return algList.slice(0, hintCounter).join(' ');
		}
		return '';
	});

	let showPlaceholder = $derived(visible && hintCounter === -1 && hintMode !== 'always');
	let showAlgorithm = $derived(visible && displayedAlg !== '');
</script>

{#if visible}
	<button 
		type="button"
		onclick={onclick} 
		class="w-full cursor-pointer rounded border border-gray-300 bg-gray-50 p-4 text-center hover:bg-gray-100"
	>
		{#if showPlaceholder}
			<span class="text-gray-600">Press to show hint</span>
		{:else if showAlgorithm}
			<span class="font-mono">{displayedAlg}</span>
		{/if}
	</button>
{/if}
