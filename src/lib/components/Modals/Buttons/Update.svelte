<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Check, X } from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		onCancel: () => void;
		onSubmit?: () => void;
		submitText?: string;
		Icon?: Component;
		disabled?: boolean;
	}

	let {
		onCancel,
		onSubmit,
		submitText = 'Update',
		Icon = Check,
		disabled = false
	}: Props = $props();
</script>

<div class="modal-footer">
	<Button type="submit" class="gap-2 py-2 md:text-lg" onclick={onSubmit} {disabled}>
		<Icon />{submitText}
	</Button>
	<Button type="button" color="gray" outline onclick={onCancel} class="gap-2 py-2 md:text-lg"
		>Cancel<X /></Button
	>
</div>
