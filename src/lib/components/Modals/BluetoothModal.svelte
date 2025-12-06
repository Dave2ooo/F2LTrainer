<script lang="ts">
	import { Button, Spinner, Input, Label } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import { Bluetooth, BluetoothConnected } from '@lucide/svelte';
	import { GiikerCube } from '$lib/bluetooth/index';
	import { bluetoothState } from '$lib/bluetooth/store.svelte'
	import TwistyPlayer from '../TwistyPlayer.svelte';

	let { open = $bindable(false) } = $props();

	let isConnecting = $state(false);
	let error = $state<string | null>(null);
	let twistyPlayerComponent = $state<any>(null);
	let macInput = $state('');

	$effect(() => {
		if (bluetoothState.macAddressRequest.isOpen) {
			macInput = bluetoothState.macAddressRequest.deviceMac || '';
		}
	});

	$effect(() => {
		if (twistyPlayerComponent) {
			const el = twistyPlayerComponent.getElement();
			if (el) {
				// Clear any case-specific setup
				el.experimentalSetupAlg = '';
				el.alg = '';
				el.jumpToStart();
			}
		}
	});

	$effect(() => {
		// Depend on moveCounter to trigger updates even if the move string is the same
		void bluetoothState.moveCounter;
		if (bluetoothState.lastMove && twistyPlayerComponent) {
			const el = twistyPlayerComponent.getElement();
			if (el && el.experimentalAddMove) {
				try {
					const move = bluetoothState.lastMove.trim();
					if (move) {
						el.experimentalAddMove(move);
					}
				} catch (e) {
					console.warn('Failed to apply move:', bluetoothState.lastMove, e);
				}
			}
		}
	});

	async function onConnect() {
		isConnecting = true;
		error = null;
		bluetoothState.setErrorMessage(null);
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

	function onSync() {
		if (twistyPlayerComponent) {
			const el = twistyPlayerComponent.getElement();
			if (el) {
				el.experimentalSetupAlg = '';
				el.alg = '';
				el.jumpToStart();
				// Also clear the last move in store to prevent re-application
				// Note: bluetoothState.lastMove is read-only via getter, but we can't easily clear it without a setter.
				// However, the effect only runs on change.
				// We might need to force a re-sync of internal state if needed.
			}
		}
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
			<div class="h-64 w-64">
				<TwistyPlayer
					groupId="basic"
					caseId={1}
					side="right"
					crossColor="white"
					frontColor="red"
					stickering="fully"
					customAlgorithm={{ left: '', right: '' }}
					algorithmSelection={{ left: null, right: null }}
					controlPanel="none"
					showVisibilityToggle={false}
					class="h-full w-full"
					bind:this={twistyPlayerComponent}
					tempoScale={5}
				/>
			</div>
			<div class="flex w-full gap-2">
				<Button color="light" class="flex-1" onclick={onSync}>Sync (Reset)</Button>
				<Button color="red" class="flex-1" onclick={onDisconnect}>Disconnect</Button>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
				<Bluetooth class="size-16" />
				<p class="text-lg font-semibold">Not Connected</p>
			</div>
			
			{#if bluetoothState.macAddressRequest.isOpen}
				<div class="flex w-full flex-col gap-4">
					<p class:text-red-500={bluetoothState.macAddressRequest.isWrongKey} class="text-center text-sm">
						{bluetoothState.macAddressRequest.isWrongKey 
							? 'The MAC provided might be wrong! Please enter the Bluetooth MAC address of your cube:' 
							: 'Please enter the Bluetooth MAC address of your cube:'}
					</p>
					<div class="flex flex-col gap-2">
						<Label>MAC Address</Label>
						<Input type="text" bind:value={macInput} placeholder={bluetoothState.macAddressRequest.defaultMac || 'xx:xx:xx:xx:xx:xx'} />
					</div>
					<div class="flex gap-2">
						<Button color="alternative" class="flex-1" onclick={() => bluetoothState.cancelMacAddressRequest()}>Cancel</Button>
						<Button color="blue" class="flex-1" onclick={() => bluetoothState.submitMacAddress(macInput || bluetoothState.macAddressRequest.defaultMac || '')}>Submit</Button>
					</div>
				</div>
			{:else}
				{#if error || bluetoothState.errorMessage}
					<p class="text-center text-sm text-red-500">{error || bluetoothState.errorMessage}</p>
				{/if}

				<Button color="blue" class="w-full" onclick={onConnect} disabled={isConnecting}>
					{#if isConnecting}
						<Spinner class="mr-3" size="4" />Connecting...
					{:else}
						Connect Cube
					{/if}
				</Button>
			{/if}
		{/if}
	</div>
</Modal>
