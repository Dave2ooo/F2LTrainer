<script lang="ts">
	import { onDestroy } from 'svelte';

	// Props
	interface Props {
		initialRecognitionTime?: number | null; // in centiseconds
		initialExecutionTime?: number | null; // in centiseconds
	}
	let { initialRecognitionTime, initialExecutionTime }: Props = $props();

	// Timer phases
	type Phase = 'idle' | 'recognition' | 'execution' | 'stopped';

	// Timer state - all in centiseconds
	let phase = $state<Phase>('idle');
	let recognitionStartTime = $state(0);
	let executionStartTime = $state(0);
	let recognitionCentiseconds = $state(initialRecognitionTime ?? 0);
	let executionCentiseconds = $state(initialExecutionTime ?? 0);
	let animationFrameId = $state<number | null>(null);

	// Update times when initial props change (e.g., viewing history)
	// Only update if actual values are provided (not undefined)
	$effect(() => {
		if ((phase === 'idle' || phase === 'stopped') && initialRecognitionTime !== undefined) {
			recognitionCentiseconds = initialRecognitionTime ?? 0;
		}
	});
	$effect(() => {
		if ((phase === 'idle' || phase === 'stopped') && initialExecutionTime !== undefined) {
			executionCentiseconds = initialExecutionTime ?? 0;
		}
	});

	// Format time as XX.XX (e.g., 05.56)
	function formatTime(centiseconds: number): string {
		const seconds = Math.floor(centiseconds / 100);
		const cs = centiseconds % 100;
		return `${seconds.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
	}

	let formattedRecognitionTime = $derived(formatTime(recognitionCentiseconds));
	let formattedExecutionTime = $derived(formatTime(executionCentiseconds));
	let formattedTotalTime = $derived(formatTime(recognitionCentiseconds + executionCentiseconds));

	function updateTimer() {
		const now = Date.now();

		if (phase === 'recognition') {
			recognitionCentiseconds = Math.floor((now - recognitionStartTime) / 10);
			animationFrameId = requestAnimationFrame(updateTimer);
		} else if (phase === 'execution') {
			executionCentiseconds = Math.floor((now - executionStartTime) / 10);
			animationFrameId = requestAnimationFrame(updateTimer);
		}
	}

	/**
	 * Start the recognition phase timer
	 * Called when a new case is displayed
	 */
	export function startRecognition() {
		if (phase !== 'idle' && phase !== 'stopped') return;

		phase = 'recognition';
		recognitionStartTime = Date.now();
		recognitionCentiseconds = 0;
		executionCentiseconds = 0;
		updateTimer();
	}

	/**
	 * End recognition phase and start execution phase
	 * Called on first non-U move
	 * Returns the recognition time in centiseconds
	 */
	export function endRecognition(): number {
		if (phase !== 'recognition') return recognitionCentiseconds;

		// Finalize recognition time
		recognitionCentiseconds = Math.floor((Date.now() - recognitionStartTime) / 10);

		// Start execution phase
		phase = 'execution';
		executionStartTime = Date.now();
		executionCentiseconds = 0;

		return recognitionCentiseconds;
	}

	/**
	 * Stop the execution timer
	 * Called when F2L is solved
	 * Returns the execution time in centiseconds
	 */
	export function stopExecution(): number {
		// Handle being called from recognition phase (only U moves made)
		if (phase === 'recognition') {
			recognitionCentiseconds = Math.floor((Date.now() - recognitionStartTime) / 10);
			phase = 'stopped';
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			return 0; // No execution time if solved during recognition
		}

		if (phase !== 'execution') return executionCentiseconds;

		phase = 'stopped';
		executionCentiseconds = Math.floor((Date.now() - executionStartTime) / 10);

		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		return executionCentiseconds;
	}

	/**
	 * Reset the timer to idle state
	 */
	export function reset() {
		phase = 'idle';
		recognitionCentiseconds = 0;
		executionCentiseconds = 0;

		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	/**
	 * Get the current phase
	 */
	export function getPhase(): Phase {
		return phase;
	}

	/**
	 * Get recognition time in centiseconds
	 */
	export function getRecognitionTime(): number {
		return recognitionCentiseconds;
	}

	/**
	 * Get execution time in centiseconds
	 */
	export function getExecutionTime(): number {
		return executionCentiseconds;
	}

	/**
	 * Get total time in centiseconds
	 */
	export function getTotalTime(): number {
		return recognitionCentiseconds + executionCentiseconds;
	}

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="mt-0 mb-2 flex w-full flex-col items-center md:mt-0 md:mb-4">
	<div
		class="relative min-w-60 rounded border bg-transparent p-4 shadow-sm transition-colors select-none"
		class:border-gray-300={phase !== 'stopped'}
		class:border-green-500={phase === 'stopped'}
		class:dark:border-green-400={phase === 'stopped'}
		aria-label="Drill Timer"
	>
		<!-- Recognition Time -->
		<div class="flex items-center justify-between gap-4">
			<span
				class="text-sm font-medium text-gray-600 dark:text-gray-400"
				class:text-primary-600={phase === 'recognition'}
				class:dark:text-primary-400={phase === 'recognition'}
			>
				Recognition:
			</span>
			<span
				class="font-mono text-2xl font-bold tabular-nums md:text-3xl"
				class:text-primary-600={phase === 'recognition'}
				class:dark:text-primary-400={phase === 'recognition'}
			>
				{formattedRecognitionTime}
			</span>
		</div>

		<!-- Execution Time -->
		<div class="flex items-center justify-between gap-4">
			<span
				class="text-sm font-medium text-gray-600 dark:text-gray-400"
				class:text-green-600={phase === 'execution'}
				class:dark:text-green-400={phase === 'execution'}
			>
				Execution:
			</span>
			<span
				class="font-mono text-2xl font-bold tabular-nums md:text-3xl"
				class:text-green-600={phase === 'execution'}
				class:dark:text-green-400={phase === 'execution'}
			>
				{formattedExecutionTime}
			</span>
		</div>

		<!-- Divider -->
		<div class="my-2 border-t border-gray-200 dark:border-gray-600"></div>

		<!-- Total Time -->
		<div class="flex items-center justify-between gap-4">
			<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Total:</span>
			<span class="font-mono text-2xl font-bold tabular-nums md:text-3xl">
				{formattedTotalTime}
			</span>
		</div>
	</div>
</div>
