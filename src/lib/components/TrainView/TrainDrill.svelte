<script lang="ts">
	import { Button, ButtonGroup, P, Spinner, Hr } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		getNumberOfSelectedCases,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, onDestroy } from 'svelte';
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import BluetoothModal from '$lib/components/Modals/BluetoothModal.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import { globalState } from '$lib/globalState.svelte';

	// Reset drill when session changes
	import { untrack } from 'svelte';

	// Reset drill when session changes
	$effect(() => {
		// Just accessing the ID tracks it
		const _ = sessionState.activeSessionId;
		untrack(() => {
			// Reset to stopped state
			drillPhase = 'stopped';
			drillTimerRef?.reset();
			alg = '';
		});
	});
	import {
		Flag,
		SkipForward,
		Square,
		RotateCw,
		Play,
		Check,
		Bluetooth,
		BluetoothConnected,
		EllipsisVertical
	} from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import DrillTimer from './DrillTimer.svelte';

	// import ResponsiveLayout from './ResponsiveLayout.svelte';

	import RecapProgress from './RecapProgress.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import { savedCubesState } from '$lib/bluetooth/savedCubes.svelte';
	import { connectNewCube, connectSavedCube } from '$lib/bluetooth/actions';
	import { isUMove } from '$lib/utils/moveValidator';
	import { simplifyAlg } from '$lib/utils/simplifyAlg';

	// Drill state machine phases
	// 'stopped' = drill not running, no TwistyPlayer shown
	// 'countdown' = countdown before starting (3, 2, 1)
	// 'solving' = recognition phase (timer running, waiting for first non-U move)
	// 'executing' = execution phase (timer running, performing algorithm)
	// 'transitioning' = brief delay between cases
	// 'gave_up' = user gave up, showing algorithm
	type DrillPhase = 'stopped' | 'countdown' | 'solving' | 'executing' | 'transitioning' | 'gave_up';

	let drillTimerRef = $state<DrillTimer>();
	let twistyPlayerRef = $state<any>();
	let settingsRef = $state<Settings>();

	let transitionDuration = $derived(
		sessionState.activeSession?.settings.drillTimeBetweenCases ??
			DEFAULT_SETTINGS.drillTimeBetweenCases ??
			1.0
	);

	let scramble = $state('');
	let alg = $state('');

	// Algorithm for display when user gives up (calculated with AUF)
	let displayAlg = $state('');

	// Drill phase state - starts stopped
	let drillPhase = $state<DrillPhase>('stopped');

	// Countdown state
	let countdownNumber = $state(3);

	// Bluetooth modal state
	let bluetoothModalOpen = $state(false);

	const SUBSCRIBER_ID = 'train-drill';
	const SUBSCRIBER_PRIORITY = 50; // Normal priority - lower than BluetoothModal

	// Derived: is drill running (TwistyPlayer visible)
	let isDrillRunning = $derived(drillPhase !== 'stopped');

	// Derived: latest saved cube for smart connect
	let latestSavedCube = $derived.by(() => {
		if (savedCubesState.cubes.length === 0) return null;
		return [...savedCubesState.cubes].sort((a, b) => b.lastConnected - a.lastConnected)[0];
	});

	// Derived: button label for connect button
	let connectButtonLabel = $derived.by(() => {
		if (bluetoothState.isConnected) {
			const saved = bluetoothState.deviceId
				? savedCubesState.getCube(bluetoothState.deviceId)
				: null;
			return saved?.customName || bluetoothState.deviceName || 'Connected';
		}
		if (latestSavedCube) {
			return latestSavedCube.customName;
		}
		return 'Connect Cube';
	});

	// Stop drill if connection is lost during active drill
	$effect(() => {
		if (isDrillRunning && !bluetoothState.isConnected) {
			console.log('%c[Drill] Connection lost, stopping drill', 'color: #e74c3c; font-weight: bold');
			onStop();
		}
	});

	// Handle incoming move from subscription
	function handleSmartCubeMove(move: string) {
		// Trim the move and skip if empty
		const m = move.trim();
		if (!m) return;

		// Ignore moves when not actively solving
		if (drillPhase === 'stopped' || drillPhase === 'countdown' || drillPhase === 'transitioning') {
			return;
		}

		if (!twistyPlayerRef) return;

		try {
			// Log every raw move from smart cube
			console.log('%c[Drill Move]', 'color: #e91e63; font-weight: bold', m);

			// Check if this is the first non-U move (triggers execution phase)
			if (drillPhase === 'solving' && !isUMove(m)) {
				drillPhase = 'executing';
				drillTimerRef?.endRecognition();
				console.log(
					'%c[Drill] Recognition complete, execution started',
					'color: #27ae60; font-weight: bold'
				);
			}

			// Apply move directly to TwistyPlayer - no transformation needed
			twistyPlayerRef.addMove(m, m);
		} catch (e) {
			console.warn('Failed to apply move:', m, e);
		}
	}

	// Subscribe to move events when drill is running
	$effect(() => {
		const hasTrainCase = !!trainState.current;

		if (hasTrainCase && isDrillRunning) {
			bluetoothState.subscribeToMoves(SUBSCRIBER_ID, handleSmartCubeMove, SUBSCRIBER_PRIORITY);
		} else {
			bluetoothState.unsubscribeFromMoves(SUBSCRIBER_ID);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		bluetoothState.unsubscribeFromMoves(SUBSCRIBER_ID);
	});

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	let currentAlgorithmSelection = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].algorithmSelection
			: undefined
	);

	// Calculate the display algorithm with AUF (for showing when user gives up)
	$effect(() => {
		if (currentTrainCase) {
			const { groupId, caseId, auf, side, scramble: scrambleSelection } = currentTrainCase;
			const staticData = casesStatic[groupId]?.[caseId];

			if (staticData) {
				const caseState = casesState[groupId]?.[caseId];

				const algWithoutAUF = getCaseAlg(
					staticData,
					currentAlgorithmSelection ?? caseState?.algorithmSelection ?? { left: 0, right: 0 },
					caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				);

				const scrambleWithoutAUF = getCaseScramble(staticData, side, scrambleSelection);

				if (algWithoutAUF && scrambleWithoutAUF && auf !== undefined) {
					const [, algWithAUF] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
					displayAlg = simplifyAlg(algWithAUF);
				} else {
					displayAlg = '';
				}
			} else {
				displayAlg = '';
			}
		} else {
			displayAlg = '';
		}
	});

	function markAsSolved(force: boolean = false) {
		if (currentTrainCase) {
			if (force || !currentTrainCase.solved) {
				currentTrainCase.solved = true;
			}
		}
	}

	/**
	 * Record the solve with split times
	 */
	function recordSolveTime(recognitionTime: number, executionTime: number) {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;
			const totalTime = recognitionTime + executionTime;

			const solveId = crypto.randomUUID();
			currentTrainCase.time = totalTime;
			currentTrainCase.solveId = solveId;
			trainState.lastDisplayedTime = totalTime;

			statisticsState.addSolve({
				id: solveId,
				groupId,
				caseId,
				time: totalTime,
				timestamp: Date.now(),
				auf: currentTrainCase.auf,
				side: currentTrainCase.side,
				scrambleSelection: currentTrainCase.scramble,
				sessionId: sessionState.activeSessionId || undefined,
				recognitionTime,
				executionTime
			});

			markAsSolved(true);
		}
	}

	/**
	 * Called when F2L is solved - brief transition, then advance
	 */
	async function onF2LSolved() {
		if (drillPhase !== 'executing' && drillPhase !== 'solving') return;

		// Stop timer and get times
		const executionTime = drillTimerRef?.stopExecution() ?? 0;
		const recognitionTime = drillTimerRef?.getRecognitionTime() ?? 0;

		// Record solve
		recordSolveTime(recognitionTime, executionTime);

		// Transition delay - timer shows completed times during this period
		drillPhase = 'transitioning';
		await new Promise((resolve) => setTimeout(resolve, transitionDuration * 1000));

		// If user stopped the drill during transition, don't advance
		if (drillPhase !== 'transitioning') return;

		// Advance to next case (this resets timer and starts new recognition)
		await goToNextCase();
	}

	async function goToNextCase(withCountdown: boolean = false) {
		if (withCountdown) {
			drillPhase = 'countdown';
			countdownNumber = 3;
		}

		advanceToNextTrainCase();

		// Reset state for new case
		resetCaseState();

		await tick();

		if (withCountdown) {
			for (let i = 3; i >= 1; i--) {
				countdownNumber = i;
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		// Start solving the new case
		drillPhase = 'solving';
		await tick();
		drillTimerRef?.reset();
		drillTimerRef?.startRecognition();
	}

	function resetCaseState() {
		alg = '';
	}

	/**
	 * Smart connect - connect to last cube or new cube
	 */
	async function handleSmartConnect() {
		if (bluetoothState.isConnected) {
			// If already connected, open modal to view details/disconnect
			bluetoothModalOpen = true;
			return;
		}

		if (latestSavedCube) {
			await connectSavedCube(latestSavedCube.id);
		} else {
			await connectNewCube();
		}
	}

	/**
	 * Start the drill - show countdown, then start
	 */
	async function onStartDrill() {
		// Safety check - don't start if not connected
		if (!bluetoothState.isConnected) return;

		resetCaseState();

		// Countdown: 3, 2, 1
		drillPhase = 'countdown';
		for (let i = 3; i >= 1; i--) {
			countdownNumber = i;
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		// Start solving
		drillPhase = 'solving';
		await tick(); // Wait for DrillTimer to mount
		drillTimerRef?.reset();
		drillTimerRef?.startRecognition();
	}

	/**
	 * Give up on current case - show algorithm
	 */
	function onGiveUp() {
		drillTimerRef?.stopExecution();
		drillPhase = 'gave_up';
	}

	/**
	 * Redo the current case after giving up
	 */
	async function onRedo() {
		resetCaseState();
		twistyPlayerRef?.reset();

		drillPhase = 'countdown';
		countdownNumber = 3;

		for (let i = 3; i >= 1; i--) {
			countdownNumber = i;
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		drillPhase = 'solving';
		await tick();
		drillTimerRef?.reset();
		drillTimerRef?.startRecognition();
	}

	/**
	 * Resume with next case after giving up
	 */
	async function onResume() {
		await goToNextCase(true);
	}

	/**
	 * Skip current case (no record)
	 */
	async function onSkip() {
		drillTimerRef?.reset();
		await goToNextCase(true);
	}

	/**
	 * Stop drill session - hide TwistyPlayer, reset timer
	 */
	function onStop() {
		drillTimerRef?.reset();
		resetCaseState();
		drillPhase = 'stopped';
	}

	let { isRunning = $bindable(false) }: { isRunning?: boolean } = $props();

	$effect(() => {
		// Disable external controls only when drill is actively running, allowing access when gave up
		isRunning = isDrillRunning && drillPhase !== 'gave_up';
	});
</script>

{#if drillPhase === 'countdown'}
	<!-- Countdown display -->
	<div class="flex flex-col items-center justify-center py-20">
		<div class="animate-pulse text-9xl font-bold text-primary-600 dark:text-primary-400">
			{countdownNumber}
		</div>
		<P class="mt-4 text-gray-600 dark:text-gray-400">Get ready...</P>
		<div class="mt-8 flex justify-center">
			<span class="text-md rounded-full bg-purple-600 px-3 py-1 font-semibold text-white shadow-md">
				Hold Green Front, White Up
			</span>
		</div>
	</div>
{:else if isDrillRunning}
	<!-- Drill is running - show TwistyPlayer and controls -->

	<div
		class="relative mx-auto mt-4 size-50 md:size-60"
		onpointerdowncapture={() => {
			globalState.hasUsedTwistyPlayer = true;
		}}
	>
		{#if drillPhase === 'transitioning'}
			<div
				class="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-green-500/10 backdrop-blur-[1px]"
			>
				<div class="relative flex items-center justify-center">
					<!-- Checkmark in center -->
					<Check size={48} class="absolute text-green-600 drop-shadow-lg dark:text-green-400" />

					<!-- Radial Progress -->
					<svg class="size-32 -rotate-90 transform overflow-visible">
						<circle
							cx="64"
							cy="64"
							r="56"
							stroke="currentColor"
							stroke-width="8"
							fill="transparent"
							class="text-green-200 dark:text-green-900"
						/>
						<circle
							cx="64"
							cy="64"
							r="56"
							stroke="currentColor"
							stroke-width="8"
							fill="transparent"
							class="radial-countdown text-green-500"
							stroke-dasharray="352"
							stroke-dashoffset="0"
							style="--duration: {transitionDuration}s"
						/>
					</svg>
				</div>
			</div>
		{/if}

		{#if currentTrainCase}
			<TwistyPlayer
				bind:this={twistyPlayerRef}
				bind:scramble
				bind:movesAdded={alg}
				groupId={currentTrainCase.groupId}
				caseId={currentTrainCase.caseId}
				algorithmSelection={currentAlgorithmSelection}
				auf={currentTrainCase.auf}
				side={currentTrainCase.side}
				crossColor={currentTrainCase.crossColor}
				frontColor={currentTrainCase.frontColor}
				scrambleSelection={currentTrainCase.scramble}
				stickering={sessionState.activeSession?.settings.trainHintStickering ??
					DEFAULT_SETTINGS.trainHintStickering}
				backView={sessionState.activeSession?.settings.backView || 'none'}
				backViewEnabled={sessionState.activeSession?.settings.backViewEnabled || false}
				experimentalDragInput="auto"
				class="size-full"
				controlPanel="none"
				showVisibilityToggle={false}
				tempoScale={5}
				showAlg={false}
				onF2LSolved={() => {
					const shouldTrigger = alg && alg.trim() !== '';
					if (shouldTrigger) {
						onF2LSolved();
					}
				}}
			/>
		{:else}
			<div class="flex h-60 items-center justify-center">
				<P>Loading case...</P>
			</div>
		{/if}
	</div>

	<!-- Drill Timer -->
	<div class="mt-2">
		<DrillTimer bind:this={drillTimerRef} />
	</div>
	<RecapProgress />

	<!-- Action buttons / Gave up UI -->
	{#if drillPhase === 'gave_up'}
		<!-- Show algorithm and Redo/Resume buttons -->
		<div class="mt-4 flex flex-col items-center gap-4">
			<div
				class="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800"
			>
				<div class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Algorithm:</div>
				<div class="font-mono text-xl font-semibold">{displayAlg}</div>
			</div>
			<div class="flex gap-2">
				<Button color="alternative" onclick={onRedo}>
					<RotateCw class="mr-2 size-4" />
					Redo
				</Button>
				<Button color="primary" onclick={onResume}>
					<Play class="mr-2 size-4" />
					Resume
				</Button>
			</div>
		</div>
	{:else}
		<!-- Normal action buttons -->
		<div class="mt-4 flex justify-center gap-2">
			<Button color="purple" outline onclick={onGiveUp} disabled={drillPhase === 'transitioning'}>
				<Flag class="mr-2 size-4" />
				Give up
			</Button>
			<Button color="light" onclick={onSkip} disabled={drillPhase === 'transitioning'}>
				<SkipForward class="mr-2 size-4" />
				Skip
			</Button>
			<Button color="red" outline onclick={onStop}>
				<Square class="mr-2 size-4" />
				Stop
			</Button>
		</div>
	{/if}
{:else}
	<!-- Drill is stopped - show Start button or Connect button -->
	<div class="flex flex-col items-center justify-center gap-6 py-6">
		<div class="text-center">
			<h2 class="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200">Drill Mode</h2>
			<P class="text-center text-gray-600 dark:text-gray-400">
				Test your recognition and execution speed without hints.
			</P>
		</div>

		{#if bluetoothState.isConnected}
			<!-- Smart cube connected - show Start button -->
			<Button color="primary" size="xl" onclick={onStartDrill}>
				<Play class="mr-2 size-5" />
				Start Drill
			</Button>
		{:else}
			<!-- Not connected - show Connect button group -->
			<div class="flex flex-col items-center gap-3">
				<P class="text-center text-sm text-gray-500 dark:text-gray-400">
					Connect a smart cube to start drilling
				</P>
				<ButtonGroup>
					<Button color="light" onclick={handleSmartConnect} disabled={bluetoothState.isConnecting}>
						{#if bluetoothState.isConnecting}
							<Spinner class="mr-2" size="5" />
							<span class="text-base font-medium">Connecting...</span>
						{:else}
							<Bluetooth class="mr-2 size-5" />
							<span class="text-base font-medium">{connectButtonLabel}</span>
						{/if}
					</Button>
					<Button color="light" onclick={() => (bluetoothModalOpen = true)}>
						<EllipsisVertical class="size-5" />
					</Button>
				</ButtonGroup>
			</div>
		{/if}

		<div class="text-center text-sm text-gray-500 dark:text-gray-400">
			<P>{getNumberOfSelectedCases()} cases selected</P>
		</div>
	</div>
{/if}

<Hr class="mx-auto my-4 h-1 w-80 rounded border-0 bg-gray-300 dark:bg-gray-600" />

<div class="flex flex-row justify-center gap-2">
	<TrainStateSelect />
</div>

<div class="mt-4">
	<Details />
</div>

<Settings bind:this={settingsRef} />
<BluetoothModal bind:open={bluetoothModalOpen} />

<style>
	@keyframes countdown {
		to {
			stroke-dashoffset: 352;
		}
	}

	.radial-countdown {
		animation: countdown var(--duration) linear forwards;
	}
</style>
