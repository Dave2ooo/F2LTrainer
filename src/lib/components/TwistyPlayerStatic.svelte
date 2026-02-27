<!-- Lightweight display-only version of TwistyPlayer for use in card grids.
     No model subscriptions, no click handlers, no F2L checking, no addMove. -->
<script lang="ts">
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { CustomAlgorithm, AlgorithmSelection } from '$lib/types/caseState';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { GroupId } from '$lib/types/group';
	import type { Side } from '$lib/types/Side';
	import type { StickerColor } from '$lib/types/stickering';
	import type { Auf } from '$lib/types/trainCase';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import { simplifyAlg } from '$lib/utils/simplifyAlg';
	import { onMount } from 'svelte';
	import type { HintStickering } from '$lib/types/globalState';
	import { globalState } from '$lib/globalState.svelte';

	interface Props {
		groupId?: GroupId;
		caseId?: number;
		scrambleSelection?: number;
		algorithmSelection?: AlgorithmSelection;
		customAlgorithm?: CustomAlgorithm;
		auf?: Auf;
		side: Side;
		crossColor?: StickerColor;
		frontColor?: StickerColor;
		stickering?: HintStickering;
		controlPanel?: 'bottom-row' | 'none';
		scramble?: string;
		alg?: string;
		class?: string;
	}

	let {
		groupId,
		caseId,
		scrambleSelection = 0,
		algorithmSelection,
		customAlgorithm,
		auf = '',
		side,
		crossColor = 'white',
		frontColor = 'red',
		stickering = 'f2l',
		controlPanel = 'none',
		scramble = $bindable(''),
		alg = $bindable(''),
		class: extraClass = ''
	}: Props = $props();

	const wrapperClass = $derived(['relative mx-auto', extraClass].filter(Boolean).join(' '));

	const staticData = $derived(
		groupId !== undefined && caseId !== undefined ? casesStatic[groupId]?.[caseId] : undefined
	);
	const caseState = $derived(
		groupId !== undefined && caseId !== undefined ? casesState[groupId]?.[caseId] : undefined
	);

	const algWithoutAUF = $derived(
		staticData
			? getCaseAlg(
					staticData,
					algorithmSelection ?? caseState?.algorithmSelection ?? { left: 0, right: 0 },
					customAlgorithm ?? caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				)
			: undefined
	);

	const scrambleWithoutAUF = $derived(
		staticData ? getCaseScramble(staticData, side, scrambleSelection) : undefined
	);

	$effect(() => {
		if (scrambleWithoutAUF !== undefined && algWithoutAUF !== undefined) {
			const [newScramble, newAlg] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
			scramble = newScramble;
			alg = simplifyAlg(newAlg);
		}
	});

	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));
	const cameraLongitude = $derived((side === 'right' ? 1 : -1) * globalState.cameraLongitude);
	const cameraLatitude = $derived(globalState.cameraLatitude);

	const stickeringString = $derived(
		stickering === 'f2l' && staticData
			? getStickeringString(staticData.pieceToHide, side, crossColor, frontColor)
			: undefined
	);

	onMount(async () => {
		await import('cubing/twisty');
	});
</script>

<div class={wrapperClass}>
	<twisty-player
		style:width="100%"
		style:height="100%"
		puzzle="3x3x3"
		{alg}
		experimental-setup-alg={[setupRotation, scramble].join(' ')}
		camera-longitude={cameraLongitude}
		camera-latitude={cameraLatitude}
		experimental-stickering-mask-orbits={stickeringString}
		control-panel={controlPanel}
		experimental-drag-input="none"
		background="none"
		hint-facelets="none"
		back-view="none"
		viewer-link="none"
		camera-distance="4.7"
	></twisty-player>
</div>
