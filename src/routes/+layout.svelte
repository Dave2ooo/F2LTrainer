<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';

	// pwa prompt state centralized in $lib/pwaPrompt.svelte - used by components
	import { startPwaManager } from '$lib/pwa/pwaManager.svelte';
	import { startWakeLockManager } from '$lib/wakeLock/wakeLockManager.svelte';
	import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
	import { globalState, GLOBAL_STATE_STORAGE_KEY } from '$lib/globalState.svelte';

	import { saveToLocalStorage } from '$lib/utils/localStorage';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	import { PUBLIC_CONVEX_URL, PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	import { ClerkProvider } from 'svelte-clerk';
	import ConvexClerkSync from './ConvexClerkSync.svelte';

	let { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);

	if (browser) {
		$effect(() => {
			saveToLocalStorage(GLOBAL_STATE_STORAGE_KEY, globalState);
		});

		// Only persist case states to localStorage when not syncing to avoid conflicts
		$effect(() => {
			if (!globalState.isSyncing) {
				saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
			}
		});

		// Initialize the PWA manager which centralizes service worker
		// registration and `beforeinstallprompt` handling.
		startPwaManager();

		// Initialize the wake lock manager to prevent screen from sleeping
		$effect(() => {
			const cleanup = startWakeLockManager();
			return cleanup;
		});

		// Remove the initial HTML loader once the app is mounted
		$effect(() => {
			if (typeof window !== 'undefined' && (window as any).completeLoadingProgress) {
				(window as any).completeLoadingProgress();
			}

			const loader = document.getElementById('initial-loader');
			if (loader) {
				// Wait for the progress bar to visually hit 100% before fading out
				setTimeout(() => {
					loader.style.opacity = '0';
					setTimeout(() => loader.remove(), 400); // Matches the CSS transition time
				}, 250);
			}
		});
	}
</script>

<ClerkProvider
	publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}
	appearance={{
		cssLayerName: 'clerk'
	}}
	localization={{
		signIn: {
			start: {
				title: 'Welcome to F2L Trainer',
				subtitle:
					'Sign in to sync your progress across devices, track your solve history, and never lose your training data.'
			}
		},
		signUp: {
			start: {
				title: 'Join F2L Trainer',
				subtitle:
					'Create an account to unlock cloud sync, cross-device progress tracking, and detailed solve statistics.'
			}
		}
	}}
>
	<ConvexClerkSync />
	{@render children()}
</ClerkProvider>

<ToastContainer />
