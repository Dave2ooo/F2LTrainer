/**
 * Example: How to use the Bluetooth Smart Cube integration
 * This file demonstrates the basic usage pattern
 */

import { GiikerCube } from './core/bluetooth';
import './cubes/giikercube'; // Register Giiker cube

// Set up callback to receive cube state updates
GiikerCube.setCallback((facelet, prevMoves, timestamps, deviceName) => {
	console.log('Cube state updated:', {
		facelet,
		prevMoves,
		deviceTime: timestamps[0],
		localTime: timestamps[1],
		deviceName
	});
});

// Set up event callback for connection events
GiikerCube.setEventCallback((info, event) => {
	console.log('Bluetooth event:', info, event);
	if (info === 'disconnect') {
		console.log('Cube disconnected');
	}
});

// Example: Connect to a cube
export async function connectCube() {
	try {
		await GiikerCube.init();
		console.log('Successfully connected to cube');

		// Get battery level
		const cube = GiikerCube.getCube();
		if (cube) {
			const [batteryLevel, deviceName] = await cube.getBatteryLevel();
			console.log(`Battery: ${batteryLevel}% (${deviceName})`);
		}
	} catch (error) {
		console.error('Failed to connect:', error);
	}
}

// Example: Disconnect from cube
export async function disconnectCube() {
	try {
		await GiikerCube.stop();
		console.log('Disconnected from cube');
	} catch (error) {
		console.error('Failed to disconnect:', error);
	}
}

// Example: Check connection status
export function isCubeConnected(): boolean {
	return GiikerCube.isConnected();
}
