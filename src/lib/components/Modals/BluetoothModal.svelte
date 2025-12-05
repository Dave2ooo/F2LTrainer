<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Bluetooth, BluetoothConnected } from '@lucide/svelte';
	import { GiikerCube } from '$lib/bluetooth/index';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';

	let { open = $bindable(false) } = $props();

	let isConnecting = $state(false);
	let error = $state<string | null>(null);

	async function onConnect() {
		isConnecting = true;
		error = null;
		try {
			await GiikerCube.init();
		} catch (e: any) {
			console.error(e);
			error = e.toString();
		} finally {
			isConnecting = false;
		}
	}

	async function onDisconnect() {
		await GiikerCube.stop();
	}
</script>

<Modal bind:open title="Bluetooth Cube" size="sm">
	<div class="flex flex-col items-center gap-4 py-4">
		{#if bluetoothState.isConnected}
			<div class="flex flex-col items-center gap-2 text-green-500">
				<BluetoothConnected class="size-16" />
				<p class="text-lg font-semibold">Connected</p>
				{#if bluetoothState.deviceName}
					<p class="text-sm text-gray-500 dark:text-gray-400">{bluetoothState.deviceName}</p>
				{/if}
				{#if bluetoothState.batteryLevel !== null}
					<p class="text-sm text-gray-500 dark:text-gray-400">Battery: {bluetoothState.batteryLevel}%</p>
				{/if}
			</div>
			<Button color="red" class="w-full" onclick={onDisconnect}>Disconnect</Button>
		{:else}
			<div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
				<Bluetooth class="size-16" />
				<p class="text-lg font-semibold">Not Connected</p>
			</div>
			
			{#if error}
				<p class="text-center text-sm text-red-500">{error}</p>
			{/if}

			<Button color="blue" class="w-full" onclick={onConnect} disabled={isConnecting}>
				{#if isConnecting}
					<Spinner class="mr-3" size="4" />Connecting...
				{:else}
					Connect Cube
				{/if}
			</Button>
		{/if}
	</div>
</Modal>
