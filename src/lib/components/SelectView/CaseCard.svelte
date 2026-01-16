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
	import { sessionState, DEFAULT_SETTINGS } from '$lib/sessionState.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { TRAIN_STATES } from '$lib/types/caseState';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import EditAlg from '../Modals/EditAlgModal.svelte';
	import CaseStatsModal from '../Modals/CaseStatsModal.svelte';
	import { type Side, OPPOSITE_SIDE } from '$lib/types/Side';
	import { Button } from 'flowbite-svelte';
	import { Ellipsis, Pointer } from '@lucide/svelte';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { getSolvesForCase } from '$lib/utils/statistics';

	let editAlgRef: EditAlg;
	let caseStatsRef: CaseStatsModal;
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

	const safeCrossColor = $derived(
		Array.isArray(sessionState.activeSession?.settings.crossColor)
			? sessionState.activeSession.settings.crossColor
			: DEFAULT_SETTINGS.crossColor || ['white']
	);
	const safeFrontColor = $derived(
		Array.isArray(sessionState.activeSession?.settings.frontColor)
			? sessionState.activeSession.settings.frontColor
			: DEFAULT_SETTINGS.frontColor || ['red']
	);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(safeCrossColor as any, safeFrontColor as any)
	);

	const caseSolves = $derived(getSolvesForCase(statisticsState.allSolves, groupId, caseId));
	const solveCount = $derived(caseSolves.length);

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

	function handleEditAlgClick(e: MouseEvent) {
		e.stopPropagation();
		editAlgRef.openModal();
	}

	function handleStatsClick(e: MouseEvent) {
		e.stopPropagation();
		caseStatsRef.openModal();
	}
</script>

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
	<div
		class="relative size-21 md:size-25 2xl:size-30"
		onpointerdowncapture={() => {
			globalState.hasClickedCaseCard = true;
		}}
	>
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
			class="size-full"
		/>
		{#if !globalState.hasClickedCaseCard && groupId === 'basic' && caseId === 4}
			<Pointer
				class="pointer-events-none absolute top-3/4 left-1/2 z-50 size-8 -translate-x-1/2 -translate-y-1/2 animate-bounce text-primary-600"
			/>
		{/if}
	</div>
	<div
		class="relative flex flex-1 flex-col items-center justify-center self-stretch px-2 text-center font-bold text-pretty md:text-lg {getCaseTextClass(
			caseState.trainState
		)}"
	>
		<span class="font-arial">
			{alg}
		</span>
		{#if solveCount > 0}
			<!-- Visible absolute positioned stats -->
			<div
				class="absolute right-0 bottom-0 left-0 mb-1 flex justify-center gap-2 text-sm font-normal whitespace-nowrap"
			>
				<span
					role="button"
					tabindex="0"
					class="cursor-pointer opacity-90 hover:underline hover:opacity-100"
					onclick={handleStatsClick}
					onkeydown={(e) => e.key === 'Enter' && handleStatsClick(e as any)}
				>
					Solves: {solveCount}
				</span>
			</div>
		{/if}
	</div>
	<Button
		class="case-edit-btn absolute top-1 right-1 z-10 bg-transparent p-1 transition-opacity hover:bg-transparent focus:pointer-events-auto focus:bg-transparent focus:opacity-100 focus:ring-2 focus:ring-primary-600 focus:outline-none sm:top-0 sm:right-0 dark:bg-transparent dark:hover:bg-transparent"
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
<CaseStatsModal bind:this={caseStatsRef} {groupId} {caseId} />

<!-- </Button> -->

<style>
	/* Default: hide the edit button for non-touch devices */
	:global(.case-edit-btn) {
		opacity: 0;
		pointer-events: none;
		transition: opacity 150ms ease-in-out;
	}

	/* Show for touch devices (no hover or coarse pointer) */
	@media (hover: none), (pointer: coarse) {
		:global(.case-edit-btn) {
			opacity: 1;
			pointer-events: auto;
		}
	}

	/* Show for desktop / mouse users when hovering the parent group */
	@media (hover: hover) and (pointer: fine) {
		:global(.group:hover) :global(.case-edit-btn) {
			opacity: 1;
			pointer-events: auto;
		}
	}

	/* Allow keyboard focus to show the button even on non-touch devices */
	:global(.case-edit-btn:focus) {
		opacity: 1;
		pointer-events: auto;
	}
</style>
