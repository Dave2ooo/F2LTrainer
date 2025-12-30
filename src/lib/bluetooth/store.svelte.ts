import { GiikerCube } from './core/bluetooth';

// Move subscription types
type MoveSubscriber = {
	callback: (move: string) => void;
	priority: number; // Higher priority = takes precedence
};

let isConnected = $state(false);
let isConnecting = $state(false);
let deviceName = $state<string | null>(null);
let deviceId = $state<string | null>(null);
let deviceMac = $state<string | null>(null);
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

let history = $state([] as { move: string; counter: number }[]);

// Move subscribers map (id -> { callback, priority })
const moveSubscribers = new Map<string, MoveSubscriber>();

export const bluetoothState = {
	get isConnected() {
		return isConnected;
	},
	get deviceName() {
		return deviceName;
	},
	get deviceId() {
		return deviceId;
	},
	get deviceMac() {
		return deviceMac;
	},
	get batteryLevel() {
		return batteryLevel;
	},
	get facelet() {
		return facelet;
	},
	get history() {
		return history;
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
			history = [];
		}
	},
	setDeviceName(name: string | null) {
		deviceName = name;
	},
	setDeviceId(id: string | null) {
		deviceId = id;
	},
	setDeviceMac(mac: string | null) {
		deviceMac = mac;
	},
	setBatteryLevel(level: number | null) {
		batteryLevel = level;
	},
	setErrorMessage(msg: string | null) {
		errorMessage = msg;
	},
	// MAC Address Request Handling
	requestMacAddress(
		isWrongKey: boolean,
		deviceMac: string | null,
		defaultMac: string | null,
		resolve: (mac: string | undefined) => void
	) {
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
			history.push({ move: lastMove, counter: moveCounter });
			// keep history small
			if (history.length > 50) {
				history.shift();
			}

			// Dispatch move to highest-priority subscriber only
			if (moveSubscribers.size > 0) {
				let highestPriority = -Infinity;
				let activeSubscriber: MoveSubscriber | null = null;

				for (const subscriber of moveSubscribers.values()) {
					if (subscriber.priority > highestPriority) {
						highestPriority = subscriber.priority;
						activeSubscriber = subscriber;
					}
				}

				if (activeSubscriber) {
					activeSubscriber.callback(lastMove);
				}
			}
		}
	},
	getMovesSince(lastCounter: number) {
		return history.filter((h) => h.counter > lastCounter);
	},
	// Connection process state
	get isConnecting() {
		return isConnecting;
	},
	setIsConnecting(connecting: boolean) {
		isConnecting = connecting;
	},
	// Move subscription methods
	subscribeToMoves(id: string, callback: (move: string) => void, priority: number) {
		moveSubscribers.set(id, { callback, priority });
	},
	unsubscribeFromMoves(id: string) {
		moveSubscribers.delete(id);
	}
};
