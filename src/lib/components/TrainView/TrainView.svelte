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
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import Details from './Details.svelte';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let editAlgRef = $state<EditAlg>();

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

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle keyboard shortcuts if user is typing or modal is open
		const activeElement = document.activeElement;
		const isTyping =
			activeElement?.tagName === 'INPUT' ||
			activeElement?.tagName === 'TEXTAREA' ||
			activeElement?.hasAttribute('contenteditable') ||
			document.querySelector('.modal[style*="display: block"]') !== null;

		if (isTyping) {
			return;
		}

		if (event.code === 'Space') {
			event.preventDefault();
			onNext();
		}
	}

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

<svelte:window onkeydown={handleKeydown} />

{#if currentTrainCase}
	<div class="my-4 flex items-center justify-center gap-0 sm:gap-2 md:gap-4">
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

	<!-- Use responsive CSS classes — if `class` is provided, TwistyPlayer will
	use the CSS size instead of the numeric `size` prop. Tune these values
	to match your layout (Tailwind arbitrary values are used here). -->

	<TwistyPlayer
		bind:this={twistyPlayerRef}
		bind:scramble
		bind:alg
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

	<Select
		bind:value={casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState}
		style="background: {TrainStateColors[currentTrainCaseTrainState]}; color: {TrainStateTextColors[
			currentTrainCaseTrainState
		]}"
		placeholder=""
	>
		{#each TRAIN_STATES as trainState}
			<option
				value={trainState}
				style="background: {TrainStateColors[trainState]}; color: {TrainStateTextColors[
					trainState
				]}">{trainState}</option
			>
		{/each}
	</Select>

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
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}
