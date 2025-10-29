<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { casesState, getCaseAlg, getCaseName, TrainStateColors } from '$lib/casesState.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { Button, Sidebar } from 'flowbite-svelte';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import EditAlg from '../Modals/EditAlgModal.svelte';
	import { type Side, OPPOSITE_SIDE } from '$lib/types/Side';

	let editAlgRef: EditAlg;
	let twistyPlayerRef: any;

	let {
		groupId,
		caseId
	}: {
		groupId: GroupId;
		caseId: CaseId;
	} = $props();

	let side = $state<Side>('right');

	const CAMERA_ANGLE = { right: 25, left: -25 };

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const selectedAlgRight = $derived(
		getCaseAlg(staticData, caseState.algorithmSelection, caseState.customAlgorithm, 'right')
	);
	const selectedAlgLeft = $derived(
		getCaseAlg(staticData, caseState.algorithmSelection, caseState.customAlgorithm, 'left')
	);

	const alg = $derived(side === 'left' ? selectedAlgLeft : selectedAlgRight);

	const setupAlg = $derived(
		side === 'left' ? mirrorAlg(staticData.scramblePool[0]) : staticData.scramblePool[0]
	);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

	let stickeringString = $derived(
		getStickeringString(crossColor, frontColor, staticData.pieceToHide, side)
	);
	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));
	const cameraLongitude = $derived(CAMERA_ANGLE[side]);

	function cycleTrainStates() {
		const currentIndex = TRAIN_STATES.indexOf(caseState.trainState);
		// Move to next state, wrap to 0 if at end
		const nextIndex = (currentIndex + 1) % TRAIN_STATES.length;
		caseState.trainState = TRAIN_STATES[nextIndex];
	}

	function handleJumpToStart() {
		if (twistyPlayerRef) {
			twistyPlayerRef.jumpToStart();
		}
	}

	function handleJumpToEnd() {
		if (twistyPlayerRef) {
			twistyPlayerRef.jumpToEnd();
		}
	}

	function handlePlay() {
		if (twistyPlayerRef) {
			twistyPlayerRef.play();
		}
	}

	function handlePause() {
		if (twistyPlayerRef) {
			twistyPlayerRef.pause();
		}
	}

	function handleTogglePlay() {
		if (twistyPlayerRef) {
			twistyPlayerRef.togglePlay();
		}
	}

	function handleJumpToStartClick(e: MouseEvent) {
		e.stopPropagation();
		handleJumpToStart();
	}

	function handleJumpToEndClick(e: MouseEvent) {
		e.stopPropagation();
		handleJumpToEnd();
	}

	function handlePlayClick(e: MouseEvent) {
		e.stopPropagation();
		handlePlay();
	}

	function handlePauseClick(e: MouseEvent) {
		e.stopPropagation();
		handlePause();
	}

	function handleTogglePlayClick(e: MouseEvent) {
		e.stopPropagation();
		handleTogglePlay();
	}

	function handleMirrorClick(e: MouseEvent) {
		e.stopPropagation();
		side = OPPOSITE_SIDE[side];
	}

	function handleEditAlgClick(e: MouseEvent) {
		e.stopPropagation();
		editAlgRef.openModal();
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
	<TwistyPlayer
		bind:this={twistyPlayerRef}
		{alg}
		{setupRotation}
		{setupAlg}
		{stickeringString}
		{cameraLongitude}
		controlPanel="bottom-row"
	/>
	<span> {alg} </span>
	<div class="flex flex-col gap-1">
		<Button onclick={handleMirrorClick}>Mirror</Button>
		<Button onclick={handleEditAlgClick}>Edit Algorithm</Button>
		<Button onclick={handleJumpToStartClick}>Jump to Start</Button>
		<Button onclick={handleJumpToEndClick}>Jump to End</Button>
		<Button onclick={handlePlayClick}>Play</Button>
		<Button onclick={handlePauseClick}>Pause</Button>
		<Button onclick={handleTogglePlayClick}>Toggle Play</Button>
	</div>
</button>

<EditAlg bind:this={editAlgRef} {groupId} {caseId} {side} />

<!-- </Button> -->
