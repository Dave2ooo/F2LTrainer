<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Send, X } from '@lucide/svelte';

	interface Props {
		onCancel: () => void;
		disabled?: boolean;
		submitText?: string;
	}

	let { onCancel, disabled = false, submitText = 'Send' }: Props = $props();
</script>

<div class="mt-4 flex w-full justify-center gap-3">
	<Button type="submit" class="gap-2" {disabled}><Send />{submitText}</Button>
	<Button type="button" color="gray" outline onclick={onCancel} class="gap-2" {disabled}
		>Cancel<X /></Button
	>
</div>
