<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Bluetooth } from '@lucide/svelte';
	import BluetoothModal from './Modals/BluetoothModal.svelte';

	let open = $state(false);

	function onConnectCube() {
		open = true;
	}
</script>

<Button
	class="bg-transparent p-0 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
	onclick={onConnectCube}
>
	<Bluetooth class="size-8 text-primary-600 md:size-9" />
</Button>
<Tooltip placement="bottom">Connect Cube</Tooltip>

<BluetoothModal bind:open />
