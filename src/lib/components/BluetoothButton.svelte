<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Bluetooth, BluetoothConnected } from '@lucide/svelte';
	import BluetoothModal from './Modals/BluetoothModal.svelte';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';

	let open = $state(false);

	function onConnectCube() {
		open = true;
	}
</script>

<Button
	class="bg-transparent p-0 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
	onclick={onConnectCube}
>
	{#if bluetoothState.isConnected}
		<BluetoothConnected class="size-8 text-green-500 md:size-9" />
	{:else}
		<Bluetooth class="size-8 text-primary-600 md:size-9" />
	{/if}
</Button>
<Tooltip placement="bottom">Connect Cube</Tooltip>

<BluetoothModal bind:open />
