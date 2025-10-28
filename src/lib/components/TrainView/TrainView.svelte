<script lang="ts">
	import { Button, Label, Select } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick, onMount } from 'svelte';
	import { casesState } from '$lib/casesState.svelte';
	import { TRAIN_STATES, type TrainState } from '$lib/types/caseState';

	// Delay in ms to ensure TwistyPlayer is fully initialized before attaching AlgViewer
	const TWISTY_PLAYER_INIT_DELAY = 100;

	let twistyPlayerRef: any;
	let algViewerContainer: HTMLElement;
	let twistyAlgViewerLoaded = $state(false);

	// local reactive mirror of the global state.current
	let currentTrainCase = $state(trainState.current);

	// Get the current case state to manage train state
	let currentCaseTrainState = $derived(
		currentTrainCase?.groupId && currentTrainCase?.caseId
			? casesState[currentTrainCase.groupId]?.[currentTrainCase.caseId]?.trainState || 'unlearned'
			: 'unlearned'
	);

	$effect(() => {
		// optional debug: comment out in production
		// console.log('Current Train Case:', trainState.current);
		currentTrainCase = trainState.current;
	});

	function handleTrainStateChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newTrainState = target.value as TrainState;
		if (!currentTrainCase?.groupId || !currentTrainCase?.caseId) return;
		const caseState = casesState[currentTrainCase.groupId]?.[currentTrainCase.caseId];
		if (caseState) {
			caseState.trainState = newTrainState;
		}
	}

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

<h2>Group: {currentTrainCase?.groupId}, Case: {currentTrainCase?.caseId}</h2>
<span>{currentTrainCase?.scramble}</span>
{#if currentTrainCase?.groupId && currentTrainCase?.caseId}
	<div class="my-4">
		<Label for="trainState" class="mb-2 block">Train State</Label>
		<Select id="trainState" value={currentCaseTrainState} onchange={handleTrainStateChange}>
			{#each TRAIN_STATES as state (state)}
				<option value={state}>
					{state.charAt(0).toUpperCase() + state.slice(1)}
				</option>
			{/each}
		</Select>
	</div>
{/if}
<h2>Algorithm</h2>
<div bind:this={algViewerContainer}></div>
{#if !twistyAlgViewerLoaded}
	<span>{currentTrainCase?.alg}</span>
{/if}

<Button onclick={advanceToPreviousTrainCase}>Previous</Button>
<Button onclick={onNext}>Next</Button>

<TwistyPlayer
	bind:this={twistyPlayerRef}
	alg={currentTrainCase?.alg}
	setupAlg={currentTrainCase.scramble}
	experimentalDragInput="auto"
	size={80}
	controlPanel="bottom-row"
/>
