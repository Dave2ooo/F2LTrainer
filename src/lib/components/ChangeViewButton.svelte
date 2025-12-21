<script lang="ts">
	import { globalState } from '$lib/globalState.svelte';
	import { Button } from 'flowbite-svelte';
	import { getNumberOfSelectedCases } from '$lib/trainCaseQueue.svelte';
	import { MousePointer2, Play } from '@lucide/svelte';

	import SessionSelector from '$lib/components/Session/SessionSelector.svelte';

	let sessionSelectorOpen = $state(false);

	let buttonText = $derived(
		globalState.view == 'select'
			? `Start Training (${getNumberOfSelectedCases()} cases)`
			: 'Select Cases'
	);

	function onToggleView() {
		if (globalState.view == 'select') {
			if (getNumberOfSelectedCases() > 0) {
				sessionSelectorOpen = true; // Open session selector
				// globalState.view = 'train'; // This will be done by SessionSelector
			}
		} else {
			globalState.view = 'select';
		}
	}
</script>

<Button
	onclick={onToggleView}
	class="fixed right-4 bottom-4 z-50 text-base sm:text-lg md:text-xl 2xl:text-2xl"
>
	{buttonText}
	<!-- {#if globalState.view == 'select'}
		<Play />
	{:else}
		<MousePointer2 />
	{/if} -->
</Button>

<!-- Spacer to allow scrolling past the fixed button; matches button height -->
<Button
	aria-hidden="true"
	tabindex={-1}
	class="pointer-events-none invisible p-5 text-base select-none sm:text-lg md:text-xl 2xl:text-2xl"
>
	{buttonText}
</Button>

<SessionSelector bind:open={sessionSelectorOpen} />
