<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Download } from '@lucide/svelte';
	import { pwaPrompt, clearPwaPrompt } from '$lib/pwaPrompt.svelte';

	let showReloadPrompt = $state(false);

	async function installPwa() {
		if (pwaPrompt.deferredPrompt) {
			try {
				await pwaPrompt.deferredPrompt.prompt();
				const choiceResult = await pwaPrompt.deferredPrompt.userChoice;
				if (choiceResult?.outcome === 'accepted') {
					console.log('PWA Install: accepted');
				} else {
					console.log('PWA Install: dismissed');
				}
			} catch (err) {
				console.error('PWA Install error', err);
			}

			clearPwaPrompt();
			return;
		}
	}

	// async function tryActivateSw() {
	// 	showReloadPrompt = false;
	// 	try {
	// 		await navigator.serviceWorker.ready;
	// 		if (navigator.serviceWorker && navigator.serviceWorker.controller) {
	// 			pwaPrompt.installAvailable = true;
	// 			return;
	// 		}
	// 		showReloadPrompt = true;
	// 	} catch (err) {
	// 		showReloadPrompt = true;
	// 	}
	// }
</script>

{#if pwaPrompt.installAvailable}
	<div class="flex gap-2">
		<Button
			onclick={installPwa}
			class="flex items-center justify-start bg-transparent p-1 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
		>
			<Download class="size-8 text-primary-600 md:size-9" />
			<span class="ml-3 text-lg font-medium text-gray-900 md:hidden dark:text-white"
				>Install App</span
			>
		</Button>

		<!-- {#if pwaPrompt.deferredPrompt && !pwaPrompt.installAvailable}
		<Button color="gray" outline={true} onclick={tryActivateSw}>Retry activation</Button>
	{/if}

	{#if showReloadPrompt}
		<span class="text-sm text-theme-text"
			>Reload the page (Ctrl+F5) to activate the service worker.</span
		>
	{/if} -->

		<Tooltip placement="bottom">Install App</Tooltip>

		<!-- <Tooltip placement="bottom">
		{#if pwaPrompt.installAvailable}
			Install App
		{:else if pwaPrompt.deferredPrompt}
			{'Install prompt captured — service worker has not activated. Click Retry or reload the page (Ctrl+F5).'}
		{:else}
			{'Install App (not available yet — open PWA instructions)'}
		{/if}
	</Tooltip> -->
	</div>
{/if}
