<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { solvesSyncService } from '$lib/services/solvesSyncService';
	import { statisticsState } from '$lib/statisticsState.svelte';

	const client = useConvexClient();
	const ctx = useClerkContext();

	// Track previous auth state to detect login/logout
	let wasAuthenticated = false;

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

		// Update sync service with client and auth state
		solvesSyncService.setClient(client);
		solvesSyncService.setAuthenticated(isAuthenticated);

		// Detect login (wasn't authenticated, now is)
		if (isAuthenticated && !wasAuthenticated) {
			console.log('[ConvexClerkSync] User logged in, triggering sync...');
			// Give Convex a moment to establish auth before syncing
			setTimeout(() => {
				statisticsState.handleLoginSync();
			}, 500);
		}

		// Detect logout (was authenticated, now isn't)
		if (!isAuthenticated && wasAuthenticated) {
			console.log('[ConvexClerkSync] User logged out');
		}

		wasAuthenticated = isAuthenticated;
	});
</script>
