<script lang="ts">
	import { onMount } from 'svelte';
	import { Splitpanes, Pane } from 'svelte-splitpanes';
	import { Drawer, P } from 'flowbite-svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import RightPaneContent from './RightPaneContent.svelte';

	interface Props {
		leftContent: Snippet;
	}

	let { leftContent }: Props = $props();

	let isRightPaneOpen = $state(false);
	let isMdOrLarger = $state(true); // Default to true for SSR
	let drawerOpen = $state(false);

	function toggleRightPane() {
		if (isMdOrLarger) {
			// Desktop: toggle split pane
			isRightPaneOpen = !isRightPaneOpen;
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

	// Sync states when screen size changes
	$effect(() => {
		// When transitioning between mobile and desktop, sync the states
		if (isMdOrLarger) {
			// Mobile to Desktop: sync drawer state to split pane state
			isRightPaneOpen = drawerOpen;
		} else {
			// Desktop to Mobile: sync split pane state to drawer state
			drawerOpen = isRightPaneOpen;
		}
	});
</script>

<div class="relative h-full w-full">
	<!-- Desktop: Split Pane Layout -->
	{#if isMdOrLarger}
		<Splitpanes style="height: 100%">
			<Pane minSize={60} size={isRightPaneOpen ? 80 : 100}>
				<div class="flex h-full flex-col overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800">
					{@render leftContent()}
				</div>
			</Pane>

			{#if isRightPaneOpen}
				<Pane minSize={10} size={20}>
					<div class="relative flex h-full items-center justify-center bg-gray-50 dark:bg-gray-800">
						<button
							class="absolute -left-3 top-1/2 z-50 flex h-12 w-6 -translate-y-1/2 translate-x-3 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
							onclick={toggleRightPane}
							aria-label="Collapse right pane"
						>
							<ChevronRight class="size-4 text-gray-500 dark:text-gray-400" />
						</button>
						<RightPaneContent />
					</div>
				</Pane>
			{/if}
		</Splitpanes>

		{#if !isRightPaneOpen}
			<button
				class="absolute right-0 top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
				onclick={toggleRightPane}
				aria-label="Expand right pane"
			>
				<ChevronLeft class="size-4 text-gray-500 dark:text-gray-400" />
			</button>
		{/if}
	<!-- Mobile: Drawer Layout -->
	{:else}
		<div class="flex h-full flex-col overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800">
			{@render leftContent()}
		</div>

		<!-- Mobile toggle button -->
		<button
			class="absolute right-0 top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-white shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
			onclick={toggleRightPane}
			aria-label="Toggle right pane"
		>
			<ChevronLeft class="size-4 text-gray-500 dark:text-gray-400" />
		</button>

		<!-- Drawer for mobile -->
		<Drawer
			placement="right"
			bind:open={drawerOpen}
			outsideclose={true}
			class="bg-gray-50 dark:bg-gray-800"
		>
			<RightPaneContent />
		</Drawer>
	{/if}
</div>
