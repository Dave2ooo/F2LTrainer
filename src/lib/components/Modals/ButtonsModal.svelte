<script lang="ts">
	import { Button } from 'flowbite-svelte';

	let { onCancel, onSubmit }: { onCancel: () => void; onSubmit?: () => void } = $props();
</script>

<div class="mt-4 flex w-full justify-end gap-3">
	<Button type="button" color="gray" outline onclick={onCancel}>Cancel</Button>
	<Button type="submit">Update</Button>
</div>
