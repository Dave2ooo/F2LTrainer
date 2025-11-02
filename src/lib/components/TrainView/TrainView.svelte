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
	import getStickeringString from '$lib/stickering';
	import { casesStatic } from '$lib/casesStatic';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let editAlgRef = $state<EditAlg>();

	let twistyPlayerRef = $state<any>();
	let algViewerContainer = $state<HTMLElement>();
	let twistyAlgViewerLoaded = $state(false);

	let scramble = $state('');
	let alg = $state('');

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
	<h2>Group: {currentTrainCase.groupId}, Case: {currentTrainCase.caseId}</h2>
	<span>{scramble}</span>
	<h2>Algorithm</h2>
	<div bind:this={algViewerContainer}></div>
	{#if !twistyAlgViewerLoaded}
		<span>{alg}</span>
	{/if}

	<Button onclick={advanceToPreviousTrainCase}>Previous</Button>
	<Button onclick={onNext}>Next</Button>

	<TwistyPlayer
		bind:this={twistyPlayerRef}
		bind:scramble
		bind:alg
		groupId={currentTrainCase.groupId}
		caseId={currentTrainCase.caseId}
		algorithmSelection={currentAlgorithmSelection}
		side={currentTrainCase.side}
		crossColor={currentTrainCase.crossColor}
		frontColor={currentTrainCase.frontColor}
		experimentalDragInput="auto"
		size={80}
		controlPanel="bottom-row"
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

	<Button
		onclick={() => {
			editAlgRef?.openModal();
		}}>Edit Algorithm</Button
	>
	<EditAlg
		bind:this={editAlgRef}
		groupId={currentTrainCase.groupId}
		caseId={currentTrainCase.caseId}
		side={currentTrainCase.side}
	/>
{:else}
	<P>No training cases available. Please select some cases first.</P>
{/if}
