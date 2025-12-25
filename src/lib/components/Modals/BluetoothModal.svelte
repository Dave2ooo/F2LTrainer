<script lang="ts">
	import { Button, Spinner, Input, Label } from 'flowbite-svelte';
	import Modal from '../Modal.svelte';
	import RemoveCubeModal from './RemoveCubeModal.svelte';
	import { Bluetooth, BluetoothConnected, Plus, Trash2, Edit2, Check, X } from '@lucide/svelte';
	import { GiikerCube } from '$lib/bluetooth/index';
	import { bluetoothState } from '$lib/bluetooth/store.svelte';
	import { savedCubesState } from '$lib/bluetooth/savedCubes.svelte';
	import TwistyPlayer from '../TwistyPlayer.svelte';

	let { open = $bindable(false) } = $props();

	let isConnecting = $state(false);
	let error = $state<string | null>(null);
	let twistyPlayerComponent = $state<any>(null);
	let macInput = $state('');
	let customCubeName = $state('');
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
		isConnecting = true;
		error = null;
		bluetoothState.setErrorMessage(null);
		try {
			await GiikerCube.init();
			// After successful connection, offer to save the cube
			if (bluetoothState.deviceId && bluetoothState.deviceName) {
				const existing = savedCubesState.getCube(bluetoothState.deviceId);
				if (existing) {
					savedCubesState.addCube(
						bluetoothState.deviceId,
						bluetoothState.deviceName,
						existing.customName,
						bluetoothState.deviceMac || undefined
					);
				}
			}
		} catch (e: any) {
			console.error(e);
			error = e.toString();
		} finally {
			isConnecting = false;
		}
	}

	async function onConnectSaved(deviceId: string) {
		const saved = savedCubesState.getCube(deviceId);
		if (!saved) return;

		isConnecting = true;
		error = null;
		bluetoothState.setErrorMessage(null);
		try {
			await GiikerCube.init(true);
			if (bluetoothState.deviceId && bluetoothState.deviceName) {
				savedCubesState.addCube(
					bluetoothState.deviceId,
					bluetoothState.deviceName,
					saved.customName,
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
		await GiikerCube.stop();
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

	function onSaveCube() {
		if (bluetoothState.deviceId && bluetoothState.deviceName) {
			const name = customCubeName.trim() || bluetoothState.deviceName;
			savedCubesState.addCube(
				bluetoothState.deviceId,
				bluetoothState.deviceName,
				name,
				bluetoothState.deviceMac || undefined
			);
			customCubeName = '';
		}
	}

	async function onRemoveCube(deviceId: string) {
		const cube = savedCubesState.getCube(deviceId);
		if (!cube) return;

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
		if (editingCubeId && editingCubeName.trim()) {
			savedCubesState.renameCube(editingCubeId, editingCubeName.trim());
			editingCubeId = null;
			editingCubeName = '';
		}
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

	$effect(() => {
		// Auto-close custom name input when disconnecting
		if (!bluetoothState.isConnected) {
			customCubeName = '';
		}
	});
</script>

<Modal bind:open title="Bluetooth Cube" size="md">
	<div class="flex flex-col gap-4 py-4">
		{#if bluetoothState.isConnected}
			<div class="flex flex-col items-center gap-2 text-green-500">
				<BluetoothConnected class="size-16" />
				<p class="text-lg font-semibold">Connected</p>
				{#if bluetoothState.deviceId}
					{@const savedCube = savedCubesState.getCube(bluetoothState.deviceId)}
					{#if savedCube}
						<p class="text-base font-medium text-gray-900 dark:text-white">
							{savedCube.customName}
						</p>
					{:else if bluetoothState.deviceName}
						<p class="text-sm text-gray-500 dark:text-gray-400">{bluetoothState.deviceName}</p>
					{/if}
				{:else if bluetoothState.deviceName}
					<p class="text-sm text-gray-500 dark:text-gray-400">{bluetoothState.deviceName}</p>
				{/if}
				{#if bluetoothState.deviceMac}
					<p class="text-xs text-gray-400 dark:text-gray-500 font-mono">
						MAC: {bluetoothState.deviceMac}
					</p>
				{/if}
				{#if bluetoothState.batteryLevel !== null}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Battery: {bluetoothState.batteryLevel}%
					</p>
				{/if}
			</div>

			<!-- Cube visualization -->
			<div class="mx-auto h-64 w-64">
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

			<!-- Save cube option -->
			{#if bluetoothState.deviceId && !savedCubesState.getCube(bluetoothState.deviceId)}
				<div class="flex flex-col gap-2">
					<Label>Save this cube</Label>
					<div class="flex gap-2">
						<Input
							type="text"
							bind:value={customCubeName}
							placeholder={bluetoothState.deviceName || 'My Cube'}
							class="flex-1"
						/>
						<Button color="blue" onclick={onSaveCube}>
							<Plus class="mr-2 size-4" />
							Save
						</Button>
					</div>
				</div>
			{/if}

			<!-- Action buttons -->
			<div class="flex w-full gap-2">
				<Button color="light" class="flex-1" onclick={onSync}>Sync (Reset)</Button>
				<Button color="red" class="flex-1" onclick={onDisconnect}>Disconnect</Button>
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Not connected indicator -->
				<div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
					<Bluetooth class="size-16" />
					<p class="text-lg font-semibold">Not Connected</p>
				</div>

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
					<!-- Saved cubes list -->
					{#if savedCubesState.cubes.length > 0}
						<div class="flex flex-col gap-2">
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Saved Cubes ({savedCubesState.cubes.length})
							</h3>
							<div class="flex flex-col gap-2">
								{#each savedCubesState.cubes as cube (cube.id)}
									<div
										class="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
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
												</div>
											</div>
											<div class="flex shrink-0 items-center gap-2">
												<Button
													size="sm"
													color="blue"
													onclick={() => onConnectSaved(cube.id)}
													disabled={isConnecting}
												>
													Connect
												</Button>
												<Button size="xs" color="light" onclick={() => startEditingCube(cube.id)}>
													<Edit2 class="size-4" />
												</Button>
												<Button size="xs" color="red" onclick={() => onRemoveCube(cube.id)}>
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
						disabled={isConnecting}
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
		{/if}
	</div>
</Modal>

<RemoveCubeModal bind:this={removeCubeModal} />
