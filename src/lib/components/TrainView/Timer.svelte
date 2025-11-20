<script lang="ts">
	import { onDestroy } from 'svelte';

	// Timer state
	let isRunning = $state(false);
	let startTime = $state(0);
	let elapsedTime = $state(0);
	let animationFrameId = $state<number | null>(null);
	let isStopped = $state(false); // Track if timer was stopped (vs ready to start)

	// Format time as XX.XX (e.g., 05.56)
	let formattedTime = $derived.by(() => {
		const seconds = elapsedTime / 1000;
		const integerPart = Math.floor(seconds).toString().padStart(2, '0');
		const decimalPart = Math.floor((seconds % 1) * 100)
			.toString()
			.padStart(2, '0');
		return `${integerPart}.${decimalPart}`;
	});

	function updateTimer() {
		if (isRunning) {
			elapsedTime = Date.now() - startTime;
			animationFrameId = requestAnimationFrame(updateTimer);
		}
	}

	export function startTimer() {
		if (!isRunning && !isStopped) {
			isRunning = true;
			startTime = Date.now() - elapsedTime;
			updateTimer();
		}
	}

	export function stopTimer() {
		if (isRunning) {
			isRunning = false;
			isStopped = true; // Mark as stopped
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	}

	export function resetTimer() {
		elapsedTime = 0;
		isStopped = false; // Reset the stopped state
	}

	function handleTouchStart(event: TouchEvent) {
		event.preventDefault();
		if (isRunning) {
			stopTimer();
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		event.preventDefault();
		if (!isRunning && isStopped) {
			// Only start if we're in stopped state (not already running)
			resetTimer();
			startTimer();
		}
	}

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="my-4 flex w-full flex-col items-center md:my-6">
	<button
		type="button"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		class="min-w-60 cursor-pointer rounded border border-gray-300 bg-transparent p-5 text-center font-mono text-4xl font-bold shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-700 focus:outline-none md:text-5xl dark:hover:bg-gray-700"
		aria-label="Timer"
	>
		<span class="tabular-nums">{formattedTime}</span>
	</button>
</div>
