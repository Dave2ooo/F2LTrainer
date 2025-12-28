<script lang="ts">
	import { Button, Spinner, Input, Label } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import RemoveCubeModal from './RemoveCubeModal.svelte';
	import { Bluetooth, Plus, Trash2, Edit2, Check, X } from '@lucide/svelte';
	import { GiikerCube } from '$lib/bluetooth/index';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import { savedCubesState } from '$lib/bluetooth/savedCubes.svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';

	let { open = $bindable(false) } = $props();

	let isConnecting = $state(false);
	let error = $state<string | null>(null);
	let twistyPlayerComponent = $state<any>(null);
	let macInput = $state('');

	let editingCubeId = $state<string | null>(null);
	let editingCubeName = $state('');
	let removeCubeModal: RemoveCubeModal;

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

	let lastProcessedMoveCounter = -1;

	$effect(() => {
		// Depend on moveCounter to trigger updates
		const currentCounter = bluetoothState.moveCounter;

		if (currentCounter > lastProcessedMoveCounter) {
			// If we just connected or reset, we might be behind, so just snap to current
			// But for modal preview, we usually start at 0 or solved anyway.

			const missedMoves = bluetoothState.getMovesSince(lastProcessedMoveCounter);
			lastProcessedMoveCounter = currentCounter;

			if (twistyPlayerComponent) {
				const el = twistyPlayerComponent.getElement();
				if (el && el.experimentalAddMove) {
					missedMoves.forEach(({ move }) => {
						try {
							const m = move.trim();
							if (m) {
								el.experimentalAddMove(m);
							}
						} catch (e) {
							console.warn('Failed to apply move:', move, e);
						}
					});
				}
			}
		}
	});

	// Reset counter when modal opens/closes or connection changes
	$effect(() => {
		if (!open || !bluetoothState.isConnected) {
			lastProcessedMoveCounter = bluetoothState.moveCounter;
		}
	});

	async function onConnect() {
		// Guard against double-clicking
		if (isConnecting) return;

		isConnecting = true;
		error = null;
		bluetoothState.setErrorMessage(null);
		try {
			await GiikerCube.init();
			// After successful connection, check if cube already exists by MAC address
			if (bluetoothState.deviceId && bluetoothState.deviceName) {
				// First check by MAC address (more reliable than deviceId)
				const existingByMac = bluetoothState.deviceMac
					? savedCubesState.getCubeByMac(bluetoothState.deviceMac)
					: null;
				// Fall back to deviceId check
				const existingById = savedCubesState.getCube(bluetoothState.deviceId);
				const existing = existingByMac || existingById;

				// Auto-save or update the cube entry
				savedCubesState.addCube(
					bluetoothState.deviceId,
					bluetoothState.deviceName,
					existing?.customName, // Keep existing name or use device name as default
					bluetoothState.deviceMac || undefined
				);
			}
		} catch (e: any) {
			console.error(e);
			error = e.toString();
		} finally {
			isConnecting = false;
		}
	}

	async function onConnectSaved(deviceId: string) {
		// Guard against double-clicking
		if (isConnecting) return;

		const saved = savedCubesState.getCube(deviceId);
		if (!saved) return;

		isConnecting = true;
		error = null;
		bluetoothState.setErrorMessage(null);
		try {
			await GiikerCube.init(true);
			if (bluetoothState.deviceId && bluetoothState.deviceName) {
				// Check if the connected cube matches any existing cube by MAC
				const existingByMac = bluetoothState.deviceMac
					? savedCubesState.getCubeByMac(bluetoothState.deviceMac)
					: null;

				// Auto-save or update the cube entry
				savedCubesState.addCube(
					bluetoothState.deviceId,
					bluetoothState.deviceName,
					existingByMac?.customName, // Keep existing name or use device name as default
					bluetoothState.deviceMac || undefined
				);
			} else {
				savedCubesState.updateLastConnected(deviceId);
			}
		} catch (e: any) {
			console.error(e);
			error = e.toString();
		} finally {
			isConnecting = false;
		}
	}

	async function onDisconnect() {
		try {
			await GiikerCube.stop();
		} catch (e: any) {
			console.warn('Disconnect error:', e);
			// Don't show error to user - disconnect errors are usually harmless
		}
	}

	function onSync() {
		if (twistyPlayerComponent) {
			const el = twistyPlayerComponent.getElement();
			if (el) {
				el.experimentalSetupAlg = '';
				el.alg = '';
				el.jumpToStart();
			}
		}
	}

	async function onRemoveCube(deviceId: string) {
		const cube = savedCubesState.getCube(deviceId);
		if (!cube || !removeCubeModal) return;

		const confirmed = await removeCubeModal.confirm(cube.customName);
		if (confirmed) {
			savedCubesState.removeCube(deviceId);
		}
	}

	function startEditingCube(deviceId: string) {
		const cube = savedCubesState.getCube(deviceId);
		if (cube) {
			editingCubeId = deviceId;
			editingCubeName = cube.customName;
		}
	}

	function saveEditCube() {
		if (!editingCubeId) return;

		const trimmedName = editingCubeName.trim();
		if (!trimmedName) {
			// Don't allow empty names - revert to original
			cancelEditCube();
			return;
		}

		savedCubesState.renameCube(editingCubeId, trimmedName);
		editingCubeId = null;
		editingCubeName = '';
	}

	function cancelEditCube() {
		editingCubeId = null;
		editingCubeName = '';
	}

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}
</script>

<Modal bind:open title="Bluetooth Cube" size="md">
	<div class="flex flex-col gap-4 py-4">
		<!-- Top section: TwistyPlayer when connected, Bluetooth icon when not -->
		{#if bluetoothState.isConnected}
			<div class="flex flex-col items-center gap-2">
				<div class="mx-auto h-48 w-48">
					<TwistyPlayer
						side="right"
						crossColor="yellow"
						frontColor="green"
						stickering="fully"
						customAlgorithm={{ left: '', right: '' }}
						algorithmSelection={{ left: null, right: null }}
						controlPanel="none"
						experimentalDragInput="auto"
						showVisibilityToggle={false}
						class="h-full w-full"
						bind:this={twistyPlayerComponent}
						tempoScale={5}
					/>
				</div>
				<Button color="light" size="sm" onclick={onSync}>Sync (Reset)</Button>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
				<Bluetooth class="size-16" />
				<p class="text-lg font-semibold">Not Connected</p>
			</div>
		{/if}

		<!-- MAC address input (if requested) -->
		{#if bluetoothState.macAddressRequest.isOpen}
			<div class="flex w-full flex-col gap-4">
				<p
					class:text-red-500={bluetoothState.macAddressRequest.isWrongKey}
					class="text-center text-sm"
				>
					{bluetoothState.macAddressRequest.isWrongKey
						? 'The MAC provided might be wrong! Please enter the Bluetooth MAC address of your cube:'
						: 'Please enter the Bluetooth MAC address of your cube:'}
				</p>
				<div class="flex flex-col gap-2">
					<Label>MAC Address</Label>
					<Input
						type="text"
						bind:value={macInput}
						placeholder={bluetoothState.macAddressRequest.defaultMac || 'xx:xx:xx:xx:xx:xx'}
					/>
				</div>
				<div class="flex gap-2">
					<Button
						color="alternative"
						class="flex-1"
						onclick={() => bluetoothState.cancelMacAddressRequest()}
					>
						Cancel
					</Button>
					<Button
						color="blue"
						class="flex-1"
						onclick={() =>
							bluetoothState.submitMacAddress(
								macInput || bluetoothState.macAddressRequest.defaultMac || ''
							)}
					>
						Submit
					</Button>
				</div>
			</div>
		{:else}
			<!-- Saved cubes list (always visible) -->
			{#if savedCubesState.cubes.length > 0}
				<div class="flex flex-col gap-2">
					<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
						Saved Cubes ({savedCubesState.cubes.length})
					</h3>
					<div class="flex flex-col gap-2">
						{#each savedCubesState.cubes as cube (cube.id)}
							{@const isConnectedCube =
								bluetoothState.isConnected && bluetoothState.deviceId === cube.id}
							<div
								class="flex items-center gap-2 rounded-lg border p-3"
								class:border-green-500={isConnectedCube}
								class:bg-green-50={isConnectedCube}
								class:dark:bg-green-950={isConnectedCube}
								class:border-gray-200={!isConnectedCube}
								class:dark:border-gray-700={!isConnectedCube}
							>
								{#if editingCubeId === cube.id}
									<Input type="text" bind:value={editingCubeName} class="flex-1" />
									<Button size="xs" color="green" onclick={saveEditCube}>
										<Check class="size-4" />
									</Button>
									<Button size="xs" color="alternative" onclick={cancelEditCube}>
										<X class="size-4" />
									</Button>
								{:else}
									<div class="flex min-w-0 flex-1 flex-col">
										<p class="truncate font-semibold text-gray-900 dark:text-white">
											{cube.customName}
										</p>
										<div
											class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
										>
											<span class="whitespace-nowrap">{cube.deviceName}</span>
											<span>•</span>
											<span class="whitespace-nowrap">{formatDate(cube.lastConnected)}</span>
											{#if cube.macAddress}
												<span>•</span>
												<span class="font-mono text-xs whitespace-nowrap opacity-75"
													>{cube.macAddress}</span
												>
											{/if}
											{#if isConnectedCube && bluetoothState.batteryLevel !== null}
												<span>•</span>
												<span class="whitespace-nowrap text-green-600 dark:text-green-400"
													>{bluetoothState.batteryLevel}%</span
												>
											{/if}
										</div>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										{#if isConnectedCube}
											<Button size="sm" color="red" onclick={onDisconnect}>Disconnect</Button>
										{:else}
											<Button
												size="sm"
												color="blue"
												onclick={() => onConnectSaved(cube.id)}
												disabled={isConnecting || bluetoothState.isConnected}
											>
												Connect
											</Button>
										{/if}
										<Button size="xs" color="light" onclick={() => startEditingCube(cube.id)}>
											<Edit2 class="size-4" />
										</Button>
										<Button
											size="xs"
											color="red"
											onclick={() => onRemoveCube(cube.id)}
											disabled={isConnectedCube}
										>
											<Trash2 class="size-4" />
										</Button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Error messages -->
			{#if error || bluetoothState.errorMessage}
				<p class="text-center text-sm text-red-500">{error || bluetoothState.errorMessage}</p>
			{/if}

			<!-- Connect new cube button -->
			<Button
				color="alternative"
				size="sm"
				class="w-full"
				onclick={onConnect}
				disabled={isConnecting || bluetoothState.isConnected}
			>
				{#if isConnecting}
					<Spinner class="mr-2" size="4" />Connecting...
				{:else}
					<Plus class="mr-2 size-4" />
					Connect New Cube
				{/if}
			</Button>
		{/if}
	</div>
</Modal>

<RemoveCubeModal bind:this={removeCubeModal} />
