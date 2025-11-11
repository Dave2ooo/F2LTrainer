<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
	import { globalState, GLOBAL_STATE_STORAGE_KEY } from '$lib/globalState.svelte';
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

		// Register service worker for PWA
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/service-worker.js');
			});
		}
	}
</script>

{@render children()}

<ToastContainer />
