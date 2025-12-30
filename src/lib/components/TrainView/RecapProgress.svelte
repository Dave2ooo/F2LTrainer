<script lang="ts">
	import { Progressbar, Badge } from 'flowbite-svelte';
	import { trainState, regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { Check } from '@lucide/svelte';
	import { Confetti } from 'svelte-confetti';
	import { fade } from 'svelte/transition';

	// Only show in recap mode
	let isRecapMode = $derived(sessionState.activeSession?.settings.frequencyMode === 'recap');

	// Progress calculation - use recapBatchSize for accurate total
	let total = $derived(trainState.recapBatchSize);

	// Use modulo to show progress within the current round, even if the queue grows during transition
	let currentBatchIndex = $derived(total > 0 ? (trainState.index % total) + 1 : 1);
	let progress = $derived(total > 0 ? (currentBatchIndex / total) * 100 : 0);
	let label = $derived(`${currentBatchIndex}/${total}`);

	// Success celebration state
	let showSuccess = $state(false);

	// Reset queue when recap is finished (user has seen all cases)
	$effect(() => {
		// Use total to detect when we've moved past the last case (index is 0-based)
		const currentIndex = trainState.index + 1;
		if (isRecapMode && total > 0 && currentIndex > total && !showSuccess) {
			// Show success effect briefly before resetting
			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
				regenerateTrainCaseQueue();
			}, 3000);
		}
	});
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
