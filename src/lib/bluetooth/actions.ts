import { GiikerCube } from './index';
import { bluetoothState } from './store.svelte';
import { savedCubesState } from './savedCubes.svelte';

export async function connectNewCube() {
	if (bluetoothState.isConnecting) return;

	bluetoothState.setIsConnecting(true);
	bluetoothState.setErrorMessage(null);
	console.log('[F2LTrainer] Connecting to new cube...');

	try {
		await GiikerCube.init(false, undefined);
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
		console.log('[F2LTrainer] Successfully connected to new cube:', bluetoothState.deviceName);
	} catch (e: any) {
		if (e.message !== 'MAC address required') {
			console.error('[F2LTrainer] Connection failed:', e);
			bluetoothState.setErrorMessage(e.toString());
		} else {
			console.log('[F2LTrainer] Connection cancelled by user (MAC required)');
		}
	} finally {
		bluetoothState.setIsConnecting(false);
	}
}

export async function connectSavedCube(deviceId: string) {
	if (bluetoothState.isConnecting) return;

	const saved = savedCubesState.getCube(deviceId);
	if (!saved) return;

	console.log('[F2LTrainer] Connecting to saved cube:', saved.customName, 'MAC:', saved.macAddress);
	bluetoothState.setIsConnecting(true);
	bluetoothState.setErrorMessage(null);

	try {
		await GiikerCube.init(true, saved.macAddress);
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
		console.log('[F2LTrainer] Successfully connected to saved cube:', saved.customName);
	} catch (e: any) {
		console.error('[F2LTrainer] Connection to saved cube failed:', e);
		bluetoothState.setErrorMessage(e.toString());
	} finally {
		bluetoothState.setIsConnecting(false);
	}
}

export async function disconnectCube() {
	console.log('[F2LTrainer] User requested disconnect');
	try {
		await GiikerCube.stop();
		console.log('[F2LTrainer] Disconnected successfully');
	} catch (e: any) {
		console.warn('[F2LTrainer] Disconnect error:', e);
		// Don't show error to user - disconnect errors are usually harmless
	}
}
