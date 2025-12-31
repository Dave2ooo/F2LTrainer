<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Check, X } from '@lucide/svelte';

	interface Props {
		onCancel: () => void;
		onSubmit?: () => void;
		submitText?: string;
		Icon?: any;
	}

	let { onCancel, onSubmit, submitText = 'Update', Icon = Check }: Props = $props();
</script>

<div class="mt-4 flex w-full justify-center gap-3">
	<Button type="submit" class="gap-2 py-2 md:text-lg" onclick={onSubmit}>
		<Icon />{submitText}
	</Button>
	<Button type="button" color="gray" outline onclick={onCancel} class="gap-2 py-2 md:text-lg"
		>Cancel<X /></Button
	>
</div>
