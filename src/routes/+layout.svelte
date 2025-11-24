<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	// pwa prompt state centralized in $lib/pwaPrompt.svelte - used by components
	import { startPwaManager } from '$lib/pwa/pwaManager.svelte';
	import { startWakeLockManager } from '$lib/wakeLock/wakeLockManager.svelte';
	import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
	import { globalState, GLOBAL_STATE_STORAGE_KEY } from '$lib/globalState.svelte';
	import { statistics, STATISTICS_STATE_STORAGE_KEY } from '$lib/statisticsState.svelte';
	import { saveToLocalStorage } from '$lib/utils/localStorage';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	let { children } = $props();

	if (browser) {
		$effect(() => {
			saveToLocalStorage(GLOBAL_STATE_STORAGE_KEY, globalState);
		});

		$effect(() => {
			saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
		});

		$effect(() => {
			saveToLocalStorage(STATISTICS_STATE_STORAGE_KEY, statistics);
		});

		// Initialize the PWA manager which centralizes service worker
		// registration and `beforeinstallprompt` handling.
		startPwaManager();

		// Initialize the wake lock manager to prevent screen from sleeping
		$effect(() => {
			const cleanup = startWakeLockManager();
			return cleanup;
		});
	}
</script>

{@render children()}

<ToastContainer />
