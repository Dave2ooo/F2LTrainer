<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import Update from './Buttons/Update.svelte';
	import { Copy, Bluetooth } from '@lucide/svelte';

	let macInput = $state('');
	let copiedChromeFlags = $state(false);
	let copiedBluetoothInternals = $state(false);
	const macPattern = '^([0-9A-Fa-f]{2}[:\\-]){5}([0-9A-Fa-f]{2})$';

	$effect(() => {
		if (bluetoothState.macAddressRequest.isOpen) {
			macInput = bluetoothState.macAddressRequest.deviceMac || '';
			copiedChromeFlags = false;
			copiedBluetoothInternals = false;
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

	async function copyBluetoothInternals() {
		const url = 'chrome://bluetooth-internals/#devices';
		try {
			await navigator.clipboard.writeText(url);
			copiedBluetoothInternals = true;
			setTimeout(() => (copiedBluetoothInternals = false), 1500);
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
		class="flex flex-col gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div
			class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
		>
			<!-- Chrome/Edge Section -->
			<div class="mb-4 space-y-3">
				<h3 class="text-lg font-bold text-blue-900 dark:text-blue-200">Chrome / Edge</h3>

				<div class="rounded bg-white/50 p-3 dark:bg-black/20">
					<p class="mb-2 font-semibold text-blue-900 dark:text-blue-200">
						GAN Cubes (Automatic Discovery)
					</p>
					<p class="mb-2">
						To enable automatic discovery for GAN cubes, enable the following experimental flag, and
						connect again:
					</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 rounded bg-blue-100 p-1.5 font-mono text-xs dark:bg-blue-900/50">
							chrome://flags/#enable-experimental-web-platform-features
						</code>
						<Button
							size="xs"
							color="gray"
							outline
							onclick={copyChromeFlags}
							class="gap-1 whitespace-nowrap"
						>
							<Copy class="size-3" />
							{copiedChromeFlags ? 'Copied!' : 'Copy'}
						</Button>
					</div>
					<p class="text-xs opacity-75">
						You must copy and paste this into your browser's address bar.
					</p>
				</div>

				<div class="rounded bg-white/50 p-3 dark:bg-black/20">
					<p class="mb-2 font-semibold text-blue-900 dark:text-blue-200">Enter Manually</p>
					<p class="mb-2">
						Alternatively, you can find your cube's MAC address by visiting the following URL:
					</p>
					{#if bluetoothState.macAddressRequest.deviceName}
						<p class="mb-2">
							Look for <strong class="font-mono"
								>{bluetoothState.macAddressRequest.deviceName}</strong
							>.
						</p>
					{/if}
					<div class="mb-1 flex items-center gap-2">
						<code class="flex-1 rounded bg-blue-100 p-1.5 font-mono text-xs dark:bg-blue-900/50">
							chrome://bluetooth-internals/#devices
						</code>
						<Button
							size="xs"
							color="gray"
							outline
							onclick={copyBluetoothInternals}
							class="gap-1 whitespace-nowrap"
						>
							<Copy class="size-3" />
							{copiedBluetoothInternals ? 'Copied!' : 'Copy'}
						</Button>
					</div>
					<p class="text-xs opacity-75">
						You must copy and paste this into your browser's address bar.
					</p>
				</div>
			</div>

			<hr class="mb-4 border-blue-200 dark:border-blue-800" />

			<!-- iOS Section -->
			<div class="space-y-2">
				<h3 class="text-lg font-bold text-blue-900 dark:text-blue-200">iOS (iPhone/iPad)</h3>
				<p>
					Safari on iOS does not support Web Bluetooth. Please download <a
						href="https://apps.apple.com/app/bluefy-web-bluetooth-browser/id1492822055"
						target="_blank"
						class="font-medium underline hover:text-blue-700 dark:hover:text-blue-100"
						>Bluefy - Web Bluetooth Browser</a
					> from the App Store and open the F2L Trainer inside it.
				</p>
			</div>
		</div>

		<hr class="border-gray-200 dark:border-gray-700" />
		<!--
		<p class:text-red-500={bluetoothState.macAddressRequest.isWrongKey}>
			{bluetoothState.macAddressRequest.isWrongKey
				? 'The MAC provided might be wrong! Please enter the Bluetooth MAC address of your cube:'
				: 'Please enter the Bluetooth MAC address of your cube:'}
		</p>
		-->
		<div class="flex flex-col gap-2">
			<Label>MAC Address</Label>
			<Input
				type="text"
				bind:value={macInput}
				placeholder="XX:XX:XX:XX:XX:XX"
				required
				pattern={macPattern}
				maxlength={17}
			/>
		</div>

		<Update onCancel={handleCancel} submitText="Connect" Icon={Bluetooth} />
	</form>
</Modal>
