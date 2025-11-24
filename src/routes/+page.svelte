<!-- Icons: ArrowLeft , ArrowRight , X, Check, SquarePen, MessageCircleMore, Info, SendHorizontal  -->
<script lang="ts">
	import { Button, Heading, Tooltip, Navbar, NavBrand, NavHamburger, NavUl } from 'flowbite-svelte';
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
	import { Download, MessageCircle, Settings as SettingsIcon, Share2 } from '@lucide/svelte';
	const currentTrainState = trainState; // Keep at +page to keep global

	let settingsRef: Settings;
	let feedbackRef: FeedbackModal;
	let importConfirmModalRef: ImportConfirmModal;
	let exportUrlModalRef: ExportUrlModal;
	import PwaInstall from '$lib/components/PwaInstall.svelte';

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

<div style="background-color: var(--color-theme-bg); min-height: 100vh;">
	<Navbar fluid={true} color="none" class="bg-gray-100 px-4 py-2 md:py-0 dark:bg-gray-900">
		<NavBrand href="/">
			<img src="/logo.svg" class="me-3 h-9 sm:h-12" alt="F2L Trainer Logo" />
			<span class="self-center whitespace-nowrap text-xl md:text-3xl font-semibold dark:text-white"
				>F2L Trainer</span
			>
		</NavBrand>
		<div class="ml-auto flex items-center gap-2">
			<Button
				class="bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				onclick={() => settingsRef.openModal()}
				><SettingsIcon class="size-8 text-primary-600 md:size-10" /></Button
			>
			<Tooltip placement="bottom">Settings</Tooltip>
			<NavHamburger
				class="p-1 text-primary-600 hover:bg-transparent dark:text-primary-600 dark:hover:bg-transparent [&>svg]:size-8 md:[&>svg]:size-10"
			/>
		</div>
		<NavUl>
			<li class="mx-1 my-2 md:my-0">
				<Button
					class="flex items-center justify-start bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
					onclick={() => feedbackRef.openModal()}
				>
					<MessageCircle class="size-8 text-primary-600 md:size-10" />
					<span class="ml-4 text-lg font-medium text-gray-900 dark:text-white md:hidden">Send Feedback</span>
				</Button>
				<Tooltip placement="bottom">Send Feedback</Tooltip>
			</li>
			<li class="mx-1 my-2 md:my-0">
				<Button
					class="flex items-center justify-start bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
					onclick={handleExportURL}
				>
					<Share2 class="size-8 text-primary-600 md:size-10" />
					<span class="ml-4 text-lg font-medium text-gray-900 dark:text-white md:hidden">Export to URL</span>
				</Button>
				<Tooltip placement="bottom">Export to URL</Tooltip>
			</li>
			<li class="mx-1">
				<PwaInstall />
			</li>
		</NavUl>
	</Navbar>

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
