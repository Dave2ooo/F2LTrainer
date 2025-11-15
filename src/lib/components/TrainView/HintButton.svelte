<script lang="ts">
	import type { HintAlgorithm } from '$lib/types/globalState';
	import { Pencil } from '@lucide/svelte';

	interface Props {
		alg: string;
		visible: boolean;
		hintCounter: number;
		hintMode: HintAlgorithm;
		onclick: () => void;
		onEditAlg: () => void;
		// element used by the TwistyAlgViewer (parent can bind to this)
		algViewerContainer?: HTMLElement;
		// whether to display the alg viewer element
		showAlgViewer?: boolean;
	}

	let {
		alg,
		visible,
		hintCounter,
		hintMode,
		onclick,
		onEditAlg,
		algViewerContainer = $bindable(),
		showAlgViewer
	}: Props = $props();

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

	const className =
		'min-w-48 cursor-pointer rounded border border-gray-300 bg-transparent p-3 text-center text-xl md:text-2xl shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary-700 focus:outline-none';

	// Show edit button when either algViewer or algorithm text is shown
	let showEditButton = $derived(showAlgViewer || showAlgorithm);
</script>

<!-- Container holds both the alg viewer element (used by TwistyAlgViewer) and the hint button UI -->
<div class="my-4 flex w-full flex-col items-center md:my-6">
	<div class="relative">
		<div
			bind:this={algViewerContainer}
			style:display={showAlgViewer ? 'block' : 'none'}
			{onclick}
			role="button"
			tabindex="0"
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
			class={className}
		></div>

		{#if visible}
			<div
				{onclick}
				role="button"
				tabindex="0"
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick()}
				class={className}
			>
				{#if showPlaceholder}
					<span class="text-xl text-theme-text">Press to show hint</span>
				{:else if showAlgorithm}
					<div
						class="mr-10 inline-flex flex-wrap items-center justify-center gap-1 font-mono text-lg font-semibold"
					>
						{#each algMoves as move}
							<span class="rounded bg-gray-100 px-2 py-1 font-mono font-semibold text-theme-text"
								>{move}</span
							>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if showEditButton}
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onEditAlg();
				}}
				class="hover:bg-opacity-90 absolute top-2 right-0 z-10 translate-x-10 rounded-full p-2 text-primary-500 transition-all duration-200 md:translate-x-10"
				title="Edit Algorithm"
				aria-label="Edit algorithm"
			>
				<Pencil class="size-6" strokeWidth={3} />
			</button>
		{/if}
	</div>
</div>

<!-- min-w-48 text-center font-mono text-2xl font-semibold md:text-3xl -->
