<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Check, X } from '@lucide/svelte';

	let open = $state(false);
	let resolvePromise: ((value: boolean) => void) | null = null;

	export function confirm(): Promise<boolean> {
		open = true;
		return new Promise((resolve) => {
			resolvePromise = resolve;
		});
	}

	function onConfirm() {
		if (resolvePromise) {
			resolvePromise(true);
			resolvePromise = null;
		}
		open = false;
	}

	function onCancel() {
		if (resolvePromise) {
			resolvePromise(false);
			resolvePromise = null;
		}
		open = false;
	}
</script>

<Modal bind:open title="Clear Local Data?" size="sm" outsideclose={false} autoclose={false}>
	<div class="space-y-4">
		<p>
			Are you sure you want to clear all local data? This will delete all your saved settings, case
			states, sessions, and progress stored on this device.
		</p>

		<p class="text-sm text-gray-600 dark:text-gray-400">
			Your cloud backup will remain safe and unchanged.
		</p>

		<div class="mt-6 flex w-full justify-center gap-3">
			<Button color="red" onclick={onConfirm} class="gap-2"><Check />Clear Local Data</Button>
			<Button type="button" color="gray" outline onclick={onCancel} class="gap-2"
				>Cancel<X /></Button
			>
		</div>
	</div>
</Modal>
