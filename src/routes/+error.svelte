<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<div
	style="background-color: var(--color-theme-bg); color: var(--color-theme-text); height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
>
	<img src="{base}/full_cube.svg" alt="Cube" class="error-cube" />

	<h2
		style="
			margin: 1.5rem 0 0 0;
			font-weight: 700;
			font-size: 1.75rem;
			letter-spacing: -0.025em;
			line-height: 1;
		"
	>
		Error {$page.status}
	</h2>

	<p
		class="mt-4 px-4 text-center"
		style="color: var(--color-theme-text-secondary); max-width: 400px;"
	>
		{#if $page.status === 404}
			The page you're looking for doesn't exist.
		{:else}
			{$page.error?.message || 'Something went wrong.'}
		{/if}
	</p>

	<div style="margin-top: 2rem;">
		<a
			href="/"
			class="rounded-full px-6 py-2 font-medium text-white transition-colors hover:opacity-90"
			style="background-color: #3b82f6; display: inline-block; text-decoration: none;"
		>
			Return Home
		</a>
	</div>
</div>

<style>
	.error-cube {
		width: 72px;
		height: 72px;
	}
</style>
