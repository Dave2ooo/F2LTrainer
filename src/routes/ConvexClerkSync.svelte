<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';

	const client = useConvexClient();
	const ctx = useClerkContext();

	$effect(() => {
		if (ctx.session) {
			client.setAuth(async () => (await ctx.session?.getToken({ template: 'convex' })) ?? null);
		} else {
			client.setAuth(() => Promise.resolve(null));
		}
	});
</script>
