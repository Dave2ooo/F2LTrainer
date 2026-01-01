<!-- Icons: ArrowLeft , ArrowRight , X, Check, SquarePen, MessageCircleMore, Info, SendHorizontal  -->
<script lang="ts">
	import { globalState } from '$lib/globalState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import ChangeViewButton from '$lib/components/ChangeViewButton.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import { trainState } from '$lib/trainCaseQueue.svelte';
	import Settings from '$lib/components/Modals/Settings.svelte';
	import FeedbackModal from '$lib/components/Modals/FeedbackModal.svelte';
	import HelpModal from '$lib/components/Modals/HelpModal.svelte';
	import ImportConfirmModal from '$lib/components/Modals/ImportConfirmModal.svelte';
	import ExportUrlModal from '$lib/components/Modals/ExportUrlModal.svelte';
	import { exportToURL, importFromURL } from '$lib/utils/urlSave';
	import { onMount } from 'svelte';
	import AppNavbar from '$lib/components/AppNavbar.svelte';
	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
	let feedbackRef: FeedbackModal;
	let helpRef: HelpModal;
	let importConfirmModalRef: ImportConfirmModal;
	let exportUrlModalRef: ExportUrlModal;

	function handleExportURL() {
		const url = exportToURL();
		exportUrlModalRef.openModal(url);
	}

	onMount(() => {
		// Automatically check for import data on page load
		importFromURL(importConfirmModalRef);
		// We attach `beforeinstallprompt`/`appinstalled` at the layout, so nothing else to do here
		return () => {};
	});
</script>

<div
	style="background-color: var(--color-theme-bg); height: 100vh; display: flex; flex-direction: column; overflow: hidden;"
>
	<AppNavbar {settingsRef} {feedbackRef} {helpRef} onExportURL={handleExportURL} />

	<Settings bind:this={settingsRef} />
	<FeedbackModal bind:this={feedbackRef} />
	<HelpModal bind:this={helpRef} />
	<ImportConfirmModal bind:this={importConfirmModalRef} />
	<ExportUrlModal bind:this={exportUrlModalRef} />

	<div
		class="relative flex-1 {globalState.view === 'select' ? 'overflow-y-auto' : 'overflow-hidden'}"
	>
		{#if globalState.view === 'select'}
			<SelectView />
			<!-- Spacer to ensure content isn't hidden behind the floating button -->
			<div class="h-20 w-full shrink-0"></div>
		{:else}
			<TrainView />
		{/if}
	</div>

	<ChangeViewButton />
</div>
