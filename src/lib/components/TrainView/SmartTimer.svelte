<script lang="ts">
	import { onDestroy } from 'svelte';

	// Props - time is now in centiseconds (1/100s)
	interface Props {
		initialTime?: number | null; // in centiseconds, null means untimed
	}
	let { initialTime }: Props = $props();

	// Timer state - all in centiseconds
	let isRunning = $state(false);
	let startTime = $state(0);
	// If initialTime is null (untimed solve), start at 0
	let elapsedCentiseconds = $state(initialTime ?? 0);
	let animationFrameId = $state<number | null>(null);
	// Mark as stopped if there's an initial time
	let isStopped = $state(initialTime !== undefined);

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
		}
	}

	export function stopTimer(): number | undefined {
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
		isRunning = false;
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	export function getIsRunning() {
		return isRunning;
	}

	export function getIsStopped() {
		return isStopped;
	}

	export function getElapsedTime() {
		return elapsedCentiseconds;
	}

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="mt-0 mb-2 flex w-full flex-col items-center md:mt-0 md:mb-4">
	<div
		class="relative min-w-60 rounded border border-gray-300 bg-transparent p-5 text-center font-mono text-4xl font-bold shadow-sm select-none md:text-5xl"
		class:text-green-500={isStopped && elapsedCentiseconds > 0}
		aria-label="Timer"
	>
		<span class="tabular-nums">{formattedTime}</span>
	</div>
</div>
