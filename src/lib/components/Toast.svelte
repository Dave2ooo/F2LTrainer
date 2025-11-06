<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, CloseCircleSolid } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';

	let {
		message,
		type = 'success',
		duration = 3000,
		onClose
	}: {
		message: string;
		type?: 'success' | 'error';
		duration?: number;
		onClose?: () => void;
	} = $props();

	let toastStatus = $state(true);

	// Auto-close after duration
	$effect(() => {
		if (toastStatus) {
			const timer = setTimeout(() => {
				toastStatus = false;
				if (onClose) onClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	});

	const color = type === 'success' ? 'green' : 'red';
</script>

{#if toastStatus}
	<Toast dismissable={true} transition={slide} bind:toastStatus {color}>
		{#snippet icon()}
			{#if type === 'success'}
				<CheckCircleSolid class="h-5 w-5" />
			{:else}
				<CloseCircleSolid class="h-5 w-5" />
			{/if}
		{/snippet}
		{message}
	</Toast>
{/if}
