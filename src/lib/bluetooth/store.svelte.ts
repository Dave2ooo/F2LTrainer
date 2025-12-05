import { GiikerCube } from './core/bluetooth';

let isConnected = $state(false);
let deviceName = $state<string | null>(null);
let batteryLevel = $state<number | null>(null);
let facelet = $state<string | null>(null);
let lastMove = $state<string | null>(null);

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
	get facelet() {
		return facelet;
	},
	get lastMove() {
		return lastMove;
	},
	setConnected(connected: boolean) {
		isConnected = connected;
		if (!connected) {
			facelet = null;
			lastMove = null;
		}
	},
	setDeviceName(name: string | null) {
		deviceName = name;
	},
	setBatteryLevel(level: number | null) {
		batteryLevel = level;
	},
	handleCubeCallback(newFacelet: string, prevMoves: string[]) {
		facelet = newFacelet;
		if (prevMoves.length > 0) {
			lastMove = prevMoves[0];
		}
	}
};
