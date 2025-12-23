<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Trash2 } from '@lucide/svelte';
	import ClearStorageModal from './ClearStorageModal.svelte';
	import { clearAllLocalStorage } from '$lib/utils/localStorage';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';

	let open = $state(false);
	let clearStorageModal: ClearStorageModal;

	export function openModal() {
		open = true;
	}

	async function handleClearStorage() {
		const confirmed = await clearStorageModal.confirm();
		if (confirmed) {
			clearAllLocalStorage();
			// Reload the page to reset all state
			window.location.reload();
		}
	}
</script>

<Modal bind:open title="Settings" size="sm" outsideclose={true}>
	<div class="space-y-4">
		<!-- Appearance Section -->
		<section class="rounded-lg border border-gray-300 dark:border-gray-600 p-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
				<ThemeSwitch />
			</div>
		</section>

		<!-- Danger Zone Section -->
		<section class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
			<h3 class="text-lg font-semibold text-red-700 dark:text-red-500 mb-3">Danger Zone</h3>
			<p class="mb-4 text-sm text-red-600 dark:text-red-400">
				This will permanently delete all your progress, sessions, and settings. This action cannot be undone.
			</p>
			<Button
				size="sm"
				color="red"
				outline
				onclick={handleClearStorage}
				class="w-full gap-2 sm:w-auto"
			>
				<Trash2 size={16} />
				Clear All Data
			</Button>
		</section>
	</div>
</Modal>

<ClearStorageModal bind:this={clearStorageModal} />
