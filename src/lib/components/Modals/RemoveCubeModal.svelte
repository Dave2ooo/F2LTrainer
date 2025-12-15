<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Trash2, X } from '@lucide/svelte';

	let open = $state(false);
	let cubeName = $state('');
	let resolvePromise: ((value: boolean) => void) | null = null;

	export function confirm(name: string): Promise<boolean> {
		cubeName = name;
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

<Modal bind:open title="Remove Saved Cube?" size="sm" outsideclose={false} autoclose={false}>
	<div class="space-y-4">
		<p>
			Are you sure you want to remove <strong class="font-semibold">{cubeName}</strong> from your
			saved cubes?
		</p>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			You can always save it again after reconnecting.
		</p>

		<div class="mt-6 flex w-full justify-center gap-3">
			<Button color="red" onclick={onConfirm} class="gap-2"><Trash2 class="size-4" />Remove</Button>
			<Button type="button" color="gray" outline onclick={onCancel} class="gap-2">
				Cancel<X class="size-4" />
			</Button>
		</div>
	</div>
</Modal>
