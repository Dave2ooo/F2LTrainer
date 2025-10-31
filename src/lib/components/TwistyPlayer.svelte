<!-- https://js.cubing.net/cubing/api/classes/twisty.TwistyPlayer.html -->
<script lang="ts">
	import { casesState, getCaseAlg, getCaseScramble } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import type { CustomAlgorithm } from '$lib/types/caseState';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import type { AlgorithmSelection } from '$lib/types/caseState';
	import type { GroupId } from '$lib/types/group';
	import type { Side } from '$lib/types/Side';
	import type { StickerColor } from '$lib/types/stickering';
	import type { Auf } from '$lib/types/trainCase';
	import { concatinateAuf } from '$lib/utils/addAuf';
	import { onMount } from 'svelte';
	import { RefreshOutline } from 'flowbite-svelte-icons';

	interface Props {
		groupId: GroupId;
		caseId: number;
		scrambleSelection?: number;
		algorithmSelection?: AlgorithmSelection;
		customAlgorithm?: CustomAlgorithm;
		auf?: Auf;
		side: Side;
		crossColor: StickerColor;
		frontColor: StickerColor;
		controlPanel?: 'bottom-row' | 'none';
		experimentalDragInput?: 'auto' | 'none';
		size?: number;
		scramble?: string;
		alg?: string;
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
		controlPanel = 'none',
		experimentalDragInput = 'none',
		size = 25,
		scramble = $bindable(''),
		alg = $bindable('')
	}: Props = $props();

	// Allow parent components to grab the raw <twisty-player> element if needed
	let el: HTMLElement;

	const staticData = $derived(casesStatic[groupId][caseId]);
	const caseState = $derived(casesState[groupId][caseId]);

	// if (algorithmSelection === undefined) {
	// 	algorithmSelection = caseState.algorithmSelection;
	// }

	const algWithoutAUF = $derived(
		getCaseAlg(
			staticData,
			algorithmSelection ?? caseState.algorithmSelection,
			customAlgorithm ?? caseState.customAlgorithm,
			side
		)
	);

	const scrambleWithoutAUF = $derived(getCaseScramble(staticData, side, scrambleSelection));

	$effect(() => {
		[scramble, alg] = concatinateAuf(scrambleWithoutAUF, algWithoutAUF, auf);
	});

	const setupRotation = $derived(getRotationAlg(crossColor, frontColor));

	const CAMERA_ANGLE = { right: 25, left: -25 };
	let cameraLongitude = $derived(CAMERA_ANGLE[side]);
	let cameraLatitude = $state(25);

	let stickeringString = $derived(
		getStickeringString(staticData.pieceToHide, side, crossColor, frontColor)
	);

	// Track whether the reset button should be visible
	let showResetButton = $state(false);

	export function getElement() {
		return el as HTMLElement;
	}

	// Expose animation controls
	export function jumpToStart() {
		if (el) {
			const player = el as any;
			if (typeof player.jumpToStart === 'function') {
				player.jumpToStart();
			}
		}
	}

	export function jumpToEnd() {
		if (el) {
			const player = el as any;
			if (typeof player.jumpToEnd === 'function') {
				player.jumpToEnd();
			}
		}
	}

	export function play() {
		if (el) {
			const player = el as any;
			if (typeof player.play === 'function') {
				player.play();
			}
		}
	}

	export function pause() {
		if (el) {
			const player = el as any;
			if (typeof player.pause === 'function') {
				player.pause();
			}
		}
	}

	export function togglePlay() {
		if (el) {
			const player = el as any;
			// Use the native togglePlay method from the TwistyPlayer API
			if (typeof player.togglePlay === 'function') {
				player.togglePlay();
			}
		}
	}

	export function resetView() {
		if (el) {
			const player = el as any;
			player.cameraLongitude = cameraLongitude;
			player.cameraLatitude = cameraLatitude;
		}
	}

	// Register the custom element only on the client (avoids SSR issues)
	onMount(async () => {
		await import('cubing/twisty');

		// Set up event listener to track camera position changes
		// Wait a tick for the element to be fully initialized
		setTimeout(() => {
			if (el) {
				try {
					const player = el as any;
					// Listen for camera position changes
					if (player.experimentalModel?.twistySceneModel?.orbitCoordinatesRequest) {
						player.experimentalModel.twistySceneModel.orbitCoordinatesRequest.addFreshListener(
							(coords: any) => {
								// Show reset button if camera is not at default position
								// Check both latitude and longitude
								const isAtDefaultPosition =
									Math.abs(coords.latitude - cameraLatitude) < 0.1 &&
									Math.abs(coords.longitude - cameraLongitude) < 0.1;
								showResetButton = !isAtDefaultPosition;
							}
						);
					}
				} catch (e) {
					console.warn('Could not set up camera position listener:', e);
				}
			}
		}, 100);
	});
</script>

<!--
  Note: custom-element attributes are kebab-case.
  Only include an attribute when its value is defined.
-->
<div class="relative">
	<twisty-player
		class="size-{size} aspect-[0.9]"
		bind:this={el}
		puzzle="3x3x3"
		{alg}
		experimental-setup-alg={[setupRotation, scramble].join(' ')}
		camera-longitude={cameraLongitude}
		camera-latitude={cameraLatitude}
		experimental-stickering-mask-orbits={stickeringString}
		control-panel={controlPanel}
		experimental-drag-input={experimentalDragInput}
		background="none"
		hint-facelets="none"
		viewer-link="none"
	></twisty-player>

	{#if showResetButton}
		<button
			onclick={resetView}
			class="absolute right-1 top-1 rounded-full bg-gray-800 bg-opacity-70 p-2 text-white hover:bg-opacity-90 transition-all duration-200"
			title="Reset View"
			aria-label="Reset camera view"
		>
			<RefreshOutline class="h-4 w-4" />
		</button>
	{/if}
</div>

<!-- style="width: 145px; height: 160px" -->
