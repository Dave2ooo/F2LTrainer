<script lang="ts">
	import { Button, Select } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, onMount } from 'svelte';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import { casesState } from '$lib/casesState.svelte';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let twistyPlayerRef: any;
	let algViewerContainer: HTMLElement;
	let twistyAlgViewerLoaded = $state(false);

	// local reactive mirror of the global state.current
	let currentTrainCase = $derived(trainState.current);

	async function onNext() {
		advanceToNextTrainCase();
		// wait for state/DOM to settle so TwistyPlayer receives the new props
		await tick();
		twistyPlayerRef?.jumpToStart();
		twistyPlayerRef?.resetView();
	}

	function handleKeydown(event: KeyboardEvent) {
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
				console.log('TwistyAlgViewer loaded successfully');
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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if currentTrainCase}
	<h2>Group: {currentTrainCase.groupId}, Case: {currentTrainCase.caseId}</h2>
	<span>{currentTrainCase.scramble}</span>
	<h2>Algorithm</h2>
	<div bind:this={algViewerContainer}></div>
	{#if !twistyAlgViewerLoaded}
		<span>{currentTrainCase.alg}</span>
	{/if}

	<Button onclick={advanceToPreviousTrainCase}>Previous</Button>
	<Button onclick={onNext}>Next</Button>

	<TwistyPlayer
		bind:this={twistyPlayerRef}
		alg={currentTrainCase.alg}
		setupAlg={currentTrainCase.scramble}
		experimentalDragInput="auto"
		size={80}
		controlPanel="bottom-row"
	/>
	<Select
		bind:value={casesState[currentTrainCase.groupId][currentTrainCase.caseId].trainState}
		placeholder=""
	>
		{#each TRAIN_STATES as trainState}
			<option value={trainState}>{trainState}</option>
		{/each}
	</Select>
{:else}
	<p>No training cases available. Please select some cases first.</p>
{/if}
