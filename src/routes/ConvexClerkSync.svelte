<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { solvesSyncService } from '$lib/services/solvesSyncService';
	import { sessionsSyncService } from '$lib/services/sessionsSyncService';
	import { caseStatesSyncService } from '$lib/services/caseStatesSyncService';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { handleCaseStatesLoginSync, handleCaseStatesPageLoadSync } from '$lib/casesState.svelte';

	const client = useConvexClient();
	const ctx = useClerkContext();

	// Track auth state changes and sync status
	let wasAuthenticated = false;
	let hasSeenFirstAuth = false; // Track if we've ever seen auth (for login vs page load)

	$effect(() => {
		if (ctx.session) {
			client.setAuth(async () => (await ctx.session?.getToken({ template: 'convex' })) ?? null);
		} else {
			client.setAuth(() => Promise.resolve(null));
		}
	});

	// Handle auth state changes and sync
	$effect(() => {
		const isAuthenticated = !!ctx.session;

		// Update sync services with client and auth state
		solvesSyncService.setClient(client);
		solvesSyncService.setAuthenticated(isAuthenticated);
		sessionsSyncService.setClient(client);
		sessionsSyncService.setAuthenticated(isAuthenticated);
		caseStatesSyncService.setClient(client);
		caseStatesSyncService.setAuthenticated(isAuthenticated);

		// Trigger sync when authenticated
		if (isAuthenticated) {
			if (!hasSeenFirstAuth) {
				// First time seeing auth - this is a fresh login
				console.log('[ConvexClerkSync] User logged in, uploading + merging data...');
				hasSeenFirstAuth = true;
				// Give Convex a moment to establish auth before syncing
				setTimeout(async () => {
					// First login: upload local data, then merge with Convex
					await sessionState.handleLoginSync();
					await statisticsState.handleLoginSync();
					await handleCaseStatesLoginSync();
				}, 500);
			} else if (!wasAuthenticated) {
				// Auth restored after page load (hasSeenFirstAuth is true from previous session)
				console.log('[ConvexClerkSync] Page loaded with active session, pulling from Convex...');
				// Give Convex a moment to establish auth before syncing
				setTimeout(async () => {
					// Page load: Convex is source of truth, just pull
					await sessionState.handlePageLoadSync();
					await statisticsState.handlePageLoadSync();
					await handleCaseStatesPageLoadSync();
				}, 500);
			}
		}

		// Detect logout (was authenticated, now isn't)
		if (!isAuthenticated && wasAuthenticated) {
			console.log('[ConvexClerkSync] User logged out');
			hasSeenFirstAuth = false; // Reset for next login
		}

		wasAuthenticated = isAuthenticated;
	});
</script>
