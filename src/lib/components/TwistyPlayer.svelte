<!-- https://js.cubing.net/cubing/api/classes/twisty.TwistyPlayer.html -->
<script lang="ts">
	import type { Side } from '$lib/types/Side';
	import { onMount } from 'svelte';

	let {
		alg,
		setupAlg,
		setupRotation = "z2 y'",
		side = 'right',
		stickeringString = 'EDGES:----IIII----,CORNERS:----IIII,CENTERS:------',
		controlPanel = 'none',
		experimentalDragInput = 'none',
		size = 25
	}: {
		alg: string;
		setupAlg: string;
		setupRotation?: string;
		side?: Side;
		stickeringString?: string;
		controlPanel?: 'bottom-row' | 'none';
		experimentalDragInput?: 'auto' | 'none';
		size?: number;
	} = $props();

	// export let background: 'none' | 'checkered' | 'checkered-transparent' | undefined = 'none';
	// export let hintFacelets: 'floating' | 'none' | undefined = 'none';

	// Allow parent components to grab the raw <twisty-player> element if needed
	let el: HTMLElement;

	const CAMERA_ANGLE = { right: 25, left: -25 };

	let cameraLongitude = $derived(CAMERA_ANGLE[side]);
	let cameraLatitude = $state(25);

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
	});
</script>

<!--
  Note: custom-element attributes are kebab-case.
  Only include an attribute when its value is defined.
-->
<twisty-player
	class="size-{size} aspect-[0.9]"
	bind:this={el}
	{alg}
	puzzle="3x3x3"
	experimental-setup-alg={[setupRotation, setupAlg].join(' ')}
	camera-longitude={cameraLongitude}
	camera-latitude={cameraLatitude}
	experimental-stickering-mask-orbits={stickeringString}
	control-panel={controlPanel}
	experimental-drag-input={experimentalDragInput}
	background="none"
	hint-facelets="none"
	viewer-link="none"
></twisty-player>

<!-- style="width: 145px; height: 160px" -->
