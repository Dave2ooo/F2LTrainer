<script lang="ts">
	import { Progressbar } from 'flowbite-svelte';
	import { trainState, regenerateTrainCaseQueue } from '$lib/trainCaseQueue.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { Check } from '@lucide/svelte';
	import { Confetti } from 'svelte-confetti';

	// Only show in recap mode
	let isRecapMode = $derived(sessionState.activeSession?.settings.frequencyMode === 'recap');

	// Progress calculation - use recapBatchSize for accurate total
	let currentIndex = $derived(trainState.index + 1);
	let total = $derived(trainState.recapBatchSize);
	let progress = $derived(total > 0 ? Math.min((currentIndex / total) * 100, 100) : 0);
	let label = $derived(`${Math.min(currentIndex, total)}/${total}`);

	// Success celebration state
	let showSuccess = $state(false);

	// Reset queue when recap is finished (user has seen all cases)
	$effect(() => {
		if (isRecapMode && total > 0 && currentIndex > total) {
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
	<div class="mx-auto mt-2 mb-4 w-full max-w-xs">
		{#if showSuccess}
			<div class="relative flex items-center justify-center gap-2 py-1 text-green-600 dark:text-green-400">
				<!-- Confetti burst from center -->
				<div class="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
					<Confetti
						x={[-0.8, 0.8]}
						y={[0.25, 1.5]}
						delay={[0, 50]}
						duration={2000}
						amount={100}
						fallDistance="100px"
					/>
				</div>
				<Check size={18} />
				<span class="text-sm font-medium">Recap Complete!</span>
			</div>
		{:else}
			<div class="mb-1 flex justify-between text-sm text-gray-600 dark:text-gray-400">
				<span>Recap</span>
				<span>{label}</span>
			</div>
			<Progressbar {progress} size="h-2" color="primary" />
		{/if}
	</div>
{/if}
