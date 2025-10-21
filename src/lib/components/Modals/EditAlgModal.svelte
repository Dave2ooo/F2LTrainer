<script lang="ts">
	import { GROUP_DEFINITIONS, type CaseId, type GroupId } from '$lib/types/group';
	import { Modal, Tabs, TabItem, Listgroup, ListgroupItem } from 'flowbite-svelte';
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

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	let onSelectionChange = (algorithmSelection: number | null, side: Side) => {
		console.log('Selection ' + side + ' changed to ', algorithmSelection);
		workingState.algorithmSelection[side] = algorithmSelection;
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

	let selectedAlgRight = $derived(
		getCaseAlg(staticData, workingState.algorithmSelection, workingState.customAlgorithm, 'right')
	);
	let selectedAlgLeft = $derived(
		mirrorAlg(
			getCaseAlg(staticData, workingState.algorithmSelection, workingState.customAlgorithm, 'left')
		)
	);

	$effect(() => {
		console.log(selectedAlgRight);
	});

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
	<Tabs tabStyle="underline">
		<TabItem open title="Left">
			<TwistyPlayer
				alg={selectedAlgLeft}
				stickeringString={stickeringStringLeft}
				setupAlg={setupAlgLeft}
				{setupRotation}
				cameraLongitude={cameraLongitudeLeft}
				{controlPanel}
				{experimentalDragInput}
			/>
			<EditAlgListGroup {groupId} {caseId} side="left" {onSelectionChange} />
		</TabItem>

		<TabItem title="Right">
			<TwistyPlayer
				alg={selectedAlgRight}
				stickeringString={stickeringStringRight}
				setupAlg={setupAlgRight}
				{setupRotation}
				cameraLongitude={cameraLongitudeRight}
				{controlPanel}
				{experimentalDragInput}
			/>
			<EditAlgListGroup {groupId} {caseId} side="right" {onSelectionChange} />
		</TabItem>
	</Tabs>
</Modal>
