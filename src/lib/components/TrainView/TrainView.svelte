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
	import HintButton from './HintButton.svelte';
	import { globalState } from '$lib/globalState.svelte';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let editAlgRef = $state<EditAlg>();

	let twistyPlayerRef = $state<any>();
	let algViewerContainer = $state<HTMLElement>();
	let twistyAlgViewerLoaded = $state(false);

	let scramble = $state('');
	let alg = $state('');
	let hintCounter = $state(-1);
	
	// Control visibility of the algorithm viewer container and hint button
	let showAlgViewer = $state(false);
	let showHintButton = $state(false);

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
		hintCounter = -1;
		// Wait for next tick to ensure DOM is updated
		await tick();
		showHintAlg();
	}

	async function onPrevious() {
		advanceToPreviousTrainCase();
		hintCounter = -1;
		// Wait for next tick to ensure DOM is updated
		await tick();
		showHintAlg();
	}

	function showHintAlg() {
		const algViewerElement = algViewerContainer?.querySelector('twisty-alg-viewer');
		const algMoveElements = algViewerElement?.querySelectorAll('.twisty-alg-move');

		// If hintCounter is -1, this is initialization (when case loads)
		if (hintCounter === -1) {
			if (twistyAlgViewerLoaded && algMoveElements) {
				if (globalState.trainHintAlgorithm === 'always') {
					// "Show all time" - make all moves visible
					algMoveElements.forEach((element: Element) => {
						(element as HTMLElement).style.visibility = 'visible';
					});
					showAlgViewer = true;
					showHintButton = false;
				} else {
					// "step" or "allAtOnce" - hide all moves initially and show placeholder
					algMoveElements.forEach((element: Element) => {
						(element as HTMLElement).style.visibility = 'hidden';
					});
					showAlgViewer = false;
					showHintButton = true;
				}
			} else {
				// TwistyAlgViewer not loaded, use HintButton for display
				showAlgViewer = false;
				showHintButton = true;
			}
			return;
		}

		// hintCounter >= 0 means user clicked the hint button
		// Do nothing if mode is "always" (already visible)
		if (globalState.trainHintAlgorithm === 'always') return;

		// Get algorithm and convert to list
		const algList = alg.split(' ').filter(move => move.trim() !== '');

		if (twistyAlgViewerLoaded && algMoveElements) {
			// Show the AlgViewer and hide the HintButton
			showAlgViewer = true;
			showHintButton = false;
			
			if (globalState.trainHintAlgorithm === 'step') {
				// "Reveal step-by-step"
				// Hide all moves if hintCounter is 0
				if (hintCounter === 0) {
					algMoveElements.forEach((element: Element) => {
						(element as HTMLElement).style.visibility = 'hidden';
					});
				}

				// Show one move at a time
				const maxViewerMoves = algMoveElements.length;
				const maxMoves = Math.max(algList.length, maxViewerMoves);
				if (hintCounter < maxMoves && algMoveElements[hintCounter]) {
					(algMoveElements[hintCounter] as HTMLElement).style.visibility = 'visible';
					hintCounter++;
				}
			} else if (globalState.trainHintAlgorithm === 'allAtOnce') {
				// "Reveal all at once"
				algMoveElements.forEach((element: Element) => {
					(element as HTMLElement).style.visibility = 'visible';
				});
				hintCounter++;
			}
		} else {
			// TwistyAlgViewer not loaded, continue to use HintButton
			// The HintButton component will handle the display internally
			showAlgViewer = false;
			showHintButton = true;
			hintCounter++;
		}
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
				hintCounter = -1;
				showHintAlg();
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
	<h2>Group: {currentTrainCase.groupId}, Case: {currentTrainCase.caseId}</h2>
	<span>{scramble}</span>
	<h2>Algorithm</h2>
	<div bind:this={algViewerContainer} style:display={showAlgViewer ? 'block' : 'none'}></div>
	<HintButton 
		{alg} 
		visible={showHintButton}
		{hintCounter}
		hintMode={globalState.trainHintAlgorithm}
		onclick={showHintAlg}
	/>

	<Button onclick={onPrevious}>Previous</Button>
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
