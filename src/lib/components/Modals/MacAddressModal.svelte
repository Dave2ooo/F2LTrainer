<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import Update from './Buttons/Update.svelte';
	import { Copy, Bluetooth } from '@lucide/svelte';

	let macInput = $state('');
	let copiedChromeFlags = $state(false);
	const macPattern = '^([0-9A-Fa-f]{2}[:\\-]){5}([0-9A-Fa-f]{2})$';

	$effect(() => {
		if (bluetoothState.macAddressRequest.isOpen) {
			macInput = bluetoothState.macAddressRequest.deviceMac || '';
			copiedChromeFlags = false;
		} else if (bluetoothState.macAddressRequest.resolve) {
			// If closed via backdrop (resolve is still pending), treat as cancel
			handleCancel();
		}
	});

	function handleSubmit() {
		bluetoothState.submitMacAddress(macInput || '');
	}

	function handleCancel() {
		bluetoothState.cancelMacAddressRequest();
	}

	async function copyChromeFlags() {
		const url = 'chrome://flags/#enable-experimental-web-platform-features';
		try {
			await navigator.clipboard.writeText(url);
			copiedChromeFlags = true;
			setTimeout(() => (copiedChromeFlags = false), 1500);
		} catch (e) {
			console.error('Failed to copy', e);
		}
	}
</script>

<Modal
	bind:open={bluetoothState.macAddressRequest.isOpen}
	title="Enter MAC Address"
	size="md"
	outsideclose={false}
	class="z-[60]"
>
	<form
		class="flex flex-col gap-4"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div
			class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
		>
			<div class="mb-4 space-y-2">
				<p class="font-semibold text-blue-900 dark:text-blue-200">iOS (iPhone/iPad) Users:</p>
				<p class="text-xs">
					Safari on iOS does not support Web Bluetooth. Please download <a
						href="https://apps.apple.com/app/bluefy-web-bluetooth-browser/id1492822055"
						target="_blank"
						class="underline hover:text-blue-700 dark:hover:text-blue-100"
						>Bluefy - Web Bluetooth Browser</a
					> from the App Store and open the F2L Trainer inside it.
				</p>
			</div>

			<hr class="mb-4 border-blue-200 dark:border-blue-800" />

			<p class="mb-2 font-semibold text-blue-900 dark:text-blue-200">Chrome/Edge Users:</p>
			<p class="mb-2 text-xs">
				To enable automatic discovery (no manual MAC address needed), enable the following flag and
				connect again:
			</p>
			<div class="flex items-center gap-2">
				<code class="flex-1 rounded bg-blue-100 p-1 font-mono text-xs dark:bg-blue-900/50">
					chrome://flags/#enable-experimental-web-platform-features
				</code>
				<Button size="xs" color="light" onclick={copyChromeFlags} class="gap-1 whitespace-nowrap">
					<Copy class="size-3" />
					{copiedChromeFlags ? 'Copied!' : 'Copy'}
				</Button>
			</div>
			<p class="mt-2 text-xs opacity-75">
				You must copy and paste this into your browser's address bar.
			</p>
		</div>

		<hr class="border-gray-200 dark:border-gray-700" />

		<p class:text-red-500={bluetoothState.macAddressRequest.isWrongKey} class="text-sm">
			{bluetoothState.macAddressRequest.isWrongKey
				? 'The MAC provided might be wrong! Please enter the Bluetooth MAC address of your cube:'
				: 'Please enter the Bluetooth MAC address of your cube:'}
		</p>
		<div class="flex flex-col gap-2">
			<Label>MAC Address</Label>
			<Input
				type="text"
				bind:value={macInput}
				placeholder={'xx:xx:xx:xx:xx:xx'}
				required
				pattern={macPattern}
				maxlength={17}
			/>
		</div>

		<Update onCancel={handleCancel} submitText="Connect" Icon={Bluetooth} />
	</form>
</Modal>
