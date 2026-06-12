import { bluetoothState } from './store.svelte';
import { savedCubesState } from './savedCubes.svelte';
import { connectSmartCube } from 'smartcube-web-bluetooth';

export async function connectNewCube() {
	if (bluetoothState.isConnecting) return;

	bluetoothState.setIsConnecting(true);
	bluetoothState.setErrorMessage(null);
	console.log('[F2LTrainer] Connecting to smart cube...');

	try {
		const conn = await connectSmartCube({
			macAddressProvider: async (device, isFallbackCall) => {
				return new Promise((resolve) => {
					// Use existing logic to get MAC
					const existingCube = savedCubesState.getCube(device.id);
					bluetoothState.requestMacAddress(
						isFallbackCall ?? false,
						existingCube?.macAddress || null,
						null,
						(mac) => resolve(mac || null)
					);
				});
			}
		});

		bluetoothState.setConnected(true);
		bluetoothState.setDeviceName(conn.deviceName);
		bluetoothState.setDeviceMac(conn.deviceMAC);
		const deviceId = conn.deviceMAC || conn.deviceName || 'unknown';
		bluetoothState.setDeviceId(deviceId);

		// Auto-save or update the cube entry
		const existingByMac = conn.deviceMAC ? savedCubesState.getCubeByMac(conn.deviceMAC) : null;
		const existingById = savedCubesState.getCube(deviceId);
		const existing = existingByMac || existingById;

		savedCubesState.addCube(
			deviceId,
			conn.deviceName,
			existing?.customName, // Keep existing name
			conn.deviceMAC || undefined
		);

		const sub = conn.events$.subscribe((event) => {
			if (event.type === 'FACELETS') {
				bluetoothState.handleCubeCallback(event.facelets, []);
			} else if (event.type === 'MOVE') {
				bluetoothState.handleCubeCallback(bluetoothState.facelet || '', [event.move]);
			} else if (event.type === 'BATTERY') {
				bluetoothState.setBatteryLevel(event.batteryLevel);
			} else if (event.type === 'DISCONNECT') {
				bluetoothState.setConnected(false);
			}
		});

		bluetoothState.setCurrentConnection(conn, sub);

		// Optionally request battery and facelets to initialize state
		if (conn.capabilities.battery) {
			conn.sendCommand({ type: 'REQUEST_BATTERY' }).catch(() => {});
		}
		if (conn.capabilities.facelets) {
			conn.sendCommand({ type: 'REQUEST_FACELETS' }).catch(() => {});
		}

		console.log('[F2LTrainer] Successfully connected to smart cube:', conn.deviceName);
	} catch (e: any) {
		const isMacRequiredCancel = e.message && e.message.includes('MAC');
		if (!isMacRequiredCancel) {
			console.error('[F2LTrainer] Connection failed:', e);
			bluetoothState.setErrorMessage(e.toString());
		} else {
			console.log('[F2LTrainer] Connection cancelled by user (MAC required or aborted)');
		}
	} finally {
		bluetoothState.setIsConnecting(false);
	}
}

export async function connectSavedCube(deviceId: string) {
	// With the new generic library, connecting to a saved cube
	// is the exact same process as connecting to a new one
	// because the browser handles the device picker and pairing natively.
	// Just launch the picker.
	await connectNewCube();
}

export async function disconnectCube() {
	console.log('[F2LTrainer] User requested disconnect');
	try {
		const conn = bluetoothState.currentConnection;
		if (conn) {
			await conn.disconnect();
			bluetoothState.setCurrentConnection(null, null);
		}
		bluetoothState.setConnected(false);
		console.log('[F2LTrainer] Disconnected successfully');
	} catch (e: any) {
		console.warn('[F2LTrainer] Disconnect error:', e);
	}
}
