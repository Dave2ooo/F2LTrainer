<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { casesState } from '$lib/casesState.svelte';
	import { globalState } from '$lib/globalState.svelte';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { CaseId, GroupId } from '$lib/types/group';
	import { Button } from 'flowbite-svelte';
	import { mirrorAlg } from '$lib/mirrorAlg';
	import { getCaseAlg, getCaseName } from '$lib/types/caseState';

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

	const selectedAlgRight = $derived(getCaseAlg(staticData, caseState, 'right'));
	const selectedAlgLeft = $derived(getCaseAlg(staticData, caseState, 'left'));

	const alg = $derived(mirrored ? mirrorAlg(selectedAlgLeft) : selectedAlgRight);

	const setupAlg = $derived(
		mirrored ? mirrorAlg(staticData.scramblePool[0]) : staticData.scramblePool[0]
	);

	let stickeringString = $derived(
		getStickeringString(
			globalState.crossColor,
			globalState.frontColor,
			staticData.pieceToHide,
			mirrored
		)
	);
	const setupRotation = $derived(getRotationAlg(globalState.crossColor, globalState.frontColor));
	const cameraLongitude = $derived(mirrored ? -25 : 25);
</script>

<div class="flex items-center rounded-2xl border-3">
	<span> {getCaseName(staticData)} </span>
	<TwistyPlayer {alg} {setupRotation} {setupAlg} {stickeringString} {cameraLongitude} />
	<span> {alg} </span>
	<Button onclick={() => (mirrored = !mirrored)}>Mirror</Button>
</div>
