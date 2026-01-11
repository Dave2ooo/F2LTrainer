<script lang="ts">
	import { Progressbar, Badge } from 'flowbite-svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { Check } from '@lucide/svelte';
	import { Confetti } from 'svelte-confetti';
	import { fade } from 'svelte/transition';

	// Only show in recap mode
	let isRecapMode = $derived(sessionState.activeSession?.settings.frequencyMode === 'recap');

	// Progress calculation - use recapBatchSize for accurate total
	let total = $derived(trainState.recapBatchSize);

	// Track which batch we are currently in (0-based)
	let currentBatchCount = $derived(total > 0 ? Math.floor(trainState.index / total) : 0);

	// Track the last batch we acknowledged/celebrated
	let lastSeenBatchCount = $state(0);
	let initialized = $state(false);

	// Initialize tracking on first load to avoid celebrating immediately if restoring state
	$effect(() => {
		if (!initialized && total > 0) {
			lastSeenBatchCount = currentBatchCount;
			initialized = true;
		}
	});

	// Check for batch completion
	let isNewBatch = $derived(initialized && currentBatchCount > lastSeenBatchCount);

	// Success celebration state
	let showSuccess = $state(false);

	// Effect to manage success state and transitions
	$effect(() => {
		if (isRecapMode && isNewBatch && !showSuccess) {
			showSuccess = true;
			setTimeout(() => {
				// Acknowledge the new batch, ending the success state and resetting progress display
				lastSeenBatchCount = currentBatchCount;
				showSuccess = false;
			}, 3000);
		}
	});

	// Progress display
	// If showing success, we force "Total/Total" (100%)
	// Otherwise we show index relative to current batch (0 to Total-1)
	let displayIndex = $derived(showSuccess ? total : total > 0 ? trainState.index % total : 0);
	let progress = $derived(total > 0 ? (displayIndex / total) * 100 : 0);
	let label = $derived(`${displayIndex}/${total}`);
</script>

{#if isRecapMode && total > 0}
	<div class="relative mx-auto mt-2 mb-4 w-full max-w-xs">
		<!-- Success Celebration Overlay -->
		{#if showSuccess}
			<div
				transition:fade={{ duration: 200 }}
				class="pointer-events-none absolute -top-4 right-0 left-0 z-10 flex flex-col items-center"
			>
				<!-- Confetti burst from center -->
				<div class="absolute top-4">
					<Confetti
						x={[-0.8, 0.8]}
						y={[0.25, 1.5]}
						delay={[0, 50]}
						duration={2000}
						amount={100}
						fallDistance="100px"
					/>
				</div>

				<Badge
					color="green"
					rounded
					class="flex items-center gap-2 border border-green-200 px-3 py-1 shadow-md backdrop-blur-sm dark:border-green-900"
				>
					<Check size={16} strokeWidth={3} />
					<span class="text-sm font-bold whitespace-nowrap">Recap Complete!</span>
				</Badge>
			</div>
		{/if}

		<div class="mb-1 flex justify-between text-sm text-gray-600 dark:text-gray-400">
			<span>Recap</span>
			<span>{label}</span>
		</div>
		<Progressbar {progress} size="h-2" color="primary" />
	</div>
{/if}
