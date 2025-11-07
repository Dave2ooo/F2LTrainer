<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import Close from './Buttons/Close.svelte';
	import { Copy } from '@lucide/svelte';

	let open = $state(false);
	let url = $state('');
	let copied = $state(false);

	export function openModal(shareUrl: string) {
		url = shareUrl;
		copied = false;
		open = true;
	}

	export function closeModal() {
		open = false;
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			// Reset copied state after a short delay
			setTimeout(() => (copied = false), 1500);
		} catch (e) {
			// Fallback: select text for manual copy
			const el = document.getElementById('export-url-input') as HTMLInputElement | null;
			el?.select();
		}
	}
</script>

<Modal bind:open title="Share Link" size="md" outsideclose={true} autoclose={false}>
	<div class="space-y-4">
		<p class="text-gray-700">
			This link includes the Train State, Selected Algorithm, and any Custom Algorithm for each
			case. Use it to share your progress or load these case settings on another device.
		</p>

		<div>
			<Label for="export-url-input" class="mb-2">Shareable URL</Label>
			<div class="flex items-center gap-2">
				<Input id="export-url-input" type="text" bind:value={url} readonly class="flex-1" />
				<div class="flex items-center">
					<Button onclick={copyToClipboard} class="gap-2"><Copy />Copy</Button>
				</div>
			</div>
			{#if copied}
				<p class="mt-1 text-sm text-green-600">Copied to clipboard</p>
			{/if}
		</div>

		<Close onClose={closeModal} />
	</div>
</Modal>
