<script lang="ts">
	import TrainCase, { gernerateTrainCases } from '$lib/trainCases';
	import type { Side } from '$lib/types/casesStatic';
	import type { GroupId } from '$lib/types/group';
	import type { StickerColor, StickerHidden } from '$lib/types/stickering';
	import { Button } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { advanceToNextTrainCase, trainState } from '$lib/trainCaseQueue.svelte';

	const groupId: GroupId = 'basic';
	const caseId = 4;
	const side: Side = 'right';
	const crossColor: StickerColor | 'random' = 'random';
	const frontColor: StickerColor | 'random' = 'random';
	const stickerHidden: StickerHidden = undefined;

	const trainCase = new TrainCase(groupId, caseId, side, crossColor, frontColor, stickerHidden);
	let currentTrainCase = $state(trainState.current);
	$effect(() => {
		console.log('Current Train Case:', trainState.current);
		currentTrainCase = trainState.current;
	});
</script>

<h2>Scramble Case {caseId}</h2>
<span>{trainCase.scramble}</span>
<h2>Algorithm</h2>
<span>{trainCase.alg}</span>

<Button onclick={advanceToNextTrainCase}>Previous</Button>
<Button onclick={advanceToNextTrainCase}>Next</Button>

<TwistyPlayer
	alg={currentTrainCase.alg}
	setupAlg={currentTrainCase.scramble}
	experimentalDragInput="auto"
	size={80}
	controlPanel="bottom-row"
/>
