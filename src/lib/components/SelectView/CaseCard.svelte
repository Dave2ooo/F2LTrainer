<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { casesState, getCaseAlg, getCaseName, TrainStateColors } from '$lib/casesState.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { Button } from 'flowbite-svelte';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import EditAlg from '../Modals/EditAlgModal.svelte';

	let editAlgRef: EditAlg;

	let {
		groupId,
		caseId
	}: {
		groupId: GroupId;
		caseId: CaseId;
	} = $props();

	let mirrored = $state(false);

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const selectedAlgRight = $derived(
		getCaseAlg(staticData, caseState.algorithmSelection, caseState.customAlgorithm, 'right')
	);
	const selectedAlgLeft = $derived(
		getCaseAlg(staticData, caseState.algorithmSelection, caseState.customAlgorithm, 'left')
	);

	const alg = $derived(mirrored ? mirrorAlg(selectedAlgLeft) : selectedAlgRight);

	const setupAlg = $derived(
		mirrored ? mirrorAlg(staticData.scramblePool[0]) : staticData.scramblePool[0]
	);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

	let stickeringString = $derived(
		getStickeringString(crossColor, frontColor, staticData.pieceToHide, mirrored)
	);
	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));
	const cameraLongitude = $derived(mirrored ? -25 : 25);

	function cycleTrainStates() {
		const currentIndex = TRAIN_STATES.indexOf(caseState.trainState);
		// Move to next state, wrap to 0 if at end
		const nextIndex = (currentIndex + 1) % TRAIN_STATES.length;
		caseState.trainState = TRAIN_STATES[nextIndex];
	}
</script>

<!-- <Button outline onclick={toggleLearningState} class="flex items-center"> -->
<button
	type="button"
	onclick={cycleTrainStates}
	class="flex items-center rounded-2xl border-2 outline-1 transition-shadow hover:shadow-xl"
	style="background-color: {TrainStateColors[caseState.trainState]};"
>
	<span> {getCaseName(staticData)} </span>
	<TwistyPlayer {alg} {setupRotation} {setupAlg} {stickeringString} {cameraLongitude} />
	<span> {alg} </span>
	<div class="flex flex-col gap-1">
		<Button onclick={() => (mirrored = !mirrored)}>Mirror</Button>
		<Button onclick={() => editAlgRef.openModal()}>Edit Algorithm</Button>
	</div>
</button>

<EditAlg bind:this={editAlgRef} {groupId} {caseId} />

<!-- </Button> -->
