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

<Modal bind:open title="Clear Cloud Data?" size="sm" outsideclose={false} autoclose={false}>
	<div class="space-y-4">
		<p>
			Are you sure you want to delete all your cloud data? This will permanently delete all your
			synced case states, sessions, and solves from the cloud.
		</p>

		<p class="text-sm text-gray-600 dark:text-gray-400">
			Your local data on this device will remain unchanged. This action cannot be undone.
		</p>

		<div class="mt-6 flex w-full justify-center gap-3">
			<Button color="red" onclick={onConfirm} class="gap-2"><Check />Clear Cloud Data</Button>
			<Button type="button" color="gray" outline onclick={onCancel} class="gap-2"
				>Cancel<X /></Button
			>
		</div>
	</div>
</Modal>
