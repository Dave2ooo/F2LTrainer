<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import { TriangleAlert, Trash2, X } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';

	let {
		open = $bindable(),
		title,
		message,
		onConfirm,
		confirmText = 'Delete',
		confirmColor = 'red'
	}: {
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
		confirmText?: string;
		confirmColor?: ComponentProps<typeof Button>['color'];
	} = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}
</script>

<Modal bind:open size="xs" autoclose={false}>
	<div class="text-center">
		<TriangleAlert class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			{title}
			<div class="mt-2 text-sm">
				{message}
			</div>
		</h3>
		<Button color={confirmColor} class="me-2 gap-2" onclick={handleConfirm}><Trash2 class="size-4" />{confirmText}</Button>
		<Button color="alternative" class="gap-2" onclick={() => (open = false)}>Cancel<X class="size-4" /></Button>
	</div>
</Modal>
