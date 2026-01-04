<script lang="ts">
	import type { HintAlgorithm } from '$lib/types/globalState';
	import { Pencil, Undo2 } from '@lucide/svelte';
	import { isRotationMove } from '$lib/utils/moveValidator';

	interface Props {
		alg: string;
		onEditAlg: () => void;
		movesAdded?: string;
		currentMoveIndex?: number; // NEW: Current position in algorithm
		validationFeedback?: 'correct' | 'incorrect' | 'neutral'; // NEW: Visual feedback
		undoMoves?: string[]; // Undo moves to correct mistakes
		editDisabled?: boolean; // Disable edit button when moves have been made
		hintMode?: HintAlgorithm; // Hint display mode: step, allAtOnce, always
		hasMadeFirstMove?: boolean; // Whether the user has made their first move
	}

	let {
		alg,
		onEditAlg,
		movesAdded = '',
		currentMoveIndex = 0,
		validationFeedback = 'neutral',
		undoMoves = [],
		editDisabled = false,
		hintMode = 'step',
		hasMadeFirstMove = false
	}: Props = $props();

	// Number of "current" moves to highlight (lookahead window)
	const LOOKAHEAD_COUNT = 1;

	// Parse algorithm moves once and reuse
	let algMoves = $derived.by(() => {
		if (!alg) return [];
		return alg.split(' ').filter((move) => move.trim() !== '');
	});

	// Calculate dynamic lookahead (show 2 moves if current is rotation)
	let dynamicLookahead = $derived.by(() => {
		const currentMove = algMoves[currentMoveIndex];
		return currentMove && isRotationMove(currentMove) ? 2 : LOOKAHEAD_COUNT;
	});

	// Categorize algorithm moves into completed, current, and future
	let completedMoves = $derived(algMoves.slice(0, currentMoveIndex));

	let currentMoves = $derived(
		algMoves.slice(currentMoveIndex, currentMoveIndex + dynamicLookahead)
	);

	let futureMoves = $derived(algMoves.slice(currentMoveIndex + dynamicLookahead));

	// Calculate total progress
	let totalMoves = $derived(algMoves.length);

	// For displaying "applied moves" - kept for reference
	let movesAddedList = $derived.by(() => {
		if (!movesAdded) return [];
		return movesAdded.split(' ').filter((move) => move.trim() !== '');
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
		'inline-flex flex-wrap items-center justify-center gap-1 font-mono text-lg font-semibold md:text-3xl';

	const movesAddedChipClass =
		'rounded bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 font-mono text-base md:text-xl text-blue-800 dark:text-blue-200';

	// Completed moves - dimmed, greenish tint
	const completedChipClass =
		'rounded bg-green-100 dark:bg-green-900 px-2 py-1 font-mono font-semibold text-green-700 dark:text-green-300 opacity-70';

	// Current target moves - bright, pulsing highlight
	const currentChipClass =
		'rounded bg-blue-500 dark:bg-blue-600 px-2 py-1 font-mono font-semibold text-white animate-pulse shadow-lg';

	// Determine if full algorithm should be visible based on hint mode
	// - 'always': show from the start
	// - 'allAtOnce': show after first move is made (all blurred until then)
	// - 'step': never show all at once (blur future moves)
	let showFullAlgorithm = $derived(
		hintMode === 'always' || (hintMode === 'allAtOnce' && hasMadeFirstMove)
	);

	// For 'allAtOnce' mode before first move, blur EVERYTHING including current moves
	let isAllBlurred = $derived(hintMode === 'allAtOnce' && !hasMadeFirstMove);

	// Future moves - blurred when step mode or allAtOnce before first move, visible when full algorithm revealed
	const futureChipBlurred =
		'rounded bg-gray-200 dark:bg-gray-700 px-2 py-1 font-mono font-semibold text-gray-400 dark:text-gray-500 blur-sm';
	const futureChipVisible =
		'rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 font-mono font-semibold text-gray-600 dark:text-gray-400';
	let futureChipClass = $derived(showFullAlgorithm ? futureChipVisible : futureChipBlurred);

	// Current move chip - blurred version for allAtOnce before first move
	const currentChipBlurred =
		'rounded bg-gray-200 dark:bg-gray-700 px-2 py-1 font-mono font-semibold text-gray-400 dark:text-gray-500 blur-sm';
	let currentChipClassDynamic = $derived(isAllBlurred ? currentChipBlurred : currentChipClass);

	// Undo moves - warning style with amber colors
	const undoChipClass =
		'rounded bg-amber-500 dark:bg-amber-600 px-2 py-1 font-mono font-semibold text-white shadow-md';

	// Container feedback styling based on validation
	const getContainerFeedbackClass = (feedback: 'correct' | 'incorrect' | 'neutral') => {
		if (feedback === 'correct') {
			return 'border-green-500 bg-green-50 dark:bg-green-950/20';
		} else if (feedback === 'incorrect') {
			return 'border-red-500 bg-red-50 dark:bg-red-950/20 animate-shake';
		}
		return '';
	};

	const editButtonClass = 'flex-shrink-0 rounded-full p-2 transition-all duration-200';

	let showEditButton = $derived(totalMoves > 0);

	// Edit button color classes based on disabled state
	let editButtonColorClass = $derived(
		editDisabled
			? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
			: 'text-primary-500 hover:bg-opacity-90 cursor-pointer'
	);

	// Check if we have undo moves to display
	let hasUndoMoves = $derived(undoMoves.length > 0);
</script>

<!-- Container holds the hint button UI -->
<div class="my-2 flex w-full flex-col items-center md:my-4">
	<div class="relative flex max-w-full items-center justify-center gap-2">
		<div class={`${className} ${getContainerFeedbackClass(validationFeedback)}`}>
			{#if totalMoves > 0}
				<div class={algContainerClass}>
					<!-- Completed moves -->
					{#each completedMoves as move}
						<span class={completedChipClass}>{move}</span>
					{/each}

					<!-- Current target moves -->
					{#each currentMoves as move}
						<span class={currentChipClassDynamic}>{move}</span>
					{/each}

					<!-- Future moves (hidden or blurred) -->
					{#each futureMoves as move}
						<span class={futureChipClass}>{move}</span>
					{/each}
				</div>

				<!-- Progress indicator -->
				<!-- <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Progress: {currentMoveIndex}/{totalMoves} moves
				</div> -->
			{:else}
				<span class="text-xl text-theme-text md:text-2xl">No algorithm available</span>
			{/if}
		</div>

		{#if showEditButton}
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					if (!editDisabled) {
						onEditAlg();
					}
				}}
				class={`${editButtonClass} ${editButtonColorClass}`}
				title={editDisabled ? 'Undo moves first to edit algorithm' : 'Edit Algorithm'}
				aria-label={editDisabled ? 'Edit disabled - undo moves first' : 'Edit algorithm'}
				aria-disabled={editDisabled}
			>
				<Pencil class="size-6" strokeWidth={3} />
			</button>
		{/if}
	</div>

	{#if hasUndoMoves}
		<div
			class="mt-3 flex flex-col items-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-950/30"
		>
			<div class="flex items-center gap-2 text-amber-700 dark:text-amber-400">
				<Undo2 class="size-5" strokeWidth={2.5} />
				<span class="text-sm font-semibold tracking-wide uppercase">Undo Required</span>
			</div>
			<div class="flex flex-wrap items-center justify-center gap-1">
				{#each undoMoves as move}
					<span class={undoChipClass}>{move}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- <div class="mt-2 flex flex-col items-center gap-1">
		<span class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
			>Applied Moves</span
		>
		<div class="flex flex-wrap items-center justify-center gap-1">
			{#each movesAddedList as move}
				<span class={movesAddedChipClass}>{move}</span>
			{/each}
		</div>
	</div> -->
</div>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}

	:global(.animate-shake) {
		animation: shake 0.3s ease-in-out;
	}
</style>
