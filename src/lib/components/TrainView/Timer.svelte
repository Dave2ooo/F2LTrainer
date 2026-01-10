<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Pointer } from '@lucide/svelte';
	import { globalState } from '$lib/globalState.svelte';

	// Props - time is now in centiseconds (1/100s)
	interface Props {
		onStop?: (timeInCentiseconds: number) => void;
		initialTime?: number | null; // in centiseconds, null means untimed
	}
	let { onStop, initialTime }: Props = $props();

	// Timer state - all in centiseconds
	let isRunning = $state(false);
	let startTime = $state(0);
	// If initialTime is null (untimed solve), start at 0
	let elapsedCentiseconds = $state(initialTime ?? 0);
	let animationFrameId = $state<number | null>(null);
	// Mark as stopped if there's an initial time (even if it's 0/null, though usually 0 means ready to start)
	// Actually, if we are viewing a history item, we want it to look "stopped" at that time.
	// If initialTime is provided (even null), it means we are viewing a state, not ready to start a new one?
	// The logic for `isStopped` was `initialTime !== undefined`.
	// If we pass `null` for untimed solve, `isStopped` becomes true, which is correct (we are viewing a result).
	let isStopped = $state(initialTime !== undefined);
	let isReady = $state(false);

	// Update elapsedCentiseconds when initialTime prop changes
	$effect(() => {
		if (!isRunning) {
			elapsedCentiseconds = initialTime ?? 0;
			isStopped = initialTime !== undefined;
		}
	});

	// Format time as XX.XX (e.g., 05.56)
	let formattedTime = $derived.by(() => {
		const seconds = Math.floor(elapsedCentiseconds / 100);
		const centiseconds = elapsedCentiseconds % 100;
		return `${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	});

	function updateTimer() {
		if (isRunning) {
			const elapsedMs = Date.now() - startTime;
			elapsedCentiseconds = Math.floor(elapsedMs / 10);
			animationFrameId = requestAnimationFrame(updateTimer);
		}
	}

	export function startTimer() {
		if (!isRunning) {
			isRunning = true;
			// Convert centiseconds back to milliseconds for Date.now() calculation
			startTime = Date.now() - elapsedCentiseconds * 10;
			updateTimer();
			globalState.hasUsedTimer = true;
		}
	}

	export function stopTimer() {
		if (isRunning) {
			isRunning = false;
			isStopped = true;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			return elapsedCentiseconds;
		}
		return undefined;
	}

	export function resetTimer() {
		elapsedCentiseconds = 0;
		isStopped = false;
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
			// Notify parent that timer was stopped
			onStop?.(elapsedCentiseconds);
		} else if (!isRunning) {
			// Prepare to start timer
			isReady = true;
			resetTimer();
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

<div class="mt-0 mb-2 flex w-full flex-col items-center md:mt-0 md:mb-4">
	<button
		type="button"
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		class="display-box relative cursor-pointer font-mono text-4xl font-bold hover:bg-gray-50 focus:ring-2 focus:ring-primary-600 focus:outline-none md:text-5xl dark:hover:bg-gray-700"
		class:text-green-500={isReady}
		aria-label="Timer"
	>
		<span class="tabular-nums">{formattedTime}</span>
		{#if !isRunning && !isReady && !globalState.hasUsedTimer}
			<Pointer class="absolute right-2 bottom-2 size-6 animate-bounce text-primary-600" />
		{/if}
	</button>
</div>
