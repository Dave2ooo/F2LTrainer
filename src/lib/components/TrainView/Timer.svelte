<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Pointer } from '@lucide/svelte';
	import { globalState } from '$lib/globalState.svelte';

	// Props
	interface Props {
		onStop?: (time: number) => void;
	}
	let { onStop }: Props = $props();

	// Timer state
	let isRunning = $state(false);
	let startTime = $state(0);
	let elapsedTime = $state(0);
	let animationFrameId = $state<number | null>(null);
	let isStopped = $state(false); // Track if timer was stopped (vs ready to start)
	let isReady = $state(false); // Track if user is holding spacebar/button to prepare starting

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
		if (!isRunning) {
			isRunning = true;
			startTime = Date.now() - elapsedTime;
			updateTimer();
			globalState.hasUsedTimer = true;
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
			return elapsedTime; // Return elapsed time
		}
		return undefined; // Return undefined if timer wasn't running
	}

	export function resetTimer() {
		elapsedTime = 0;
		isStopped = false; // Reset the stopped state
	}

	export function getIsRunning() {
		return isRunning;
	}

	export function getIsStopped() {
		return isStopped;
	}

	export function setReady(ready: boolean) {
		isReady = ready;
	}

	export function getIsReady() {
		return isReady;
	}

	function handlePointerDown(event: PointerEvent) {
		event.preventDefault();
		if (isRunning) {
			stopTimer();
			// Notify parent that timer was stopped (to advance to next case)
			onStop?.(elapsedTime);
		} else if (!isRunning) {
			// Prepare to start timer
			isReady = true;
			resetTimer(); // Reset timer display when ready state is entered
		}
	}

	function handlePointerUp(event: PointerEvent) {
		event.preventDefault();
		if (isReady && !isRunning) {
			// Start timer if in ready state
			resetTimer();
			startTimer();
			isReady = false;
		}
	}

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="mb-2 mt-0 flex w-full flex-col items-center md:mb-4 md:mt-0">
	<button
		type="button"
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		class="relative min-w-60 cursor-pointer rounded border border-gray-300 bg-transparent p-5 text-center font-mono text-4xl font-bold shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-600 focus:outline-none md:text-5xl dark:hover:bg-gray-700 select-none"
		class:text-green-500={isReady}
		aria-label="Timer"
	>
		<span class="tabular-nums">{formattedTime}</span>
		{#if !isRunning && !isReady && !globalState.hasUsedTimer}
			<Pointer class="absolute bottom-2 right-2 size-6 animate-bounce text-primary-600" />
		{/if}
	</button>
</div>
