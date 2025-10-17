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

	let {
		groupId,
		caseId
	}: {
		groupId: GroupId;
		caseId: CaseId;
	} = $props();

	const staticData = casesStatic[groupId][caseId];
	const caseState = casesState[groupId][caseId];

        const selectedAlgorithm = $derived(
                caseState.customAlgorithm.left.trim() ||
                        staticData.algPool[caseState.algorithmSelection.right] ||
                        staticData.algPool[0] ||
                        ''
        );

        const displayedAlgorithm = $derived(
                caseState.mirrored ? mirrorAlg(selectedAlgorithm) : selectedAlgorithm
        );

	const selectedScramble = $derived(
		staticData.scramblePool[caseState.algorithmSelection.right] || staticData.scramblePool[0] || ''
	);

	let stickeringString = $derived(
		getStickeringString(
			globalState.crossColor,
			globalState.frontColor,
			staticData.pieceToHide,
			caseState.mirrored
		)
	);
        const setupRotation = $derived(getRotationAlg(globalState.crossColor, globalState.frontColor));
        const cameraLongitude = $derived(caseState.mirrored ? -25 : 25);
</script>

<div class="flex items-center rounded-2xl border-3">
        <TwistyPlayer
                alg={displayedAlgorithm}
                {setupRotation}
                setupAlg={selectedScramble}
                {stickeringString}
                {cameraLongitude}
        />
        <span> {displayedAlgorithm} </span>
	<Button
		onclick={() => {
			caseState.mirrored = !caseState.mirrored;
		}}>Mirror</Button
	>
</div>
