<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import { TriangleAlert, Trash2, X } from '@lucide/svelte';
	import type { ComponentProps, Snippet } from 'svelte';

	let {
		open = $bindable(),
		title,
		message,
		children,
		onConfirm,
		confirmText = 'Delete',
		confirmIcon: ConfirmIcon = Trash2,
		confirmColor = 'red'
	}: {
		open: boolean;
		title: string;
		message?: string;
		children?: Snippet;
		onConfirm: () => void;
		confirmText?: string;
		confirmIcon?: any;
		confirmColor?: ComponentProps<typeof Button>['color'];
	} = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}
</script>

<Modal bind:open size="sm" autoclose={false}>
	<div class="text-center">
		<TriangleAlert
			class="mx-auto mb-4 h-12 w-12 text-gray-500 dark:text-gray-200 dark:text-gray-400"
		/>
		<h3 class="mb-5 text-xl font-bold text-gray-500 md:text-2xl dark:text-gray-400">
			{title}
		</h3>
		{#if message}
			<div class="mb-5 text-sm font-normal text-gray-500 dark:text-gray-400">
				{message}
			</div>
		{/if}
		{#if children}
			<div class="mb-5 text-left text-sm font-normal text-gray-500 dark:text-gray-400">
				{@render children()}
			</div>
		{/if}
		<Button color={confirmColor} class="me-2 gap-2" onclick={handleConfirm}>
			{#if ConfirmIcon}<ConfirmIcon class="size-4" />{/if}
			{confirmText}
		</Button>
		<Button color="gray" outline class="gap-2" onclick={() => (open = false)}>
			Cancel<X class="size-4" />
		</Button>
	</div>
</Modal>
