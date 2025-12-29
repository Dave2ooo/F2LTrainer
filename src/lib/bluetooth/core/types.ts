/**
 * TypeScript type definitions for Bluetooth cube integration
 */

/**
 * Cube model registration interface
 */
export interface CubeModel {
	/** Device name prefix(es) to match */
	prefix: string | string[];
	/** Optional Bluetooth services */
	opservs?: string[];
	/** Company Identifier Codes */
	cics?: number[];
	/** Initialize cube connection */
	init: (device: BluetoothDevice, expectedMac?: string) => Promise<void>;
	/** Get battery level */
	getBatteryLevel: () => Promise<[number, string]>;
	/** Clear/disconnect */
	clear: (isHardwareEvent?: boolean) => Promise<void>;
	/** Get MAC Address if available */
	getMacAddress?: () => Promise<string | null>;
}

/**
 * Common interface for Bluetooth Cube
 */
export interface BluetoothCube {
	/** Check if cube is connected */
	isConnected(): boolean;
	/** Initialize connection (with optional reconnect) */
	init(reconnect?: boolean, expectedMac?: string): Promise<void>;
	/** Stop/disconnect */
	stop(): Promise<void>;
	/** Get the connected cube instance */
	getCube(): CubeModel | null;
	/** Set callback for cube state changes */
	setCallback(callback: CubeCallback): void;
	/** Set event callback for connection events */
	setEventCallback(callback: EventCallback): void;
	/** Register a cube model */
	regCubeModel(model: CubeModel): void;
	/** Find UUID in array of characteristics/services */
	findUUID(elems: any[], uuid: string): any;
	/** Wait for advertisements */
	waitForAdvs(): Promise<any>;
	/** Handle disconnect */
	onDisconnect(event?: any): Promise<void>;
	/** Cube callback */
	callback(...args: any[]): any;
}

/**
 * Cube state callback
 * @param facelet - Current cube state as facelet string
 * @param prevMoves - Previous moves made
 * @param timestamps - [deviceTime, localTime] timestamps
 * @param deviceName - Name of the device (optional)
 */
export type CubeCallback = (
	facelet: string,
	prevMoves: string[],
	timestamps: [number | null, number | null],
	deviceName?: string
) => void;

/**
 * Event callback
 * @param info - Event type ('disconnect', etc.)
 * @param event - Event object
 */
export type EventCallback = (info: string, event?: any) => void;

/**
 * Battery info: [level (0-100), deviceName]
 */
export type BatteryInfo = [number, string];
