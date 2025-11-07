<!-- Icons: ArrowLeft , ArrowRight , X, Check, SquarePen, MessageCircleMore, Info, SendHorizontal  -->
<script lang="ts">
	import { Button, Heading } from 'flowbite-svelte';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import { exportToURL, importFromURL } from '$lib/utils/urlSave';
	import { onMount } from 'svelte';

	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;

	function handleExportURL() {
		const url = exportToURL();
		console.log('Exported URL:', url);
	}

	onMount(() => {
		// Automatically check for import data on page load
		importFromURL();
	});
</script>

<Heading>F2L Trainer</Heading>

<div class="flex gap-2">
	<Button onclick={() => settingsRef.openModal()}>Open Settings</Button>
	<FeedbackButton />
	<Button onclick={handleExportURL}>Export to URL</Button>
</div>

<Settings bind:this={settingsRef} />

{#if globalState.view === 'select'}
	<SelectView />
{:else}
	<TrainView />
{/if}

<ChangeViewButton />
