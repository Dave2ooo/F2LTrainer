<script lang="ts">
	import { Pencil } from '@lucide/svelte';

	interface Props {
		alg: string;
		onEditAlg: () => void;
	}

	let { alg, onEditAlg }: Props = $props();

	// Parse the algorithm into individual moves for consistent display
	let algMoves = $derived.by(() => {
		if (!alg) return [];
		return alg.split(' ').filter((move) => move.trim() !== '');
	});

	// Tailwind classes separated into named groups for readability
	const hintBase = [
		'min-w-60',
		'rounded',
		'border border-gray-300',
		'bg-transparent',
		'p-5',
		'text-center',
		'text-xl md:text-2xl',
		'shadow-sm',
		'transition-colors'
	].join(' ');

	const className = hintBase;

	const algContainerClass =
		'mr-10 inline-flex flex-wrap items-center justify-center gap-1 font-mono text-lg font-semibold md:text-3xl';

	const chipClass = 'rounded bg-gray-100 dark:bg-gray-600 px-2 py-1 font-mono font-semibold text-theme-text';

	const editButtonClass =
		'hover:bg-opacity-90 absolute top-1/2 right-0 z-10 translate-x-10 -translate-y-1/2 rounded-full p-2 text-primary-500 transition-all duration-200 md:translate-x-10';

	let showEditButton = $derived(algMoves.length > 0);
</script>

<!-- Container holds the hint button UI -->
<div class="my-2 flex w-full flex-col items-center md:my-4">
	<div class="relative">
		<div class={className}>
			{#if algMoves.length > 0}
				<div class={algContainerClass}>
					{#each algMoves as move}
						<span class={chipClass}>{move}</span>
					{/each}
				</div>
			{:else}
				<span class="text-xl text-theme-text md:text-2xl">No algorithm available</span>
			{/if}
		</div>

		{#if showEditButton}
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onEditAlg();
				}}
				class={editButtonClass}
				title="Edit Algorithm"
				aria-label="Edit algorithm"
			>
				<Pencil class="size-6" strokeWidth={3} />
			</button>
		{/if}
	</div>
</div>
