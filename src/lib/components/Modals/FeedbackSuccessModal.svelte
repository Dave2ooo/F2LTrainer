<script lang="ts">
	import Modal from '../Modal.svelte';
	import { CircleCheck } from '@lucide/svelte';

	let open = $state(false);

	export function openModal() {
		open = true;
	}

	export function closeModal() {
		open = false;
	}
</script>

<Modal bind:open title="" size="md" outsideclose={true} autoclose={false}>
	<div class="flex flex-col items-center py-6 text-center">
		<div
			class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
		>
			<CircleCheck class="h-10 w-10 text-emerald-500" strokeWidth={2} />
		</div>
		<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Awesome, thanks!</h3>
		<p class="text-gray-800 dark:text-gray-300">
			Your message is on its way. I really appreciate the feedback and will respond as soon as I
			can.
		</p>
	</div>
</Modal>
