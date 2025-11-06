<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		onCancel: () => void;
		onSubmit?: () => void;
	}

	let { onCancel, onSubmit }: Props = $props();
</script>

<div class="mt-4 flex w-full justify-center gap-3">
	<Button type="submit" class="gap-2"><Check />Update</Button>
	<Button type="button" color="gray" outline onclick={onCancel} class="gap-2">Cancel<X /></Button>
</div>
