import { GiikerCube } from './core/bluetooth';

let isConnected = $state(false);
let deviceName = $state<string | null>(null);
let batteryLevel = $state<number | null>(null);

export const bluetoothState = {
	get isConnected() {
		return isConnected;
	},
	get deviceName() {
		return deviceName;
	},
	get batteryLevel() {
		return batteryLevel;
	},
	setConnected(connected: boolean) {
		isConnected = connected;
	},
	setDeviceName(name: string | null) {
		deviceName = name;
	},
	setBatteryLevel(level: number | null) {
		batteryLevel = level;
	}
};
