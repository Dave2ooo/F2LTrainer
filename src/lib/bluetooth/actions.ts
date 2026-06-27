import { bluetoothState } from './store.svelte';
import { savedCubesState, type SavedCube } from './savedCubes.svelte';
import { connectSmartCube, type SmartCubeConnection } from 'smartcube-web-bluetooth';

let activeConnection: SmartCubeConnection | null = null;
let activeSubscription: { unsubscribe(): void } | null = null;

function cleanupConnection() {
	if (activeSubscription) {
		activeSubscription.unsubscribe();
		activeSubscription = null;
	}
	activeConnection = null;
}

export async function connectCube(savedCube?: SavedCube) {
	if (bluetoothState.isConnecting) return;
	if (bluetoothState.isConnected) return;

	bluetoothState.setIsConnecting(true);
	bluetoothState.setErrorMessage(null);
	bluetoothState.setStatusMessage(null);
	console.log('[F2LTrainer] Connecting to cube...', savedCube?.deviceName || 'new');

	try {
		const conn = await connectSmartCube({
			// For migrated cubes that don't yet have deviceName stored,
			// fall back to customName (which defaults to the original device name)
			deviceName: savedCube?.deviceName ?? savedCube?.customName,
			enableAddressSearch: true,
			onStatus: (msg) => {
				console.log('[F2LTrainer] Status:', msg);
				bluetoothState.setStatusMessage(msg);
			},
			macAddressProvider: async (device, isFallbackCall) => {
				const existing = savedCubesState.cubes.find((c) =>
					c.id === device.id ||
					(device.name && c.deviceName === device.name)
				);
				if (existing?.macAddress) {
					return existing.macAddress;
				}

				// If the library is just checking if we have a cached MAC (isFallbackCall = false),
				// and we don't have one, return null immediately so it can try automatic discovery.
				if (!isFallbackCall) {
					return null;
				}

				// The library failed to find the MAC automatically. Prompt the user as a last resort.
				return new Promise((resolve) => {
					bluetoothState.requestMacAddress(!!isFallbackCall, null, null, device.name || null, (mac) => {
						resolve(mac || null);
					});
				});
			}
		});

		// Clean up any previous connection before setting up the new one
		cleanupConnection();
		activeConnection = conn;

		// Setup event subscription
		activeSubscription = conn.events$.subscribe({
			next: (event) => {
				if (event.type === 'MOVE') {
					bluetoothState.pushMove(event.move);
				} else if (event.type === 'FACELETS') {
					bluetoothState.setFacelet(event.facelets);
				} else if (event.type === 'BATTERY') {
					bluetoothState.setBatteryLevel(event.batteryLevel);
				} else if (event.type === 'HARDWARE') {
					console.log('[F2LTrainer] Successfully connected to cube:', {
						hardwareName: event.hardwareName,
						softwareVersion: event.softwareVersion,
						hardwareVersion: event.hardwareVersion,
						productDate: event.productDate,
						gyroSupported: event.gyroSupported
					});
				} else if (event.type === 'DISCONNECT') {
					bluetoothState.setConnected(false);
					cleanupConnection();
				}
			},
			error: (err) => {
				console.error('[F2LTrainer] Connection error:', err);
				bluetoothState.setErrorMessage(err.toString());
				bluetoothState.setConnected(false);
				cleanupConnection();
			}
		});

		bluetoothState.setConnected(true);
		bluetoothState.setDeviceName(conn.deviceName);

		if (conn.capabilities?.hardware) {
			await conn.sendCommand({ type: 'REQUEST_HARDWARE' }).catch(console.warn);
		}
		if (conn.capabilities?.facelets) {
			await conn.sendCommand({ type: 'REQUEST_FACELETS' }).catch(console.warn);
		}
		if (conn.capabilities?.battery) {
			await conn.sendCommand({ type: 'REQUEST_BATTERY' }).catch(console.warn);
		}

		// deviceMAC is '' (empty string) for cubes that don't use MAC-based encryption
		// (Giiker, GoCube, MoYu-MHC). In that case, fall back to deviceName as the ID.
		// Note: deviceName may not be unique across multiple physical cubes of the same brand.
		const mac = conn.deviceMAC || undefined;
		const idToSave = mac || conn.deviceName;
		bluetoothState.setDeviceId(idToSave);
		bluetoothState.setDeviceMac(mac ?? null);

		// Auto-save or update the cube entry
		// Only carry over the saved cube's custom name if the connected cube
		// actually matches — the user may have picked a different device in the BLE picker
		const isReconnectingSameCube = savedCube != null && idToSave === savedCube.id;
		savedCubesState.addCube(
			idToSave,
			conn.deviceName,
			isReconnectingSameCube ? savedCube.customName : undefined,
			mac
		);

		console.log('[F2LTrainer] Successfully connected to cube:', conn.deviceName);
	} catch (e: any) {
		console.error('[F2LTrainer] Connection failed:', e);
		if (e.name !== 'NotFoundError' && e.message !== 'User cancelled the requestDevice() chooser.') {
			bluetoothState.setErrorMessage(e.toString());
		} else {
			console.log('[F2LTrainer] Connection cancelled by user');
		}
	} finally {
		bluetoothState.setIsConnecting(false);
		bluetoothState.setStatusMessage(null);
	}
}

export async function disconnectCube() {
	console.log('[F2LTrainer] User requested disconnect');
	if (activeConnection) {
		try {
			await activeConnection.disconnect();
			console.log('[F2LTrainer] Disconnected successfully');
		} catch (e: any) {
			console.warn('[F2LTrainer] Disconnect error:', e);
		}
	}
	cleanupConnection();
	bluetoothState.setConnected(false);
}
