<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { tick } from 'svelte';

	let twistyPlayerRef: any;

	// local reactive mirror of the global state.current
	let currentTrainCase = $state(trainState.current);

	$effect(() => {
		// optional debug: comment out in production
		// console.log('Current Train Case:', trainState.current);
		currentTrainCase = trainState.current;
	});

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
</script>

<svelte:window onkeydown={handleKeydown} />

<h2>Group: {currentTrainCase.groupId}, Case: {currentTrainCase.caseId}</h2>
<span>{currentTrainCase.scramble}</span>
<h2>Algorithm</h2>
<span>{currentTrainCase.alg}</span>

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
