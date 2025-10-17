<script lang="ts">
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import getRotationAlg from '$lib/rotation';
	import getStickeringString from '$lib/stickering';
	import { type StickerColor, type StickerHidden } from '$lib/types/stickering';
	import { globalState } from '$lib/globalState.svelte';

	let {
		alg,
		setupAlg,
		// crossColor,
		// frontColor,
		stickering
	}: {
		alg: string;
		setupAlg: string;
		// crossColor: StickerColor;
		// frontColor: StickerColor;
		stickering: StickerHidden;
	} = $props();

	let mirrored = $state(false);

	let stickeringString = $derived(
		getStickeringString(globalState.crossColor, globalState.frontColor, stickering, mirrored)
	);
	const setupRotation = $derived(getRotationAlg(globalState.crossColor, globalState.frontColor));

</script>

<div class="flex items-center rounded-2xl border-3">
	<TwistyPlayer {alg} {setupRotation} {setupAlg} {stickeringString} />
	<span> {alg} </span>
</div>
