<script lang="ts">
	import { onMount } from 'svelte';

	let {
		alg,
		setupAlg,
		setupRotation = "z2 y'",
		cameraLongitude = 25,
		cameraLatitude = 25,
		stickeringString = 'EDGES:----IIII----,CORNERS:----IIII,CENTERS:------',
		controlPanel = 'none',
		experimentalDragInput = 'none',
		size = 160
	}: {
		alg: string;
		setupAlg: string;
		setupRotation?: string;
		cameraLongitude?: number;
		cameraLatitude?: number;
		stickeringString?: string;
		controlPanel?: 'bottom-row' | 'none';
		experimentalDragInput?: 'auto' | 'none';
		size?: number;
	} = $props();

	// export let background: 'none' | 'checkered' | 'checkered-transparent' | undefined = 'none';
	// export let hintFacelets: 'floating' | 'none' | undefined = 'none';

	// Allow parent components to grab the raw <twisty-player> element if needed
	let el: HTMLElement;
	export function getElement() {
		return el as HTMLElement;
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
	style="width: 145px; height: 160px"
></twisty-player>
