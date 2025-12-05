<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Bluetooth, BluetoothConnected } from '@lucide/svelte';
	import { GiikerCube } from '$lib/bluetooth/index';

	let { open = $bindable(false) } = $props();

	let isConnecting = $state(false);
	let isConnected = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			isConnected = GiikerCube.isConnected();
		}
	});

	async function onConnect() {
		isConnecting = true;
		error = null;
		try {
			await GiikerCube.init();
			isConnected = true;
		} catch (e: any) {
			console.error(e);
			error = e.toString();
		} finally {
			isConnecting = false;
		}
	}

	async function onDisconnect() {
		await GiikerCube.stop();
		isConnected = false;
	}
</script>

<Modal bind:open title="Bluetooth Cube" size="sm">
	<div class="flex flex-col items-center gap-4 py-4">
		{#if isConnected}
			<div class="flex flex-col items-center gap-2 text-green-500">
				<BluetoothConnected class="size-16" />
				<p class="text-lg font-semibold">Connected</p>
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
