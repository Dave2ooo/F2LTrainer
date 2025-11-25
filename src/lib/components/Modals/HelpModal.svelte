<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import Close from './Buttons/Close.svelte';

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

	<Close onClose={closeModal} />
</Modal>
