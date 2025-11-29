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

<Modal bind:open title="Import Data from URL?" size="sm" outsideclose={false} autoclose={false}>
	<div class="space-y-4">
		<p>
			The URL contains saved data. Would you like to import it? This will overwrite your current
			settings.
		</p>

		<div class="mt-6 flex w-full justify-center gap-3">
			<Button onclick={onConfirm} class="gap-2"><Check />Import</Button>
			<Button type="button" color="gray" outline onclick={onCancel} class="gap-2"
				>Cancel<X /></Button
			>
		</div>
	</div>
</Modal>
