<script lang="ts">
	import { onMount } from 'svelte';
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { GroupId } from '$lib/types/group';
	import type { Side } from '$lib/types/Side';
	import type { StickerColor } from '$lib/types/stickering';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import { simplifyAlg } from '$lib/utils/simplifyAlg';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import {
		applyEOMaskToStickeringString,
		getEODisplayColor,
		recolorMysteryEdge
	} from '$lib/utils/edgeOrientationDisplay';
	import { globalState } from '$lib/globalState.svelte';

	interface Props {
		groupId?: GroupId;
		caseId: number;
		description: string;
		side?: Side;
		crossColor?: StickerColor;
		frontColor?: StickerColor;
		class?: string;
	}

	let {
		groupId = 'basic',
		caseId,
		description,
		side = 'right',
		crossColor = 'white',
		frontColor = 'red',
		class: extraClass = ''
	}: Props = $props();

	let playerElement: HTMLElement | undefined;
	let scramble = $state('');
	let alg = $state('');

	const wrapperClass = $derived(['flex flex-col gap-2', extraClass].filter(Boolean).join(' '));
	const staticData = $derived(groupId !== undefined ? casesStatic[groupId]?.[caseId] : undefined);
	const caseState = $derived(groupId !== undefined ? casesState[groupId]?.[caseId] : undefined);
	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));
	const cameraLongitude = $derived((side === 'right' ? 1 : -1) * globalState.cameraLongitude);
	const cameraLatitude = $derived(globalState.cameraLatitude);

	const algWithoutAUF = $derived(
		staticData
			? getCaseAlg(
					staticData,
					caseState?.algorithmSelection ?? { left: 0, right: 0 },
					caseState?.customAlgorithm ?? { left: '', right: '' },
					side
				)
			: undefined
	);

	const scrambleWithoutAUF = $derived(
		staticData ? getCaseScramble(staticData, side, 0) : undefined
	);

	const stickeringString = $derived.by(() => {
		if (!staticData) return undefined;

		const baseStr = getStickeringString(staticData.pieceToHide, side, crossColor, frontColor);
		return applyEOMaskToStickeringString(baseStr, groupId, caseId, side, crossColor, frontColor);
	});

	$effect(() => {
		if (scrambleWithoutAUF !== undefined && algWithoutAUF !== undefined) {
			const [newScramble, newAlg] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, '');
			scramble = newScramble;
			alg = simplifyAlg(newAlg);
		}
	});

	$effect(() => {
		void scramble;
		void alg;
		void stickeringString;

		const currentColor = getEODisplayColor(
			groupId,
			caseId,
			globalState.eoOrientedColor,
			globalState.eoUnorientedColor
		);

		if (!playerElement || currentColor === undefined) return;

		const intervalId = setInterval(() => recolorMysteryEdge(playerElement!, currentColor), 50);
		const timeoutId = setTimeout(() => clearInterval(intervalId), 1500);

		return () => {
			clearInterval(intervalId);
			clearTimeout(timeoutId);
		};
	});

	onMount(async () => {
		await import('cubing/twisty');
	});
</script>

<div class={wrapperClass}>
	<div>
		<p class="text-sm font-medium text-gray-900 dark:text-white">{description}</p>
	</div>
	<div class="mx-auto h-[120px] w-[120px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
		<twisty-player
			bind:this={playerElement}
			style:width="100%"
			style:height="100%"
			puzzle="3x3x3"
			{alg}
			experimental-setup-alg={[setupRotation, scramble].join(' ')}
			camera-longitude={cameraLongitude}
			camera-latitude={cameraLatitude}
			experimental-stickering-mask-orbits={stickeringString}
			control-panel="none"
			experimental-drag-input="none"
			background="none"
			hint-facelets="none"
			back-view="none"
			viewer-link="none"
			camera-distance="4.7"
		></twisty-player>
	</div>
</div>
