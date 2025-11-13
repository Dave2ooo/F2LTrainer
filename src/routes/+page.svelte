<!-- Icons: ArrowLeft , ArrowRight , X, Check, SquarePen, MessageCircleMore, Info, SendHorizontal  -->
<script lang="ts">
	import { Button, Heading, Tooltip } from 'flowbite-svelte';
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import ImportConfirmModal from '$lib/components/Modals/ImportConfirmModal.svelte';
	import ExportUrlModal from '$lib/components/Modals/ExportUrlModal.svelte';
	import { exportToURL, importFromURL } from '$lib/utils/urlSave';
	import { onMount } from 'svelte';
	import { MessageCircle, Settings as SettingsIcon, Share2 } from '@lucide/svelte';
	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
	let feedbackRef: FeedbackModal;
	let importConfirmModalRef: ImportConfirmModal;
	let exportUrlModalRef: ExportUrlModal;

	function handleExportURL() {
		const url = exportToURL();
		exportUrlModalRef.openModal(url);
	}

	onMount(() => {
		// Automatically check for import data on page load
		importFromURL(importConfirmModalRef);
	});
</script>

<div style="background-color: var(--color-theme-bg); min-height: 100vh;">
	<Heading>F2L Trainer</Heading>

	<div class="flex gap-2">
		<Button onclick={() => settingsRef.openModal()}><SettingsIcon /></Button>
		<Tooltip placement="bottom">Settings</Tooltip>
		<Button onclick={() => feedbackRef.openModal()}><MessageCircle /></Button>
		<Tooltip placement="bottom">Send Feedback</Tooltip>
		<Button onclick={handleExportURL}><Share2 /></Button>
		<Tooltip placement="bottom">Export to URL</Tooltip>
	</div>

	<Settings bind:this={settingsRef} />
	<FeedbackModal bind:this={feedbackRef} />
	<ImportConfirmModal bind:this={importConfirmModalRef} />
	<ExportUrlModal bind:this={exportUrlModalRef} />

	{#if globalState.view === 'select'}
		<SelectView />
	{:else}
		<TrainView />
	{/if}

	<ChangeViewButton />
</div>
