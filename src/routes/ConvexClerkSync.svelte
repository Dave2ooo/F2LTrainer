<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { solvesSyncService } from '$lib/services/solvesSyncService';
	import { sessionsSyncService } from '$lib/services/sessionsSyncService';
	import { caseStatesSyncService } from '$lib/services/caseStatesSyncService';
	import { statisticsState } from '$lib/statisticsState.svelte';
	import { sessionState } from '$lib/sessionState.svelte';
	import { handleCaseStatesLoginSync, handleCaseStatesPageLoadSync } from '$lib/casesState.svelte';
	import { globalState } from '$lib/globalState.svelte';

	const client = useConvexClient();
	const ctx = useClerkContext();

	// Track if we have already synced in this session to prevent double-sync
	let hasSynced = false;

	$effect(() => {
		if (ctx.session) {
			client.setAuth(async () => (await ctx.session?.getToken({ template: 'convex' })) ?? null);
		} else {
			client.setAuth(() => Promise.resolve(null));
		}
	});

	$effect(() => {
		const isAuthenticated = !!ctx.session;

		// Update sync services with client and auth state
		solvesSyncService.setClient(client);
		solvesSyncService.setAuthenticated(isAuthenticated);
		sessionsSyncService.setClient(client);
		sessionsSyncService.setAuthenticated(isAuthenticated);
		caseStatesSyncService.setClient(client);
		caseStatesSyncService.setAuthenticated(isAuthenticated);

		// Trigger sync only once when auth becomes true
		if (isAuthenticated && !hasSynced) {
			hasSynced = true;
			console.log('[ConvexClerkSync] User authenticated, starting sync...');

			// Run sync logic immediately
			(async () => {
				try {
					globalState.isSyncing = true;
					// Use handleLoginSync to ensure local changes are pushed (Offline-First)
					await sessionState.handleLoginSync();
					await statisticsState.handleLoginSync();
					await handleCaseStatesLoginSync();
					console.log('[ConvexClerkSync] Sync complete');
				} catch (error) {
					console.error('[ConvexClerkSync] Sync error:', error);
				} finally {
					globalState.isSyncing = false;
				}
			})();
		} else if (!isAuthenticated) {
			if (hasSynced) {
				console.log('[ConvexClerkSync] User logged out');
				// Flush any pending case state updates before finalizing logout state
				caseStatesSyncService.flushPendingUpdates();
				hasSynced = false; // Reset so we sync again if they log back in
			}
		}
	});
</script>
