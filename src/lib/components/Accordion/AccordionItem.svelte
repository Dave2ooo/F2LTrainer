<script lang="ts">
	import { getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { AccordionContext } from './types';

	let {
		header,
		children,
		open = $bindable(false),
		class: className = '',
		headerClass = '',
		contentClass = ''
	}: {
		header: import('svelte').Snippet;
		children: import('svelte').Snippet;
		open?: boolean;
		class?: string;
		headerClass?: string;
		contentClass?: string;
	} = $props();

	const context: AccordionContext | undefined = getContext('accordion');

	// Single selection logic
	const self = Symbol('accordion-item');

	// If single selection mode, sync with context
	$effect(() => {
		if (context && !context.multiple && open && context.selectedItem !== self) {
			context.selectedItem = self;
		}
	});

	// Listen to context changes to close when another item opens
	$effect(() => {
		if (context && !context.multiple && context.selectedItem !== self && open) {
			open = false;
		}
	});

	const handleToggle = () => {
		open = !open;
	};
</script>

<h2 class={`group ${className}`}>
	<button
		type="button"
		onclick={handleToggle}
		class={`flex w-full items-center justify-start border-b border-gray-200 px-2 py-2 text-left font-medium text-theme-text group-first:rounded-t-xl group-first:border-t hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:ring-gray-800 ${
			open ? 'bg-gray-100 dark:bg-gray-800' : ''
		} ${headerClass}`}
		style="min-height:2.7rem; gap:0.9rem; line-height:1.8;"
		aria-expanded={open}
	>
		{#if header}
			<svg
				class="mr-0 size-3 text-theme-text transition-transform md:size-4 {open
					? 'rotate-180'
					: ''}"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 10 6"
			>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="m1 1 4 4 4-4"
				/>
			</svg>
			{@render header()}
		{/if}
	</button>
</h2>

{#if open}
	<div transition:slide>
		<div class={`border-b border-gray-200 p-1 dark:border-gray-700 ${contentClass}`}>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	h2.group {
		margin-bottom: 0.7rem;
	}
</style>
