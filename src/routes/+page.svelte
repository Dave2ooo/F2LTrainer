<!-- Icons: ArrowLeft , ArrowRight , X, Check, SquarePen, MessageCircleMore, Info, SendHorizontal  -->
<script lang="ts">
	import { Button, Heading } from 'flowbite-svelte';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import ImportConfirmModal from '$lib/components/Modals/ImportConfirmModal.svelte';
	import { exportToURL, importFromURL } from '$lib/utils/urlSave';
	import { onMount } from 'svelte';
	import { Settings as SettingsIcon } from '@lucide/svelte';
	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
	let feedbackRef: FeedbackModal;
	let importConfirmModalRef: ImportConfirmModal;

	function handleExportURL() {
		const url = exportToURL();
		console.log('Exported URL:', url);
	}

	onMount(() => {
		// Automatically check for import data on page load
		importFromURL(importConfirmModalRef);
	});
</script>

<Heading>F2L Trainer</Heading>

<div class="flex gap-2">
	<Button onclick={() => settingsRef.openModal()}><SettingsIcon /></Button>
	<Button onclick={() => feedbackRef.openModal()}>Send Feedback</Button>
	<Button onclick={handleExportURL}>Export to URL</Button>
</div>

<Settings bind:this={settingsRef} />
<FeedbackModal bind:this={feedbackRef} />
<ImportConfirmModal bind:this={importConfirmModalRef} />

{#if globalState.view === 'select'}
	<SelectView />
{:else}
	<TrainView />
{/if}

<ChangeViewButton />
