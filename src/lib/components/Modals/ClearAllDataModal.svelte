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

<Modal bind:open title="Clear All Data?" size="sm" outsideclose={false} autoclose={false}>
	<div class="space-y-4">
		<p class="font-semibold text-red-700 dark:text-red-500">⚠️ This will delete EVERYTHING</p>

		<p>Are you sure you want to clear all data everywhere? This will permanently delete:</p>

		<ul class="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
			<li>All local data on this device</li>
			<li>All cloud data (case states, sessions, solves)</li>
			<li>All your saved settings and progress</li>
		</ul>

		<p class="text-sm font-semibold text-red-600 dark:text-red-400">
			This action cannot be undone!
		</p>

		<div class="mt-6 flex w-full justify-center gap-3">
			<Button color="red" onclick={onConfirm} class="gap-2"><Check />Delete Everything</Button>
			<Button type="button" color="gray" outline onclick={onCancel} class="gap-2"
				>Cancel<X /></Button
			>
		</div>
	</div>
</Modal>
