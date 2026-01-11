<script lang="ts">
	import { onMount } from 'svelte';
	import { Drawer } from 'flowbite-svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import RightPaneContent from './RightPaneContent.svelte';
	import { fly } from 'svelte/transition';
	import { globalState } from '$lib/globalState.svelte';

	interface Props {
		leftContent: Snippet;
		sessionToolbar: Snippet;
	}

	let { leftContent, sessionToolbar }: Props = $props();

	// Initialize from persisted state
	let isRightPaneOpen = $state(globalState.rightPaneOpen);
	let isMdOrLarger = $state(false); // Default to false (mobile-first) to prevent "drawer closing" animation on mobile
	let drawerOpen = $state(false);

	function toggleRightPane() {
		if (isMdOrLarger) {
			// Desktop: toggle split pane
			isRightPaneOpen = !isRightPaneOpen;
			// Persist the user's choice
			globalState.rightPaneOpen = isRightPaneOpen;
		} else {
			// Mobile: toggle drawer (open=true means visible)
			drawerOpen = !drawerOpen;
		}
	}

	// Media query detection for responsive layout
	onMount(() => {
		const mediaQuery = window.matchMedia('(min-width: 768px)');
		isMdOrLarger = mediaQuery.matches;

		const handleMediaChange = (e: MediaQueryListEvent) => {
			isMdOrLarger = e.matches;
		};

		mediaQuery.addEventListener('change', handleMediaChange);
		return () => mediaQuery.removeEventListener('change', handleMediaChange);
	});
</script>

<div class="relative flex h-full w-full overflow-hidden">
	<!-- Desktop & Mobile: Left Content Area -->
	<div class="flex h-full flex-1 flex-col overflow-y-auto bg-gray-50 p-0 dark:bg-gray-800">
		{@render sessionToolbar()}
		{@render leftContent()}

		<!-- Desktop: Open Button (shown when right pane is closed) -->
		{#if isMdOrLarger && !isRightPaneOpen}
			<button
				class="absolute top-1/2 right-0 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
				onclick={toggleRightPane}
				aria-label="Expand right pane"
			>
				<ChevronLeft class="size-4 text-gray-500 dark:text-gray-400" />
			</button>
		{/if}

		<!-- Mobile: Toggle Button (always shown effectively, as per original logic for drawer) -->
		{#if !isMdOrLarger}
			<button
				class="absolute top-1/2 right-0 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
				onclick={toggleRightPane}
				aria-label="Toggle right pane"
			>
				<ChevronLeft class="size-4 text-gray-500 dark:text-gray-400" />
			</button>
		{/if}
	</div>

	<!-- Desktop: Right Pane (Fixed Width) -->
	{#if isMdOrLarger && isRightPaneOpen}
		<div
			class="relative flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
			transition:fly={{ x: 200, duration: 300 }}
		>
			<!-- Close Button -->
			<button
				class="absolute top-1/2 -left-6 z-50 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
				onclick={toggleRightPane}
				aria-label="Collapse right pane"
			>
				<ChevronRight class="size-4 text-gray-500 dark:text-gray-400" />
			</button>

			<!-- Scrollable Content -->
			<div class="h-full overflow-y-auto">
				<RightPaneContent />
			</div>
		</div>
	{/if}

	<!-- Mobile: Drawer Component -->
	{#if !isMdOrLarger}
		<Drawer
			placement="right"
			bind:open={drawerOpen}
			outsideclose={true}
			class="drawer-custom-close bg-gray-50 dark:bg-gray-800"
		>
			<RightPaneContent inDrawer={true} onClose={() => (drawerOpen = false)} />
		</Drawer>
	{/if}
</div>

<style>
	/* Hide the default close button injected by Flowbite Drawer */
	:global(.drawer-custom-close > button) {
		display: none !important;
	}
</style>
