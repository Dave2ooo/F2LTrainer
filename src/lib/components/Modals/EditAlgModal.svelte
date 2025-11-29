<script lang="ts">
	import { GROUP_DEFINITIONS, type CaseId, type GroupId } from '$lib/types/group';
	import { Checkbox, Button } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import ToggleSwitch from '../ToggleSwitch.svelte';
	import { casesState } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { globalState } from '$lib/globalState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import EditAlgListGroup from './EditAlgListGroup.svelte';
	import type { Side } from '$lib/types/Side';
	import { syncAlgorithms } from '$lib/utils/syncAlgorithms';
	import Update from './Buttons/Update.svelte';

	let twistyPlayerRightRef: any = $state();
	let twistyPlayerLeftRef: any = $state();

	// Track pending timeouts so we can clear them if a new animation is requested
	let animationTimeouts: { left?: any; right?: any } = {};

	let { groupId, caseId, side }: { groupId: GroupId; caseId: CaseId; side: Side } = $props();

	let open = $state(false);
	let selectedTab: Side = $state(side);

	export function openModal() {
		open = true;
		selectedTab = side; // Add this line
		// Reset working state when modal opens
		workingState = {
			algorithmSelection: {
				right: caseState.algorithmSelection.right,
				left: caseState.algorithmSelection.left
			},
			customAlgorithm: {
				right: caseState.customAlgorithm.right,
				left: caseState.customAlgorithm.left
			},
			identicalAlgorithm: caseState.identicalAlgorithm
		};
	}

	let onSelectionChange = (algorithmSelection: number | null, side: Side) => {
		// console.log('Selection ' + side + ' changed to ', algorithmSelection);
		workingState.algorithmSelection[side] = algorithmSelection;
		if (workingState.identicalAlgorithm) {
			[workingState.algorithmSelection, workingState.customAlgorithm] = syncAlgorithms(
				workingState.algorithmSelection,
				workingState.customAlgorithm,
				selectedTab
			);
		}
		animateTwistyPlayer(side);
	};

	function animateTwistyPlayer(side: Side) {
		const twistyPlayerRef = side === 'left' ? twistyPlayerLeftRef : twistyPlayerRightRef;

		if (!globalState.playOnAlgChange) return;

		// Clear any previously scheduled play for this side
		if (animationTimeouts[side]) {
			clearTimeout(animationTimeouts[side]);
			animationTimeouts[side] = null;
		}

		// Schedule play after 500ms
		animationTimeouts[side] = setTimeout(() => {
			twistyPlayerRef.play();
			animationTimeouts[side] = null;
		}, 200);

		// Return a cleanup function (not strictly required if not used elsewhere)
		return () => {
			if (animationTimeouts[side]) {
				clearTimeout(animationTimeouts[side]);
				animationTimeouts[side] = null;
			}
		};
	}

	let onCustomAlgChange = (customAlgorithm: string, side: Side) => {
		// console.log('Custom Alg ' + side + ' changed to ', customAlgorithm);
		workingState.customAlgorithm[side] = customAlgorithm;
	};

	const title = GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId;

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	let workingState = $state({
		algorithmSelection: {
			right: caseState.algorithmSelection.right,
			left: caseState.algorithmSelection.left
		},
		customAlgorithm: {
			right: caseState.customAlgorithm.right,
			left: caseState.customAlgorithm.left
		},
		identicalAlgorithm: caseState.identicalAlgorithm
	});

	// $inspect(workingState);

	$effect(() => {
		// Sync algorithms when identicalAlgorithm changes to true
		if (workingState.identicalAlgorithm) {
			[workingState.algorithmSelection, workingState.customAlgorithm] = syncAlgorithms(
				workingState.algorithmSelection,
				workingState.customAlgorithm,
				selectedTab
			);
		}
	});

	function onConfirm() {
		// Copy workingState back to casesState
		caseState.algorithmSelection.right = workingState.algorithmSelection.right;
		caseState.algorithmSelection.left = workingState.algorithmSelection.left;
		caseState.customAlgorithm.right = workingState.customAlgorithm.right;
		caseState.customAlgorithm.left = workingState.customAlgorithm.left;
		caseState.identicalAlgorithm = workingState.identicalAlgorithm;

		// Trigger reactivity by reassigning the entire casesState object
		casesState[groupId][caseId] = { ...caseState };

		// console.log('Updated caseState:', $state.snapshot(caseState));
		open = false;
	}

	function onCancel() {
		// Discard changes by closing the modal without updating casesState
		open = false;
	}

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);

	const controlPanel = 'bottom-row';
	const experimentalDragInput = 'auto';
</script>

<Modal bind:open {title} size="sm" outsideclose={true} autoclose={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onConfirm();
		}}
	>
		{#if selectedTab === 'left'}
			<TwistyPlayer
				bind:this={twistyPlayerLeftRef}
				{groupId}
				{caseId}
				algorithmSelection={workingState.algorithmSelection}
				customAlgorithm={workingState.customAlgorithm}
				side="left"
				{crossColor}
				{frontColor}
				{controlPanel}
				{experimentalDragInput}
				class="size-50 md:size-70"
			/>
		{:else}
			<TwistyPlayer
				bind:this={twistyPlayerRightRef}
				{groupId}
				{caseId}
				algorithmSelection={workingState.algorithmSelection}
				customAlgorithm={workingState.customAlgorithm}
				side="right"
				{crossColor}
				{frontColor}
				{controlPanel}
				{experimentalDragInput}
				class="size-50 md:size-70"
			/>
		{/if}
		<Checkbox bind:checked={globalState.playOnAlgChange}
			><span class="m-1 md:text-lg">Autoplay</span></Checkbox
		>
		<div class="flex justify-center">
			<ToggleSwitch bind:selected={selectedTab} leftLabel="Left" rightLabel="Right" />
		</div>

		{#if selectedTab === 'left'}
			<EditAlgListGroup
				{groupId}
				{caseId}
				side="left"
				algorithmSelectionInitial={workingState.algorithmSelection}
				customAlgInitial={workingState.customAlgorithm}
				{onSelectionChange}
				{onCustomAlgChange}
			/>
		{:else}
			<EditAlgListGroup
				{groupId}
				{caseId}
				side="right"
				algorithmSelectionInitial={workingState.algorithmSelection}
				customAlgInitial={workingState.customAlgorithm}
				{onSelectionChange}
				{onCustomAlgChange}
			/>
		{/if}

		<Checkbox bind:checked={workingState.identicalAlgorithm}
			><span class="m-1 md:text-lg">Same Algorithm for Left and Right slot (mirrored)</span
			></Checkbox
		>

		<Update {onCancel} />
	</form>
</Modal>
