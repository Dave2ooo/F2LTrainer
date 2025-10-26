<script lang="ts">
	import { GROUP_DEFINITIONS, type CaseId, type GroupId } from '$lib/types/group';
	import { Modal, Tabs, TabItem, Checkbox, Button } from 'flowbite-svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import { casesState, getCaseAlg } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { globalState } from '$lib/globalState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import getStickeringString from '$lib/stickering';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import getRotationAlg from '$lib/rotation';
	import EditAlgListGroup from './EditAlgListGroup.svelte';
	import type { Side } from '$lib/types/casesStatic';
	import { syncAlgorithms } from '$lib/utils/syncAlgorithms';

	let { groupId, caseId, mirrored }: { groupId: GroupId; caseId: CaseId; mirrored: boolean } =
		$props();

	let open = $state(false);
	let selectedTab: Side = $state('right');

	// $effect(() => {
	// 	if (open) selectedTab = mirrored ? 'left' : 'right';
	// 	selectedTab = selectedTab; // Needs to be here to make Svelte happy
	// });
	export function openModal() {
		open = true;
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
			workingState.algorithmSelection = syncAlgorithms(
				workingState.algorithmSelection,
				selectedTab
			);
		}
	};

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

	$inspect(workingState);

	$effect(() => {
		// Sync algorithms when identicalAlgorithm changes to true
		if (workingState.identicalAlgorithm) {
			workingState.algorithmSelection = syncAlgorithms(
				workingState.algorithmSelection,
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
		open = false;
	}

	function onCancel() {
		// Discard changes by closing the modal without updating casesState
		open = false;
	}
	let selectedAlgRight = $derived(
		getCaseAlg(staticData, workingState.algorithmSelection, workingState.customAlgorithm, 'right')
	);
	let selectedAlgLeft = $derived(
		getCaseAlg(staticData, workingState.algorithmSelection, workingState.customAlgorithm, 'left')
	);

	const setupAlgRight = $derived(staticData.scramblePool[0]);
	const setupAlgLeft = $derived(mirrorAlg(staticData.scramblePool[0]));

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(globalState.crossColor, globalState.frontColor)
	);
	const stickeringStringRight = $derived(
		getStickeringString(crossColor, frontColor, staticData.pieceToHide, false)
	);
	const stickeringStringLeft = $derived(
		getStickeringString(crossColor, frontColor, staticData.pieceToHide, true)
	);

	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));
	const cameraLongitudeRight = 25;
	const cameraLongitudeLeft = -25;

	const controlPanel = 'bottom-row';
	const experimentalDragInput = 'auto';
</script>

<Modal bind:open {title} size="md" outsideclose={true} autoclose={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onConfirm();
		}}
	>
		<Tabs bind:selected={selectedTab} tabStyle="underline">
			<TabItem key="left" title="Left">
				<TwistyPlayer
					alg={selectedAlgLeft}
					stickeringString={stickeringStringLeft}
					setupAlg={setupAlgLeft}
					{setupRotation}
					cameraLongitude={cameraLongitudeLeft}
					{controlPanel}
					{experimentalDragInput}
				/>
				<EditAlgListGroup
					{groupId}
					{caseId}
					side="left"
					algorithmSelectionInitial={workingState.algorithmSelection}
					customAlgInitial={workingState.customAlgorithm}
					{onSelectionChange}
					{onCustomAlgChange}
				/>
			</TabItem>

			<TabItem key="right" title="Right">
				<TwistyPlayer
					alg={selectedAlgRight}
					stickeringString={stickeringStringRight}
					setupAlg={setupAlgRight}
					{setupRotation}
					cameraLongitude={cameraLongitudeRight}
					{controlPanel}
					{experimentalDragInput}
				/>
				<EditAlgListGroup
					{groupId}
					{caseId}
					side="right"
					algorithmSelectionInitial={workingState.algorithmSelection}
					customAlgInitial={workingState.customAlgorithm}
					{onSelectionChange}
					{onCustomAlgChange}
				/>
			</TabItem>
		</Tabs>
		<Checkbox bind:checked={workingState.identicalAlgorithm}
			>Same Algorithm for Left and Right slot (mirrored)</Checkbox
		>

		<div class="mt-4 flex w-full justify-end gap-3">
			<Button type="button" color="gray" outline onclick={onCancel}>Cancel</Button>
			<Button type="submit">Update</Button>
		</div>
	</form>
</Modal>
