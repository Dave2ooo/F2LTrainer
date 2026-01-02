<script lang="ts">
	import Modal from '../Modal.svelte';
	import { P } from 'flowbite-svelte';

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	function onClose() {
		open = false;
	}
</script>

<Modal
	bind:open
	title="Session Statistics"
	size="md"
	outsideclose={true}
	autoclose={false}
	placement="top-center"
	class="mt-8"
>
	<div class="flex w-full flex-col items-center gap-4 p-4">
		<P class="text-gray-500 dark:text-gray-400">
			Session statistics will be displayed here. This is a placeholder.
		</P>
	</div>
</Modal>
