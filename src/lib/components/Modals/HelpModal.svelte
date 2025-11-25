<script lang="ts">
	import { Modal, Button } from 'flowbite-svelte';
	import { X } from '@lucide/svelte';

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	export function closeModal() {
		open = false;
	}
</script>

<Modal bind:open title="Help" size="md" outsideclose={true} autoclose={false}>
	<div class="space-y-4">
		<!-- Help content will be added here -->
	</div>

	<div class="mt-6 flex w-full justify-center">
		<Button type="button" color="gray" outline onclick={closeModal} class="gap-2">
			Close<X />
		</Button>
	</div>
</Modal>
