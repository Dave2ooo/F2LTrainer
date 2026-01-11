<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import { Bluetooth, BluetoothConnected, EllipsisVertical } from '@lucide/svelte';
	import BluetoothModal from './Modals/BluetoothModal.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import { savedCubesState } from '$lib/bluetooth/savedCubes.svelte';
	import { connectNewCube, connectSavedCube } from '$lib/bluetooth/actions';

	let open = $state(false);

	let latestSavedCube = $derived.by(() => {
		if (savedCubesState.cubes.length === 0) return null;
		return [...savedCubesState.cubes].sort((a, b) => b.lastConnected - a.lastConnected)[0];
	});

	let buttonLabel = $derived.by(() => {
		if (bluetoothState.isConnected) {
			const saved = bluetoothState.deviceId
				? savedCubesState.getCube(bluetoothState.deviceId)
				: null;
			return saved?.customName || bluetoothState.deviceName || 'Connected';
		}
		if (latestSavedCube) {
			return latestSavedCube.customName;
		}
		return 'New Cube';
	});

	async function handleSmartConnect() {
		if (bluetoothState.isConnected) {
			// If already connected, open modal to view details/disconnect
			open = true;
			return;
		}

		if (latestSavedCube) {
			await connectSavedCube(latestSavedCube.id);
		} else {
			await connectNewCube();
		}
	}
</script>

<div class="flex items-center">
	<Button
		class="rounded-r-none border border-gray-200 bg-white px-2 py-1.5 text-gray-900 hover:bg-gray-100 focus:text-blue-700 focus:ring-2 focus:ring-blue-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-500"
		onclick={handleSmartConnect}
		disabled={bluetoothState.isConnecting}
	>
		{#if bluetoothState.isConnecting}
			<Spinner class="mr-2" size="6" />
		{:else if bluetoothState.isConnected}
			<BluetoothConnected class="mr-2 size-6 text-green-500" />
		{:else}
			<Bluetooth class="mr-2 size-6" />
		{/if}
		<span class="text-base font-medium"
			>{bluetoothState.isConnecting ? 'Connecting...' : buttonLabel}</span
		>
	</Button>
	<Button
		class="rounded-l-none border border-l-0 border-gray-200 bg-white px-1.5 py-1.5 text-gray-900 hover:bg-gray-100 focus:text-blue-700 focus:ring-2 focus:ring-blue-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-500"
		onclick={() => (open = true)}
	>
		<EllipsisVertical class="size-6" />
	</Button>
</div>

<BluetoothModal bind:open />
