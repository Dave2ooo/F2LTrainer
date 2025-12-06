import { GiikerCube } from './core/bluetooth';

let isConnected = $state(false);
let deviceName = $state<string | null>(null);
let batteryLevel = $state<number | null>(null);
let facelet = $state<string | null>(null);
let lastMove = $state<string | null>(null);
let moveCounter = $state(0);
let errorMessage = $state<string | null>(null);
let macAddressRequest = $state({
	isOpen: false,
	isWrongKey: false,
	deviceMac: null as string | null,
	defaultMac: null as string | null,
	resolve: null as ((mac: string | undefined) => void) | null
});

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
	get errorMessage() {
		return errorMessage;
	},
	setConnected(connected: boolean) {
		isConnected = connected;
		if (connected) {
			errorMessage = null;
		} else {
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
	setErrorMessage(msg: string | null) {
		errorMessage = msg;
	},
	// MAC Address Request Handling
	requestMacAddress(isWrongKey: boolean, deviceMac: string | null, defaultMac: string | null, resolve: (mac: string | undefined) => void) {
		macAddressRequest.isOpen = true;
		macAddressRequest.isWrongKey = isWrongKey;
		macAddressRequest.deviceMac = deviceMac;
		macAddressRequest.defaultMac = defaultMac;
		macAddressRequest.resolve = resolve;
	},
	submitMacAddress(mac: string) {
		if (macAddressRequest.resolve) {
			macAddressRequest.resolve(mac);
		}
		bluetoothState.resetMacAddressRequest();
	},
	cancelMacAddressRequest() {
		if (macAddressRequest.resolve) {
			macAddressRequest.resolve(undefined);
		}
		bluetoothState.resetMacAddressRequest();
		isConnected = false;
	},
	resetMacAddressRequest() {
		macAddressRequest.isOpen = false;
		macAddressRequest.isWrongKey = false;
		macAddressRequest.deviceMac = null;
		macAddressRequest.defaultMac = null;
		macAddressRequest.resolve = null;
	},
	get macAddressRequest() {
		return macAddressRequest;
	},
	handleCubeCallback(newFacelet: string, prevMoves: string[]) {
		facelet = newFacelet;
		if (prevMoves.length > 0) {
			lastMove = prevMoves[0];
			moveCounter++;
		}
	}
};
