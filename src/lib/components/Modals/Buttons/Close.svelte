<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { X } from '@lucide/svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();
</script>

<div class="mt-4 flex w-full justify-center">
	<Button type="button" onclick={onClose} class="gap-2 py-2 md:text-lg"><X />Close</Button>
</div>
