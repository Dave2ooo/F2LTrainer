<script lang="ts">
	import { Button, P, Select } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		getNumberOfSelectedCases,
		regenerateTrainCaseQueue,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, onMount } from 'svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { casesState, TrainStateColors, TrainStateTextColors } from '$lib/casesState.svelte';
	import { statistics, getNextSolveId, addSolve, updateSolve } from '$lib/statisticsState.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import { trainSettingsManager } from '$lib/utils/trainSettings';
	import EditAlg from '$lib/components/Modals/EditAlgModal.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import HintButton from './HintButton.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { createHintManager } from '$lib/utils/hintManager.svelte';
	import { ArrowLeft, ArrowRight, Pointer } from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import Timer from './Timer.svelte';
	import { createKeyboardHandlers } from './trainViewEventHandlers.svelte';
	import ResponsiveLayout from './ResponsiveLayout.svelte';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let editAlgRef = $state<EditAlg>();
	let timerRef = $state<Timer>();

	let twistyPlayerRef = $state<any>();
	let algViewerContainer = $state<HTMLElement>();
	let twistyAlgViewerLoaded = $state(false);

	let scramble = $state('');
	let alg = $state('');

	// Track the last displayed time to persist across case navigation
	// Now managed in trainState to allow clearing it on navigation
	// let lastDisplayedTime = $state<number | undefined>(undefined);

	// Create hint manager instance
	const hintManager = createHintManager();

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	// Compute the time to display: use case time if available, otherwise keep last displayed time
	// Note: currentTrainCase.time can be null (untimed) or undefined (new case)
	// We only want to fallback to lastDisplayedTime if it is undefined.
	// If it is null, we want to pass null to the timer so it shows 00.00
	let displayTime = $derived(
		currentTrainCase?.time !== undefined ? currentTrainCase.time : trainState.lastDisplayedTime
	);

	let staticData = $derived(
		currentTrainCase ? casesStatic[currentTrainCase.groupId][currentTrainCase.caseId] : undefined
	);
	let caseState = $derived(
		currentTrainCase ? casesState[currentTrainCase.groupId][currentTrainCase.caseId] : undefined
	);

	let currentTrainCaseTrainState = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState
			: 'unlearned'
	);

	let currentAlgorithmSelection = $derived(
		currentTrainCase
			? casesState[currentTrainCase.groupId][currentTrainCase.caseId].algorithmSelection
			: undefined
	);

	function markAsSolved(force: boolean = false) {
		if (currentTrainCase) {
			if (force || !currentTrainCase.solved) {
				currentTrainCase.solved = true;
			}
		}
	}

	async function onNext() {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;

			// If no solve has been recorded for this case instance yet, record an untimed solve
			if (currentTrainCase.solveId === undefined) {
				const solveId = getNextSolveId();

				// Add new untimed solve
				addSolve({
					id: solveId,
					groupId,
					caseId,
					time: null,
					timestamp: Date.now(),
					auf: currentTrainCase.auf,
					side: currentTrainCase.side,
					scrambleSelection: currentTrainCase.scramble
				});

				// Update the TrainCase with the solve ID so we don't record it again
				currentTrainCase.solveId = solveId;
			}
		}

		markAsSolved();
		advanceToNextTrainCase();
		hintManager.reset();
		// Wait for next tick to ensure DOM is updated
		await tick();
		hintManager.initialize(
			globalState.trainHintAlgorithm,
			twistyAlgViewerLoaded,
			algViewerContainer
		);
	}

	async function onPrevious() {
		advanceToPreviousTrainCase();
		hintManager.reset();
		// Wait for next tick to ensure DOM is updated
		await tick();
		hintManager.initialize(
			globalState.trainHintAlgorithm,
			twistyAlgViewerLoaded,
			algViewerContainer
		);
	}

	function showHintAlg() {
		hintManager.revealHint(
			globalState.trainHintAlgorithm,
			alg,
			twistyAlgViewerLoaded,
			algViewerContainer
		);
	}

	function handleTimerStop(timeInCentiseconds: number) {
		if (currentTrainCase) {
			const { groupId, caseId } = currentTrainCase;

			// Time is already in centiseconds (1/100s), no conversion needed
			// This eliminates all floating-point precision issues

			// Check if this case already has a solve ID (i.e., user is correcting a previous time)
			if (currentTrainCase.solveId !== undefined) {
				// Update existing solve
				updateSolve(currentTrainCase.solveId, timeInCentiseconds);

				// Update the time in the TrainCase
				currentTrainCase.time = timeInCentiseconds;
				// Update the last displayed time
				trainState.lastDisplayedTime = timeInCentiseconds;
			} else {
				// This is a new solve - get the next solve ID
				const solveId = getNextSolveId();
				// Save time and solve ID to the TrainCase
				currentTrainCase.time = timeInCentiseconds;
				currentTrainCase.solveId = solveId;
				// Update the last displayed time
				trainState.lastDisplayedTime = timeInCentiseconds;

				// Add new solve
				addSolve({
					id: solveId,
					groupId,
					caseId,
					time: timeInCentiseconds,
					timestamp: Date.now(),
					auf: currentTrainCase.auf,
					side: currentTrainCase.side,
					scrambleSelection: currentTrainCase.scramble
				});

				// Mark as solved
				markAsSolved(true);
			}
		}
		onNext();
	}

	// Create keyboard event handlers
	const { handleKeydown, handleKeyup } = createKeyboardHandlers(
		() => timerRef,
		onNext,
		handleTimerStop
	);

	async function loadTwistyAlgViewer() {
		try {
			// Wait for the TwistyPlayer element to be ready
			await tick();

			// Check if twistyPlayerRef is available
			if (!twistyPlayerRef) {
				console.warn('TwistyPlayer ref not available yet');
				return;
			}

			const [{ TwistyAlgViewer }] = await Promise.all([
				import('cubing/twisty'),
				import('cubing/alg')
			]);

			const twistyPlayerElement = twistyPlayerRef?.getElement();
			if (twistyPlayerElement && algViewerContainer) {
				// Clear any existing content
				algViewerContainer.innerHTML = '';
				// Create and append the TwistyAlgViewer
				const algViewer = new TwistyAlgViewer({ twistyPlayer: twistyPlayerElement });
				algViewerContainer.appendChild(algViewer);
				twistyAlgViewerLoaded = true;
				// console.log('TwistyAlgViewer loaded successfully');
			}
		} catch (error) {
			console.error('Failed to load TwistyAlgViewer:', error);
			twistyAlgViewerLoaded = false;
		}
	}

	onMount(async () => {
		// Wait a bit for TwistyPlayer to fully initialize
		await tick();
		// Small delay to ensure TwistyPlayer's onMount has completed
		setTimeout(() => {
			loadTwistyAlgViewer();
		}, TWISTY_PLAYER_INIT_DELAY);
	});

	// Initialize hint display when TwistyAlgViewer loads or case changes
	$effect(() => {
		// Track dependencies
		void twistyAlgViewerLoaded;
		void currentTrainCase;

		if (twistyAlgViewerLoaded && currentTrainCase) {
			// Small delay to ensure AlgViewer is fully rendered
			setTimeout(() => {
				hintManager.reset();
				hintManager.initialize(
					globalState.trainHintAlgorithm,
					twistyAlgViewerLoaded,
					algViewerContainer
				);
			}, 50);
		}
	});

	onMount(() => {
		// console.log('TrainView mounted');
		if (!trainSettingsManager.areTrainSettingsUnchanged()) {
			// console.log('Train settings changed, regenerating train case queue');
			regenerateTrainCaseQueue();
		}
		return () => {
			// console.log('TrainView unmounted, saving train settings');
			trainSettingsManager.saveTrainSettings();
		};
	});

	let settingsRef = $state<Settings>();
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

{#if currentTrainCase && getNumberOfSelectedCases() > 0}
	<ResponsiveLayout>
		{#snippet leftContent()}
			<div class="my-2 flex items-center justify-center gap-0 sm:gap-2 md:my-4 md:gap-4">
				<Button
					class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
					type="button"
					onclick={onPrevious}><ArrowLeft class="size-8 text-primary-600 md:size-12" /></Button
				>
				<div class="min-w-48 text-center font-mono text-2xl font-semibold md:text-3xl">
					{scramble}
				</div>
				<Button
					class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
					type="button"
					onclick={onNext}><ArrowRight class="size-8 text-primary-600 md:size-12" /></Button
				>
			</div>

			<div
				class="relative mx-auto size-60 md:size-80"
				onpointerdowncapture={() => {
					globalState.hasUsedTwistyPlayer = true;
				}}
			>
				<TwistyPlayer
					bind:this={twistyPlayerRef}
					bind:scramble
					bind:alg
					bind:hidePlayer={globalState.trainHideTwistyPlayer}
					groupId={currentTrainCase.groupId}
					caseId={currentTrainCase.caseId}
					algorithmSelection={currentAlgorithmSelection}
					auf={currentTrainCase.auf}
					side={currentTrainCase.side}
					crossColor={currentTrainCase.crossColor}
					frontColor={currentTrainCase.frontColor}
					scrambleSelection={currentTrainCase.scramble}
					stickering={globalState.trainHintStickering}
					experimentalDragInput="auto"
					class="size-full"
					controlPanel="bottom-row"
					onclick={onNext}
					showVisibilityToggle={true}
				/>
				{#if !globalState.hasUsedTwistyPlayer}
					<Pointer
						class="pointer-events-none absolute top-1/2 left-1/2 z-50 size-15 -translate-x-1/2 -translate-y-1/2 animate-bounce text-primary-600"
					/>
				{/if}
			</div>

			<HintButton
				{alg}
				bind:algViewerContainer
				showAlgViewer={hintManager.showAlgViewer}
				visible={hintManager.showHintButton}
				hintCounter={hintManager.counter}
				hintMode={globalState.trainHintAlgorithm}
				onclick={showHintAlg}
				onEditAlg={() => {
					editAlgRef?.openModal();
				}}
			/>
			{#if globalState.trainShowTimer}
				<Timer bind:this={timerRef} onStop={handleTimerStop} initialTime={displayTime} />
			{/if}

			<div class="flex flex-row justify-center gap-2">
				<TrainStateSelect />

				<Button onclick={() => settingsRef?.openModal()}
					>{getNumberOfSelectedCases()} cases selected</Button
				>
			</div>

			<Details />

			<Settings bind:this={settingsRef} />

			<EditAlg
				bind:this={editAlgRef}
				groupId={currentTrainCase.groupId}
				caseId={currentTrainCase.caseId}
				side={currentTrainCase.side}
			/>
		{/snippet}
	</ResponsiveLayout>
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}
