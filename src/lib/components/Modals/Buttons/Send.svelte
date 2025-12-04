<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import { Send, X } from '@lucide/svelte';

	interface Props {
		onCancel: () => void;
		disabled?: boolean;
		submitText?: string;
	}

	let { onCancel, disabled = false, submitText = 'Send' }: Props = $props();
</script>

<div class="mt-4 flex w-full justify-center gap-3">
	<Button type="submit" class="gap-2 py-2 md:text-lg" {disabled}>
		{#if disabled}
			<Spinner size="6" />
		{:else}
			<Send />
		{/if}
		{submitText}
	</Button>
	<Button
		type="button"
		color="gray"
		outline
		onclick={onCancel}
		class="gap-2 py-2 md:text-lg"
		{disabled}>Cancel<X /></Button
	>
</div>
