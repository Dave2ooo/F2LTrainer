
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
	import Settings from '$lib/components/Modals/Settings.svelte';
	import { trainSettingsManager } from '$lib/utils/trainSettings';
	import EditAlg from '$lib/components/Modals/EditAlgModal.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import HintButton from './HintButton.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import { createHintManager } from '$lib/utils/hintManager.svelte';
	import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Details from './Details.svelte';
	import TrainStateSelect from './TrainStateSelect.svelte';
	import Timer from './Timer.svelte';
	import { createKeyboardHandlers } from './trainViewEventHandlers.svelte';
	import { Splitpanes, Pane } from 'svelte-splitpanes';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let editAlgRef = $state<EditAlg>();
	let timerRef = $state<Timer>();

	let twistyPlayerRef = $state<any>();
	let algViewerContainer = $state<HTMLElement>();
	let twistyAlgViewerLoaded = $state(false);

	let scramble = $state('');
	let alg = $state('');

	// Create hint manager instance
	const hintManager = createHintManager();

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

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

	async function onNext() {
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

	// Create keyboard event handlers
	const { handleKeydown, handleKeyup } = createKeyboardHandlers(() => timerRef, onNext);

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

	let isRightPaneOpen = $state(false);

	function toggleRightPane() {
		isRightPaneOpen = !isRightPaneOpen;
	}
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />




{#if currentTrainCase}
	<div class="relative h-[calc(100vh-100px)] w-full">
		<Splitpanes style="height: 100%">
			<Pane minSize={20} size={isRightPaneOpen ? 50 : 100}>
				<div class="flex h-full flex-col overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800">
					<!-- ... (existing left pane content) ... -->
					<div class="my-4 flex items-center justify-center gap-0 sm:gap-2 md:gap-4">
						<Button
							class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
							type="button"
							onclick={onPrevious}
							><ArrowLeft class="size-8 text-primary-600 md:size-12" /></Button
						>
						<div class="min-w-48 text-center font-mono text-2xl font-semibold md:text-3xl">
							{scramble}
						</div>
						<Button
							class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
							type="button"
							onclick={onNext}
							><ArrowRight class="size-8 text-primary-600 md:size-12" /></Button
						>
					</div>

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
						stickering={globalState.trainHintStickering}
						experimentalDragInput="auto"
						class="size-60 md:size-80"
						controlPanel="bottom-row"
						onclick={onNext}
						showVisibilityToggle={true}
					/>

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
						<Timer bind:this={timerRef} onStop={onNext} />
					{/if}
					<TrainStateSelect />

					<Button onclick={() => settingsRef?.openModal()}
						>{getNumberOfSelectedCases()} cases selected</Button
					>

					<Settings bind:this={settingsRef} />

					<EditAlg
						bind:this={editAlgRef}
						groupId={currentTrainCase.groupId}
						caseId={currentTrainCase.caseId}
						side={currentTrainCase.side}
					/>

					<Details />
				</div>
			</Pane>

			{#if isRightPaneOpen}
				<Pane minSize={20} size={50}>
					<div class="relative flex h-full items-center justify-center bg-gray-50 dark:bg-gray-800">
						<button
							class="absolute -left-3 top-1/2 z-50 flex h-12 w-6 -translate-y-1/2 translate-x-3 items-center justify-center rounded-r-lg border border-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
							onclick={toggleRightPane}
							aria-label="Collapse right pane"
						>
							<ChevronRight class="size-4 text-gray-500 dark:text-gray-400" />
						</button>
						<P class="text-gray-500">Right Pane Content</P>
					</div>
				</Pane>
			{/if}
		</Splitpanes>

		{#if !isRightPaneOpen}
			<button
				class="absolute right-0 top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg border border-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
				onclick={toggleRightPane}
				aria-label="Expand right pane"
			>
				<ChevronLeft class="size-4 text-gray-500 dark:text-gray-400" />
			</button>
		{/if}
	</div>
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}
