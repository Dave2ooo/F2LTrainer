import { GiikerCube } from './core/bluetooth';

let isConnected = $state(false);
let deviceName = $state<string | null>(null);
let batteryLevel = $state<number | null>(null);
let facelet = $state<string | null>(null);
let lastMove = $state<string | null>(null);
let moveCounter = $state(0);

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
	get moveCounter() {
		return moveCounter;
	},
	setConnected(connected: boolean) {
		isConnected = connected;
		if (!connected) {
			facelet = null;
			lastMove = null;
			moveCounter = 0;
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
			moveCounter++;
		}
	}
};
