<script lang="ts">
	import { GROUP_DEFINITIONS, type CaseId, type GroupId } from '$lib/types/group';
	import { Modal, Tabs, TabItem, Listgroup, ListgroupItem } from 'flowbite-svelte';
	import TwistyPlayer from './TwistyPlayer.svelte';
	import { casesState, getCaseAlg } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { globalState } from '$lib/globalState.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import getStickeringString from '$lib/stickering';
	import { mirrorAlg } from '$lib/utils/mirrorAlg';
	import getRotationAlg from '$lib/rotation';

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	const title = GROUP_DEFINITIONS[groupId].editName + ' Case ' + caseId;

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

	const selectedAlgRight = $derived(getCaseAlg(staticData, caseState, 'right'));
	const selectedAlgLeft = $derived(getCaseAlg(staticData, caseState, 'left'));

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
	const cameraLongitudeRight = $derived(25);
	const cameraLongitudeLeft = $derived(-25);

	const controlPanel = 'bottom-row';
	const experimentalDragInput = 'auto';

	const algorithmPool = staticData.algPool;
	console.log(algorithmPool);
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

			<Listgroup active>
				<ListgroupItem current>Profile</ListgroupItem>
				<ListgroupItem>Settings</ListgroupItem>
				<ListgroupItem>Messages</ListgroupItem>
			</Listgroup>
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
		</TabItem>
	</Tabs>
</Modal>
