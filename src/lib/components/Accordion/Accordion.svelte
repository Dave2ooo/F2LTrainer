<script lang="ts">
	import { setContext } from 'svelte';
	import type { AccordionContext } from './types';

	let {
		children,
		multiple = false,
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		multiple?: boolean;
		class?: string;
	} = $props();

	const context: AccordionContext = $state({
		multiple,
		selectedItem: null
	});

	setContext<AccordionContext>('accordion', context);
</script>

<div class={`w-full ${className}`}>
	{@render children()}
</div>
