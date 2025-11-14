<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import {
		casesState,
		getCaseBorderClass,
		getCaseName,
		getCaseTextClass,
		TrainStateColors
	} from '$lib/casesState.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import EditAlg from '../Modals/EditAlgModal.svelte';
	import { type Side, OPPOSITE_SIDE } from '$lib/types/Side';
	import { Button } from 'flowbite-svelte';
	import { Ellipsis } from '@lucide/svelte';

	let editAlgRef: EditAlg;
	let twistyPlayerRef: any;
	let scramble = $state('');
	let alg = $state('');

	let {
		groupId,
		caseId
	}: {
		groupId: GroupId;
		caseId: CaseId;
	} = $props();

	let side = $state<Side>('right');

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

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
	class="group relative flex w-full items-center rounded-2xl border-2 transition-shadow hover:shadow-xl {getCaseBorderClass(
		caseState.trainState
	)}"
	style="background-color: {TrainStateColors[caseState.trainState]};"
>
	<span class="font-arial px-1 md:text-lg {getCaseTextClass(caseState.trainState)}">
		{getCaseName(staticData)}
	</span>
	<TwistyPlayer
		bind:this={twistyPlayerRef}
		bind:scramble
		bind:alg
		{groupId}
		{caseId}
		algorithmSelection={caseState.algorithmSelection}
		{side}
		{crossColor}
		{frontColor}
		controlPanel="none"
	/>
	<span
		class="font-arial flex-1 px-2 text-center font-bold text-pretty md:text-lg {getCaseTextClass(
			caseState.trainState
		)}"
	>
		{alg}
	</span>
	<Button
		class="pointer-events-none absolute top-1 right-1 z-10 bg-transparent p-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-transparent focus:pointer-events-auto focus:bg-transparent focus:opacity-100 focus:ring-2 focus:ring-primary-600 focus:outline-none sm:top-0 sm:right-0 dark:bg-transparent dark:hover:bg-transparent"
		type="button"
		onclick={handleEditAlgClick}><Ellipsis class="size-6 text-primary-600 md:size-7" /></Button
	>
	<!-- 	<div class="flex flex-col gap-1">
		<Button onclick={handleMirrorClick}>Mirror</Button>
		<Button onclick={handleEditAlgClick}>Edit Algorithm</Button>
		<Button onclick={handleJumpToStartClick}>Jump to Start</Button>
		<Button onclick={handleJumpToEndClick}>Jump to End</Button>
		<Button onclick={handlePlayClick}>Play</Button>
		<Button onclick={handlePauseClick}>Pause</Button>
		<Button onclick={handleTogglePlayClick}>Toggle Play</Button>
	</div> -->
</button>

<EditAlg bind:this={editAlgRef} {groupId} {caseId} {side} />

<!-- </Button> -->
