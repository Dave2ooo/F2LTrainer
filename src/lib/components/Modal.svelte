<script lang="ts">
	import { Modal as FlowbiteModal, type ModalProps } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		classes = {},
		children,
		header: headerSnippet,
		footer: footerSnippet,
		...restProps
	}: ModalProps & { children?: Snippet; header?: Snippet; footer?: Snippet } = $props();

	// Merge default header classes with any custom classes provided
	const mergedClasses = $derived({
		...classes,
		header: classes.header
			? `px-4 py-2 md:px-5 md:py-2 ${classes.header}`
			: 'px-4 py-2 md:px-5 md:py-2'
	});
</script>

<FlowbiteModal
	bind:open
	classes={mergedClasses}
	header={headerSnippet}
	footer={footerSnippet}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</FlowbiteModal>
