<script lang="ts">
	import { globalState } from '$lib/globalState.svelte';
	import { Button } from 'flowbite-svelte';

	let buttonText = $state();

	$effect(() => {
		buttonText = globalState.view == 'select' ? 'Start Training' : 'Select Cases';
	});
</script>

<Button
	onclick={() => {
		globalState.view == 'select' ? (globalState.view = 'train') : (globalState.view = 'select');
	}}
	class="fixed right-4 bottom-4 z-50"
>
	{buttonText}
</Button>
