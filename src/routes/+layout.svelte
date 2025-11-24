<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	// pwa prompt state centralized in $lib/pwaPrompt.svelte - used by components
	import { startPwaManager } from '$lib/pwa/pwaManager.svelte';
	import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
	import { globalState, GLOBAL_STATE_STORAGE_KEY } from '$lib/globalState.svelte';
	import { statistics, STATISTICS_STATE_STORAGE_KEY } from '$lib/statisticsState.svelte';
	import { saveToLocalStorage } from '$lib/utils/localStorage';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { requestWakeLock, releaseWakeLock } from '$lib/utils/wakeLock';
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

		// Handle wake lock to prevent screen from sleeping
		$effect(() => {
			// Request wake lock when effect runs
			requestWakeLock();

			// Handle visibility change - reacquire wake lock when page becomes visible
			const handleVisibilityChange = () => {
				if (document.visibilityState === 'visible') {
					requestWakeLock();
				}
			};

			document.addEventListener('visibilitychange', handleVisibilityChange);

			// Cleanup: remove listener and release wake lock
			return () => {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
				releaseWakeLock();
			};
		});
	}
</script>

{@render children()}

<ToastContainer />
