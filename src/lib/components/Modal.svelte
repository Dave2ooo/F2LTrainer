<script lang="ts">
	import { Modal as FlowbiteModal, type ModalProps } from 'flowbite-svelte';

	let {
		open = $bindable(false),
		classes = {},
		children,
		header,
		footer,
		...restProps
	}: ModalProps & { children?: any; header?: any; footer?: any } = $props();

	// Merge default header classes with any custom classes provided
	const mergedClasses = $derived({
		...classes,
		header: classes.header
			? `px-4 py-2 md:px-5 md:py-2 ${classes.header}`
			: 'px-4 py-2 md:px-5 md:py-2'
	});
</script>

<FlowbiteModal bind:open classes={mergedClasses} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
	{#if header}
		{#snippet header()}
			{@render header()}
		{/snippet}
	{/if}
	{#if footer}
		{#snippet footer()}
			{@render footer()}
		{/snippet}
	{/if}
</FlowbiteModal>
