<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		trainState
	} from '$lib/trainCaseQueue.svelte';

	// local reactive mirror of the global state.current
	let currentTrainCase = $state(trainState.current);

	$effect(() => {
		// optional debug: comment out in production
		// console.log('Current Train Case:', trainState.current);
		currentTrainCase = trainState.current;
	});
</script>

<h2>Group: {currentTrainCase.groupId}, Case: {currentTrainCase.caseId}</h2>
<span>{currentTrainCase.scramble}</span>
<h2>Algorithm</h2>
<span>{currentTrainCase.alg}</span>

<Button onclick={advanceToPreviousTrainCase}>Previous</Button>
<Button onclick={advanceToNextTrainCase}>Next</Button>

<TwistyPlayer
	alg={currentTrainCase?.alg}
	setupAlg={currentTrainCase.scramble}
	experimentalDragInput="auto"
	size={80}
	controlPanel="bottom-row"
/>
