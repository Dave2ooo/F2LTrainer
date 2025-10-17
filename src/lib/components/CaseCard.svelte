<script lang="ts">
        import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
        import { casesStatic } from '$lib/casesStatic';
        import { casesState } from '$lib/casesState.svelte';
        import { globalState } from '$lib/globalState.svelte';
        import getRotationAlg from '$lib/rotation';
        import getStickeringString from '$lib/stickering';
        import type { CaseId, GroupId } from '$lib/types/group';

        let {
                groupId,
                caseId
        }: {
                groupId: GroupId;
                caseId: CaseId;
        } = $props();

        const staticData = casesStatic[groupId][caseId];
        const caseState = casesState[groupId][caseId];

        let mirrored = $state(false);

        const selectedAlgorithm = $derived(
                caseState.customAlgorithm.left.trim() ||
                        staticData.algPool[caseState.algorithmSelection.left] ||
                        staticData.algPool[0] ||
                        ''
        );

        const selectedScramble = $derived(
                staticData.scramblePool[caseState.algorithmSelection.left] ||
                        staticData.scramblePool[0] ||
                        ''
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
</script>

<div class="flex items-center rounded-2xl border-3">
        <TwistyPlayer alg={selectedAlgorithm} {setupRotation} setupAlg={selectedScramble} {stickeringString} />
        <span> {selectedAlgorithm} </span>
</div>
