import { bluetoothState } from './store.svelte';
import { savedCubesState, type SavedCube } from './savedCubes.svelte';
import { connectSmartCube, type SmartCubeConnection } from 'smartcube-web-bluetooth';

let activeConnection: SmartCubeConnection | null = null;

export async function connectCube(savedCube?: SavedCube) {
	if (bluetoothState.isConnecting) return;

	bluetoothState.setIsConnecting(true);
	bluetoothState.setErrorMessage(null);
	console.log('[F2LTrainer] Connecting to cube...', savedCube?.deviceName || 'new');

	try {
		const conn = await connectSmartCube({
			deviceName: savedCube?.deviceName,
			macAddressProvider: async (device, isFallbackCall) => {
				// We don't have device.id stored for Giiker/GoCube, but for GAN cubes
				// where MAC is required, we can check if we've saved it by macAddress
				// or if we happened to save device.id previously before the migration.
				const existing = savedCubesState.cubes.find((c) => 
					c.id === device.id || 
					(device.name && c.deviceName === device.name) ||
					(device.name && c.customName === device.name)
				);
				if (existing?.macAddress && !isFallbackCall) {
					return existing.macAddress;
				}

				return new Promise((resolve) => {
					bluetoothState.requestMacAddress(!!isFallbackCall, null, null, (mac) => {
						resolve(mac || null);
					});
				});
			}
		});

		activeConnection = conn;

		// Setup subscriptions
		conn.events$.subscribe({
			next: (event) => {
				if (event.type === 'MOVE') {
					bluetoothState.pushMove(event.move);
				} else if (event.type === 'FACELETS') {
					bluetoothState.setFacelet(event.facelets);
				} else if (event.type === 'BATTERY') {
					bluetoothState.setBatteryLevel(event.batteryLevel);
				} else if (event.type === 'DISCONNECT') {
					bluetoothState.setConnected(false);
					activeConnection = null;
				}
			},
			error: (err) => {
				console.error('[F2LTrainer] Connection error:', err);
				bluetoothState.setErrorMessage(err.toString());
				bluetoothState.setConnected(false);
				activeConnection = null;
			}
		});

		bluetoothState.setConnected(true);
		bluetoothState.setDeviceName(conn.deviceName);

		const idToSave = conn.deviceMAC || conn.deviceName;
		bluetoothState.setDeviceId(idToSave);
		bluetoothState.setDeviceMac(conn.deviceMAC || null);

		// Auto-save or update the cube entry
		savedCubesState.addCube(
			idToSave,
			conn.deviceName,
			savedCube?.customName, // Keep existing name if reconnecting
			conn.deviceMAC || undefined
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
		activeConnection = null;
	}
}
