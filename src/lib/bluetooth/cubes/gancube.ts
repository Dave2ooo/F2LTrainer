/**
 * GAN Cube implementation
 * Ported from csTimer's gancube.js
 */

import { GiikerCube } from '../core/bluetooth';
import { CubieCube, SOLVED_FACELET, valuedArray } from '../core/mathlib';
import { giikerutil, $ } from '../core/utils';
import type { CubeModel } from '../core/types';
import LZString from 'lz-string';

const mathlib = {
	CubieCube,
	SOLVED_FACELET,
	valuedArray
};

let _gatt: BluetoothRemoteGATTServer | null = null;
let _service_data: BluetoothRemoteGATTService | null = null;
let _service_meta: BluetoothRemoteGATTService | null = null;
let _chrct_f2: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_f5: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_f6: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_f7: BluetoothRemoteGATTCharacteristic | null = null;

const UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';
const SERVICE_UUID_META = '0000180a' + UUID_SUFFIX;
const CHRCT_UUID_VERSION = '00002a28' + UUID_SUFFIX;
const CHRCT_UUID_HARDWARE = '00002a23' + UUID_SUFFIX;
const SERVICE_UUID_DATA = '0000fff0' + UUID_SUFFIX;
const CHRCT_UUID_F2 = '0000fff2' + UUID_SUFFIX; // cube state, (54 - 6) facelets, 3 bit per facelet
// const CHRCT_UUID_F3 = '0000fff3' + UUID_SUFFIX; // prev moves
const CHRCT_UUID_F5 = '0000fff5' + UUID_SUFFIX; // gyro state, move counter, pre moves
const CHRCT_UUID_F6 = '0000fff6' + UUID_SUFFIX; // move counter, time offsets between premoves
const CHRCT_UUID_F7 = '0000fff7' + UUID_SUFFIX;

let _service_v2data: BluetoothRemoteGATTService | null = null;
let _chrct_v2read: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_v2write: BluetoothRemoteGATTCharacteristic | null = null;
const SERVICE_UUID_V2DATA = '6e400001-b5a3-f393-e0a9-e50e24dc4179';
const CHRCT_UUID_V2READ = '28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4';
const CHRCT_UUID_V2WRITE = '28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4';

let _service_v3data: BluetoothRemoteGATTService | null = null;
let _chrct_v3read: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_v3write: BluetoothRemoteGATTCharacteristic | null = null;
const SERVICE_UUID_V3DATA = '8653000a-43e6-47b7-9cb0-5fc21d4ae340';
const CHRCT_UUID_V3READ = '8653000b-43e6-47b7-9cb0-5fc21d4ae340';
const CHRCT_UUID_V3WRITE = '8653000c-43e6-47b7-9cb0-5fc21d4ae340';

let _service_v4data: BluetoothRemoteGATTService | null = null;
let _chrct_v4read: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_v4write: BluetoothRemoteGATTCharacteristic | null = null;
const SERVICE_UUID_V4DATA = '00000010-0000-fff7-fff6-fff5fff4fff0';
const CHRCT_UUID_V4READ = '0000fff6-0000-1000-8000-00805f9b34fb';
const CHRCT_UUID_V4WRITE = '0000fff5-0000-1000-8000-00805f9b34fb';

// List of Company Identifier Codes used by GAN cubes
// Only including the most common ones to avoid overwhelming the browser
const GAN_CIC_LIST = [0x0001, 0x0101, 0x0201];

interface Decoder {
	encrypt: (data: number[]) => number[];
	decrypt: (data: number[]) => number[];
	iv: number[];
}

let decoder: Decoder | null = null;
let deviceName: string | null = null;
let deviceMac: string | null = null;

const KEYS = [
	'NoRgnAHANATADDWJYwMxQOxiiEcfYgSK6Hpr4TYCs0IG1OEAbDszALpA',
	'NoNg7ANATFIQnARmogLBRUCs0oAYN8U5J45EQBmFADg0oJAOSlUQF0g',
	'NoRgNATGBs1gLABgQTjCeBWSUDsYBmKbCeMADjNnXxHIoIF0g',
	'NoRg7ANAzBCsAMEAsioxBEIAc0Cc0ATJkgSIYhXIjhMQGxgC6QA',
	'NoVgNAjAHGBMYDYCcdJgCwTFBkYVgAY9JpJYUsYBmAXSA',
	'NoRgNAbAHGAsAMkwgMyzClH0LFcArHnAJzIqIBMGWEAukA'
];

function getKey(version: number, value: DataView): number[] | undefined {
	const keyStr = KEYS[(version >> 8) & 0xff];
	if (!keyStr) {
		return undefined;
	}
	const key = JSON.parse(LZString.decompressFromEncodedURIComponent(keyStr));
	for (let i = 0; i < 6; i++) {
		key[i] = (key[i] + value.getUint8(5 - i)) & 0xff;
	}
	return key;
}

function getKeyV2(value: number[], ver: number): [number[], number[]] {
	ver = ver || 0;
	const key = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[2 + ver * 2]));
	const iv = JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[3 + ver * 2]));
	for (let i = 0; i < 6; i++) {
		key[i] = (key[i] + value[5 - i]) % 255;
		iv[i] = (iv[i] + value[5 - i]) % 255;
	}
	return [key, iv];
}

function decode(value: DataView | number[]): number[] {
	const ret: number[] = [];
	if (value instanceof DataView) {
		for (let i = 0; i < value.byteLength; i++) {
			ret[i] = value.getUint8(i);
		}
	} else {
		for (let i = 0; i < value.length; i++) {
			ret[i] = value[i];
		}
	}

	if (decoder == null) {
		return ret;
	}
	const iv = decoder.iv || [];
	if (ret.length > 16) {
		const offset = ret.length - 16;
		const block = decoder.decrypt(ret.slice(offset));
		for (let i = 0; i < 16; i++) {
			ret[i + offset] = block[i] ^ ~~iv[i];
		}
	}
	decoder.decrypt(ret);
	for (let i = 0; i < 16; i++) {
		ret[i] ^= ~~iv[i];
	}
	return ret;
}

function encode(ret: number[]): number[] {
	if (decoder == null) {
		return ret;
	}
	const iv = decoder.iv || [];
	for (let i = 0; i < 16; i++) {
		ret[i] ^= ~~iv[i];
	}
	decoder.encrypt(ret);
	if (ret.length > 16) {
		const offset = ret.length - 16;
		const block = ret.slice(offset);
		for (let i = 0; i < 16; i++) {
			block[i] ^= ~~iv[i];
		}
		decoder.encrypt(block);
		for (let i = 0; i < 16; i++) {
			ret[i + offset] = block[i];
		}
	}
	return ret;
}

function v1init() {
	giikerutil.log('[gancube] v1init start');
	return _service_meta!
		.getCharacteristic(CHRCT_UUID_VERSION)
		.then(function (chrct: BluetoothRemoteGATTCharacteristic) {
			return chrct.readValue();
		})
		.then(function (value: DataView) {
			const version = (value.getUint8(0) << 16) | (value.getUint8(1) << 8) | value.getUint8(2);
			giikerutil.log('[gancube] version', version.toString(16));
			decoder = null;
			if (version > 0x010007 && (version & 0xfffe00) == 0x010000) {
				return _service_meta!
					.getCharacteristic(CHRCT_UUID_HARDWARE)
					.then(function (chrct: BluetoothRemoteGATTCharacteristic) {
						return chrct.readValue();
					})
					.then(function (value: DataView) {
						const key = getKey(version, value);
						if (!key) {
							// logohint.push(LGHINT_BTNOTSUP);
							giikerutil.log('[gancube] key not found');
							return;
						}
						giikerutil.log('[gancube] key', JSON.stringify(key));
						decoder = $.aes128(key);
					});
			} else {
				//not support
				// logohint.push(LGHINT_BTNOTSUP);
				giikerutil.log('[gancube] version not supported');
			}
		})
		.then(function () {
			return _service_data!.getCharacteristics();
		})
		.then(function (chrcts: BluetoothRemoteGATTCharacteristic[]) {
			giikerutil.log('[gancube] v1init find chrcts', chrcts);
			_chrct_f2 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F2);
			_chrct_f5 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F5);
			_chrct_f6 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F6);
			_chrct_f7 = GiikerCube.findUUID(chrcts, CHRCT_UUID_F7);
		})
		.then(loopRead);
}

function getManufacturerDataBytes(mfData: BluetoothManufacturerData): DataView | undefined {
	if (mfData instanceof DataView) {
		// this is workaround for Bluefy browser
		return new DataView(mfData.buffer.slice(2, 11));
	}

	// Log all available manufacturer data for debugging
	mfData.forEach((value, key) => {
		giikerutil.log('[gancube] manufacturer data:', '0x' + key.toString(16).padStart(4, '0'), value);
	});

	for (const id of GAN_CIC_LIST) {
		if (mfData.has(id)) {
			giikerutil.log(
				'[gancube] found Manufacturer Data under CIC = 0x' + id.toString(16).padStart(4, '0')
			);
			return new DataView(mfData.get(id)!.buffer.slice(0, 9));
		}
	}

	// Fallback to searching any entry if specific list fails, similar to how some libraries might handle it loosely
	// The log from the user shows CIC = 0x0001, which is in our list, but maybe the map lookup is tricky
	if (mfData.has(0x0001)) {
		return new DataView(mfData.get(0x0001)!.buffer.slice(0, 9));
	}

	giikerutil.log('[gancube] Looks like this cube has new unknown CIC');
	return undefined;
}

async function v2initKey(forcePrompt: boolean, isWrongKey: boolean, ver: number) {
	const mac = await giikerutil.reqMacAddr(forcePrompt, isWrongKey, deviceMac, null);
	if (!mac) {
		decoder = null;
		throw new Error('MAC address required');
	}
	// Update deviceMac with the one we just got (in case it was manually entered)
	deviceMac = mac;
	v2initDecoder(mac, ver);
}

function v2initDecoder(mac: string, ver: number) {
	const value: number[] = [];
	for (let i = 0; i < 6; i++) {
		value.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));
	}
	const keyiv = getKeyV2(value, ver);
	decoder = $.aes128(keyiv[0]);
	decoder!.iv = keyiv[1];
}

function v2sendRequest(req: number[]) {
	if (!_chrct_v2write) {
		giikerutil.log('[gancube] v2sendRequest cannot find v2write chrct');
		return;
	}
	const encodedReq = encode(req.slice());
	giikerutil.log('[gancube] v2sendRequest', req, encodedReq);
	return _chrct_v2write.writeValue(new Uint8Array(encodedReq).buffer);
}

function v2sendSimpleRequest(opcode: number) {
	const req = mathlib.valuedArray(20, 0);
	req[0] = opcode;
	return v2sendRequest(req);
}

function v2requestFacelets() {
	return v2sendSimpleRequest(4);
}

function v2requestBattery() {
	return v2sendSimpleRequest(9);
}

function v2requestHardwareInfo() {
	return v2sendSimpleRequest(5);
}

function v2init(ver: number) {
	giikerutil.log('[gancube] v2init start');
	keyCheck = 0;
	return v2initKey(false, false, ver)
		.then(() => {
			return _service_v2data!.getCharacteristics();
		})
		.then(function (chrcts: BluetoothRemoteGATTCharacteristic[]) {
			giikerutil.log('[gancube] v2init find chrcts', chrcts);
			_chrct_v2read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V2READ);
			_chrct_v2write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V2WRITE);
			if (!_chrct_v2read) {
				giikerutil.log('[gancube] v2init cannot find v2read chrct');
			}
		})
		.then(function () {
			giikerutil.log('[gancube] v2init v2read start notifications');
			return _chrct_v2read!.startNotifications();
		})
		.then(function () {
			giikerutil.log('[gancube] v2init v2read notification started');
			return _chrct_v2read!.addEventListener('characteristicvaluechanged', onStateChangedV2);
		})
		.then(function () {
			return v2requestHardwareInfo();
		})
		.then(function () {
			return v2requestFacelets();
		})
		.then(function () {
			return v2requestBattery();
		});
}

function v3sendRequest(req: number[]) {
	if (!_chrct_v3write) {
		giikerutil.log('[gancube] v3sendRequest cannot find v3write chrct');
		return;
	}
	const encodedReq = encode(req.slice());
	giikerutil.log('[gancube] v3sendRequest', req, encodedReq);
	return _chrct_v3write.writeValue(new Uint8Array(encodedReq).buffer);
}

function v3sendSimpleRequest(opcode: number) {
	const req = mathlib.valuedArray(16, 0);
	req[0] = 0x68;
	req[1] = opcode;
	return v3sendRequest(req);
}

function v3requestFacelets() {
	return v3sendSimpleRequest(1);
}

function v3requestBattery() {
	return v3sendSimpleRequest(7);
}

function v3requestHardwareInfo() {
	return v3sendSimpleRequest(4);
}

function v3init() {
	giikerutil.log('[gancube] v3init start');
	keyCheck = 0;
	return v2initKey(false, false, 0)
		.then(() => {
			return _service_v3data!.getCharacteristics();
		})
		.then(function (chrcts: BluetoothRemoteGATTCharacteristic[]) {
			giikerutil.log('[gancube] v3init find chrcts', chrcts);
			_chrct_v3read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V3READ);
			_chrct_v3write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V3WRITE);
			if (!_chrct_v3read) {
				giikerutil.log('[gancube] v3init cannot find v3read chrct');
			}
		})
		.then(function () {
			giikerutil.log('[gancube] v3init v3read start notifications');
			return _chrct_v3read!.startNotifications();
		})
		.then(function () {
			giikerutil.log('[gancube] v3init v3read notification started');
			return _chrct_v3read!.addEventListener('characteristicvaluechanged', onStateChangedV3);
		})
		.then(function () {
			return v3requestHardwareInfo();
		})
		.then(function () {
			return v3requestFacelets();
		})
		.then(function () {
			return v3requestBattery();
		});
}

function v4sendRequest(req: number[]) {
	if (!_chrct_v4write) {
		giikerutil.log('[gancube] v4sendRequest cannot find v4write chrct');
		return;
	}
	const encodedReq = encode(req.slice());
	giikerutil.log('[gancube] v4sendRequest', req, encodedReq);
	return _chrct_v4write.writeValue(new Uint8Array(encodedReq).buffer);
}

function v4requestFacelets() {
	const req = mathlib.valuedArray(20, 0);
	req[0] = 0xdd;
	req[1] = 0x04;
	req[3] = 0xed;
	return v4sendRequest(req);
}

function v4requestBattery() {
	const req = mathlib.valuedArray(20, 0);
	req[0] = 0xdd;
	req[1] = 0x04;
	req[3] = 0xef;
	return v4sendRequest(req);
}

function v4requestHardwareInfo() {
	const req = mathlib.valuedArray(20, 0);
	req[0] = 0xdf;
	req[1] = 0x03;
	return v4sendRequest(req);
}

function v4init() {
	giikerutil.log('[gancube] v4init start');
	keyCheck = 0;
	return v2initKey(false, false, 0)
		.then(() => {
			return _service_v4data!.getCharacteristics();
		})
		.then(function (chrcts: BluetoothRemoteGATTCharacteristic[]) {
			giikerutil.log('[gancube] v4init find chrcts', chrcts);
			_chrct_v4read = GiikerCube.findUUID(chrcts, CHRCT_UUID_V4READ);
			_chrct_v4write = GiikerCube.findUUID(chrcts, CHRCT_UUID_V4WRITE);
			if (!_chrct_v4read) {
				giikerutil.log('[gancube] v4init cannot find v4read chrct');
			}
		})
		.then(function () {
			giikerutil.log('[gancube] v4init v4read start notifications');
			return _chrct_v4read!.startNotifications();
		})
		.then(function () {
			giikerutil.log('[gancube] v4init v4read notification started');
			return _chrct_v4read!.addEventListener('characteristicvaluechanged', onStateChangedV4);
		})
		.then(function () {
			return v4requestHardwareInfo();
		})
		.then(function () {
			return v4requestFacelets();
		})
		.then(function () {
			return v4requestBattery();
		});
}

function init(device: BluetoothDevice, expectedMac?: string) {
	clear();
	deviceName = device.name || null;
	giikerutil.log('[gancube] init gan cube start');
	return GiikerCube.waitForAdvs()
		.then(function (mfData: BluetoothManufacturerData) {
			const dataView = getManufacturerDataBytes(mfData);
			if (dataView && dataView.byteLength >= 6) {
				const mac: string[] = [];
				for (let i = 0; i < 6; i++) {
					mac.push((dataView.getUint8(dataView.byteLength - i - 1) + 0x100).toString(16).slice(1));
				}
				return Promise.resolve(mac.join(':'));
			}
			return Promise.reject(-3);
		})
		.then(
			function (mac: string) {
				giikerutil.log('[gancube] init, found cube bluetooth hardware MAC = ' + mac);
				deviceMac = mac;
			},
			function (err: any) {
				giikerutil.log(
					'[gancube] init, unable to automaticly determine cube MAC, error code = ' + err
				);
				// Fallback to expectedMac if available
				if (expectedMac) {
					giikerutil.log('[gancube] init, using expected MAC = ' + expectedMac);
					deviceMac = expectedMac;
				}
			}
		)
		.then(function () {
			return device.gatt!.connect();
		})
		.then(function (gatt: BluetoothRemoteGATTServer) {
			_gatt = gatt;
			return gatt.getPrimaryServices();
		})
		.then(function (services: BluetoothRemoteGATTService[]) {
			_service_v2data = GiikerCube.findUUID(services, SERVICE_UUID_V2DATA);
			if (_service_v2data) {
				return v2init((deviceName || '').startsWith('AiCube') ? 1 : 0);
			}
			_service_v3data = GiikerCube.findUUID(services, SERVICE_UUID_V3DATA);
			if (_service_v3data) {
				return v3init();
			}
			_service_v4data = GiikerCube.findUUID(services, SERVICE_UUID_V4DATA);
			if (_service_v4data) {
				return v4init();
			}
			_service_meta = GiikerCube.findUUID(services, SERVICE_UUID_META);
			_service_data = GiikerCube.findUUID(services, SERVICE_UUID_DATA);
			if (_service_data && _service_meta) {
				return v1init();
			}
			// logohint.push(LGHINT_BTNOTSUP);
		})
		.catch((err) => {
			if (device.gatt?.connected) {
				device.gatt.disconnect();
			}
			throw err;
		});
}

function getMacAddress(): Promise<string | null> {
	return Promise.resolve(deviceMac);
}

let prevMoves: string[] = [];
let timeOffs: number[] = [];
const moveBuffer: any[][] = []; // [ [moveCnt, move, ts, locTime], ... ]
let prevCubie = new mathlib.CubieCube();
let curCubie = new mathlib.CubieCube();
let latestFacelet = mathlib.SOLVED_FACELET;
let deviceTime = 0;
let deviceTimeOffset = 0;
let moveCnt = -1;
let prevMoveCnt = -1;
let prevMoveLocTime: number | null = null;
let movesFromLastCheck = 1000;
let batteryLevel = 0;
let badPacketCount = 0;

function initCubeState() {
	const locTime = $.now();
	giikerutil.log('[gancube]', 'init cube state');
	GiikerCube.callback(latestFacelet, [], [null, locTime], deviceName);
	prevCubie.fromFacelet(latestFacelet);
	prevMoveCnt = moveCnt;
	// if (latestFacelet != kernel.getProp('giiSolved', mathlib.SOLVED_FACELET)) {
	// 	let rst = kernel.getProp('giiRST');
	// 	if (rst == 'a' || rst == 'p' && confirm(CONFIRM_GIIRST)) {
	// 		giikerutil.markSolved();
	// 	}
	// }
}

function checkState() {
	if (movesFromLastCheck < 50) {
		return Promise.resolve(false);
	}
	return _chrct_f2!.readValue().then(function (value: DataView) {
		const decoded = decode(value);
		const state: string[] = [];
		for (let i = 0; i < decoded.length - 2; i += 3) {
			const face = (decoded[i ^ 1] << 16) | (decoded[(i + 1) ^ 1] << 8) | decoded[(i + 2) ^ 1];
			for (let j = 21; j >= 0; j -= 3) {
				state.push('URFDLB'.charAt((face >> j) & 0x7));
				if (j == 12) {
					state.push('URFDLB'.charAt(i / 3));
				}
			}
		}
		latestFacelet = state.join('');
		movesFromLastCheck = 0;
		if (prevMoveCnt == -1) {
			initCubeState();
			return;
		}
		return Promise.resolve(true);
	});
}

function updateMoveTimes(locTime: number, isV2: number) {
	let moveDiff = (moveCnt - prevMoveCnt) & 0xff;
	moveDiff > 1 && giikerutil.log('[gancube]', 'bluetooth event was lost, moveDiff = ' + moveDiff);
	prevMoveCnt = moveCnt;
	movesFromLastCheck += moveDiff;
	if (moveDiff > prevMoves.length) {
		movesFromLastCheck = 50;
		moveDiff = prevMoves.length;
	}
	let calcTs = deviceTime + deviceTimeOffset;
	for (let i = moveDiff - 1; i >= 0; i--) {
		calcTs += timeOffs[i];
	}
	if (!deviceTime || Math.abs(locTime - calcTs) > 2000) {
		giikerutil.log('[gancube]', 'time adjust', locTime - calcTs, '@', locTime);
		deviceTime += locTime - calcTs;
	}
	for (let i = moveDiff - 1; i >= 0; i--) {
		const m = 'URFDLB'.indexOf(prevMoves[i][0]) * 3 + " 2'".indexOf(prevMoves[i][1]);
		mathlib.CubieCube.CubeMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
		deviceTime += timeOffs[i];
		GiikerCube.callback(
			curCubie.toFaceCube(),
			prevMoves.slice(i),
			[deviceTime, i == 0 ? locTime : null],
			deviceName + (isV2 ? '*' : '')
		);
		const tmp = curCubie;
		curCubie = prevCubie;
		prevCubie = tmp;
		giikerutil.log('[gancube] move', prevMoves[i], timeOffs[i]);
	}
	deviceTimeOffset = locTime - deviceTime;
}

function loopRead(): Promise<void> | undefined {
	if (!_gatt) {
		return;
	}
	return _chrct_f5!
		.readValue()
		.then(function (value: DataView) {
			const decoded = decode(value);
			const locTime = $.now();
			moveCnt = decoded[12];
			if (moveCnt == prevMoveCnt) {
				return;
			}
			prevMoves = [];
			for (let i = 0; i < 6; i++) {
				const m = decoded[13 + i];
				prevMoves.unshift('URFDLB'.charAt(~~(m / 3)) + " 2'".charAt(m % 3));
			}
			let f6val: number[];
			return _chrct_f6!
				.readValue()
				.then(function (value: DataView) {
					f6val = decode(value);
					return checkState();
				})
				.then(function (isUpdated: boolean | void) {
					if (isUpdated) {
						giikerutil.log('[gancube]', 'facelet state calc', prevCubie.toFaceCube());
						giikerutil.log('[gancube]', 'facelet state read', latestFacelet);
						if (prevCubie.toFaceCube() != latestFacelet) {
							giikerutil.log('[gancube]', 'Cube state check error');
						}
						return;
					}

					timeOffs = [];
					for (let i = 0; i < 9; i++) {
						const off = f6val[i * 2 + 1] | (f6val[i * 2 + 2] << 8);
						timeOffs.unshift(off);
					}
					updateMoveTimes(locTime, 0);
				});
		})
		.then(loopRead);
}

function getBatteryLevel(): Promise<[number, string]> {
	if (!_gatt) {
		return Promise.reject('Bluetooth Cube is not connected');
	}
	if (_service_v2data || _service_v3data || _service_v4data) {
		return Promise.resolve([batteryLevel, deviceName + '*']);
	} else if (_chrct_f7) {
		return _chrct_f7.readValue().then(function (value: DataView) {
			const decoded = decode(value);
			return Promise.resolve([decoded[7], deviceName || 'GAN']);
		});
	} else {
		return Promise.resolve([batteryLevel, deviceName || 'GAN']);
	}
}

let keyCheck = 0;

function onStateChangedV2(event: Event) {
	const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
	if (decoder == null) {
		return;
	}
	parseV2Data(value);
}

function parseV2Data(value: DataView | any) {
	const locTime = $.now();
	const decoded = decode(value);
	const binStr: string[] = [];
	for (let i = 0; i < decoded.length; i++) {
		binStr[i] = (decoded[i] + 256).toString(2).slice(1);
	}
	const bin = binStr.join('');
	const mode = parseInt(bin.slice(0, 4), 2);
	// Basic validation for V2 can be difficult as mode is just 4 bits.
	// But if we get a mode > 9 consistently (except 15?), it might be wrong key.
	// For now, implicit failures in checksums (keyCheck) are relying on existing logic.
	// But we can reset badPacketCount if we see a valid mode.
	if ([1, 2, 4, 5, 9].includes(mode)) {
		badPacketCount = 0;
	} else {
		// Possibly bad packet, but V2 is noisy. Let's be conservative.
	}

	if (mode == 1) {
		// gyro
	} else if (mode == 2) {
		// cube move
		giikerutil.log('[gancube]', 'v2 received move event', decoded);
		moveCnt = parseInt(bin.slice(4, 12), 2);
		if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {
			return;
		}
		timeOffs = [];
		prevMoves = [];
		let keyChkInc = 0;
		for (let i = 0; i < 7; i++) {
			const m = parseInt(bin.slice(12 + i * 5, 17 + i * 5), 2);
			timeOffs[i] = parseInt(bin.slice(47 + i * 16, 63 + i * 16), 2);
			prevMoves[i] = 'URFDLB'.charAt(m >> 1) + " '".charAt(m & 1);
			if (m >= 12) {
				// invalid data
				prevMoves[i] = 'U ';
				keyChkInc = 1;
			}
		}
		keyCheck += keyChkInc;
		if (keyChkInc == 0) {
			updateMoveTimes(locTime, 1);
		}
	} else if (mode == 4) {
		// cube state
		giikerutil.log('[gancube]', 'v2 received facelets event', decoded);
		if (prevMoveCnt != -1) return;
		moveCnt = parseInt(bin.slice(4, 12), 2);
		const cc = new mathlib.CubieCube();
		let echk = 0;
		let cchk = 0xf00;
		for (let i = 0; i < 7; i++) {
			const perm = parseInt(bin.slice(12 + i * 3, 15 + i * 3), 2);
			const ori = parseInt(bin.slice(33 + i * 2, 35 + i * 2), 2);
			cchk -= ori << 3;
			cchk ^= perm;
			cc.ca[i] = (ori << 3) | perm;
		}
		cc.ca[7] = (cchk & 0xff8) % 24 | (cchk & 0x7);
		for (let i = 0; i < 11; i++) {
			const perm = parseInt(bin.slice(47 + i * 4, 51 + i * 4), 2);
			const ori = parseInt(bin.slice(91 + i, 92 + i), 2);
			echk ^= (perm << 1) | ori;
			cc.ea[i] = (perm << 1) | ori;
		}
		cc.ea[11] = echk;
		if (cc.verify() != 0) {
			keyCheck++;
			giikerutil.log('[gancube]', 'v2 facelets state verify error');
			return;
		}
		latestFacelet = cc.toFaceCube();
		giikerutil.log('[gancube]', 'v2 facelets event state parsed', latestFacelet);
		initCubeState();
	} else if (mode == 5) {
		// hardware info
		giikerutil.log('[gancube]', 'v2 received hardware info event', decoded);
		const hardwareVersion = parseInt(bin.slice(8, 16), 2) + '.' + parseInt(bin.slice(16, 24), 2);
		const softwareVersion = parseInt(bin.slice(24, 32), 2) + '.' + parseInt(bin.slice(32, 40), 2);
		let devName = '';
		for (let i = 0; i < 8; i++)
			devName += String.fromCharCode(parseInt(bin.slice(40 + i * 8, 48 + i * 8), 2));
		const gyroEnabled = 1 === parseInt(bin.slice(104, 105), 2);
		giikerutil.log('[gancube]', 'Hardware Version', hardwareVersion);
		giikerutil.log('[gancube]', 'Software Version', softwareVersion);
		giikerutil.log('[gancube]', 'Device Name', devName);
		giikerutil.log('[gancube]', 'Gyro Enabled', gyroEnabled);
	} else if (mode == 9) {
		// battery
		giikerutil.log('[gancube]', 'v2 received battery event', decoded);
		batteryLevel = parseInt(bin.slice(8, 16), 2);
		giikerutil.updateBattery([batteryLevel, deviceName + '*']);
	} else {
		giikerutil.log('[gancube]', 'v2 received unknown event', decoded);
	}
}

($ as any).parseV2Data = parseV2Data; // for debug

// Check if circular move number (modulo 256) fits into (start,end) open range.
// closedStart / closedEnd - set them to true if checked range end should be closed.
function isMoveNumberInRange(
	start: number,
	end: number,
	moveCnt: number,
	closedStart?: boolean,
	closedEnd?: boolean
) {
	return (
		((end - start) & 0xff) >= ((moveCnt - start) & 0xff) &&
		(closedStart || ((start - moveCnt) & 0xff) > 0) &&
		(closedEnd || ((end - moveCnt) & 0xff) > 0)
	);
}

function injectLostMoveToBuffer(move: any[]) {
	if (moveBuffer.length > 0) {
		giikerutil.log('[gancube]', 'trying to inject lost move', prevMoveCnt, moveBuffer[0][0], move);
		// Skip if move with the same number already in the buffer
		if (
			moveBuffer.some(function (e) {
				return e[0] == move[0];
			})
		)
			return;
		// Skip if move number does not fit in range between last evicted move number and move number on buffer head, i.e. move must be one of missed
		if (!isMoveNumberInRange(prevMoveCnt, moveBuffer[0][0], move[0])) return;
		// Lost moves should be injected in reverse order, so just put suitable move on buffer head
		if (move[0] == ((moveBuffer[0][0] - 1) & 0xff)) {
			moveBuffer.unshift(move);
			giikerutil.log('[gancube]', 'lost move recovered', move[0], move[1]);
		}
	} else {
		giikerutil.log(
			'[gancube]',
			'trying to inject lost move (empty buffer)',
			prevMoveCnt,
			moveCnt,
			move
		);
		if (isMoveNumberInRange(prevMoveCnt, moveCnt, move[0], false, true)) {
			moveBuffer.unshift(move);
			giikerutil.log('[gancube]', 'lost move recovered (empty buffer)', move[0], move[1]);
		}
	}
}

function requestMoveHistory(startMoveCnt: number, numberOfMoves: number) {
	// Move history response data is byte-aligned, and moves always starting with near-ceil odd serial number, regardless of requested.
	// Adjust start move and number of moves to get odd number aligned history window with even number of moves inside.
	if (startMoveCnt % 2 == 0) startMoveCnt = (startMoveCnt - 1) & 0xff;
	if (numberOfMoves % 2 == 1) numberOfMoves++;
	// Never overflow requested history window beyond the move number cycle edge 255 -> 0.
	// Because due to firmware bug the moves beyond the edge spoofed with 'D' (just zero bytes).
	numberOfMoves = Math.min(numberOfMoves, startMoveCnt + 1);
	let chrct: BluetoothRemoteGATTCharacteristic | null = null,
		req: number[] = [];
	if (_service_v3data) {
		req = mathlib.valuedArray(16, 0);
		req[0] = 0x68;
		req[1] = 0x03;
		chrct = _chrct_v3write;
	} else if (_service_v4data) {
		req = mathlib.valuedArray(20, 0);
		req[0] = 0xd1;
		req[1] = 0x04;
		chrct = _chrct_v4write;
	} else {
		return;
	}
	req[2] = startMoveCnt;
	req[3] = 0;
	req[4] = numberOfMoves;
	req[5] = 0;
	giikerutil.log('[gancube]', 'requesting move history', prevMoveCnt, startMoveCnt, numberOfMoves);
	const encodedReq = encode(req.slice());
	// We can safely suppress and ignore possible GATT write errors
	// requestMoveHistory command is automatically retried on each move event if needed
	if (chrct) {
		return chrct.writeValue(new Uint8Array(encodedReq).buffer).catch($.noop);
	}
}

function evictMoveBuffer(reqLostMoves: boolean) {
	while (moveBuffer.length > 0) {
		const diff = (moveBuffer[0][0] - prevMoveCnt) & 0xff;
		if (diff > 1) {
			giikerutil.log('[gancube]', 'lost move detected', prevMoveCnt, moveBuffer[0][0], diff);
			if (reqLostMoves) {
				requestMoveHistory(moveBuffer[0][0], diff);
			}
			break;
		} else {
			const move = moveBuffer.shift()!;
			const m = 'URFDLB'.indexOf(move[1][0]) * 3 + " 2'".indexOf(move[1][1]);
			mathlib.CubieCube.CubeMult(prevCubie, mathlib.CubieCube.moveCube[m], curCubie);
			prevMoves.unshift(move[1]);
			if (prevMoves.length > 8) prevMoves = prevMoves.slice(0, 8);
			GiikerCube.callback(curCubie.toFaceCube(), prevMoves, [move[2], move[3]], deviceName + '*');
			const tmp = curCubie;
			curCubie = prevCubie;
			prevCubie = tmp;
			prevMoveCnt = move[0];
			giikerutil.log(
				'[gancube]',
				'move evicted from fifo buffer',
				move[0],
				move[1],
				move[2],
				move[3]
			);
		}
	}
	if (moveBuffer.length > 16) {
		giikerutil.log(
			'[gancube]',
			'something wrong, moves are not evicted from buffer, force cube disconnection',
			prevMoveCnt,
			JSON.stringify(moveBuffer)
		);
		GiikerCube.onDisconnect();
	}
}

function onStateChangedV3(event: Event) {
	const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
	if (decoder == null) {
		return;
	}
	parseV3Data(value);
}

function parseV3Data(value: DataView | any) {
	const locTime = $.now();
	const decoded = decode(value);
	const binStr: string[] = [];
	for (let i = 0; i < decoded.length; i++) {
		binStr[i] = (decoded[i] + 256).toString(2).slice(1);
	}
	const bin = binStr.join('');
	const magic = parseInt(bin.slice(0, 8), 2);
	const mode = parseInt(bin.slice(8, 16), 2);
	const len = parseInt(bin.slice(16, 24), 2);
	if (magic != 0x55 || len <= 0) {
		giikerutil.log('[gancube]', 'v3 invalid magic or len', decoded);
		badPacketCount++;
		if (badPacketCount > 5) {
			giikerutil.log('[gancube]', 'Too many bad packets, disconnecting');
			if (_gatt && _gatt.connected) _gatt.disconnect();
		}
		return;
	}
	badPacketCount = 0;
	if (mode == 1) {
		// cube move
		prevMoveLocTime = locTime;
		moveCnt = parseInt(bin.slice(64, 72) + bin.slice(56, 64), 2);
		giikerutil.log('[gancube]', 'v3 received move event', prevMoveCnt, moveCnt, decoded);
		if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {
			return;
		}
		const ts = parseInt(
			bin.slice(48, 56) + bin.slice(40, 48) + bin.slice(32, 40) + bin.slice(24, 32),
			2
		);
		const pow = parseInt(bin.slice(72, 74), 2);
		const axis = [2, 32, 8, 1, 16, 4].indexOf(parseInt(bin.slice(74, 80), 2));
		if (axis == -1) {
			giikerutil.log('[gancube]', 'v3 move event invalid axis');
			return;
		}
		const move = 'URFDLB'.charAt(axis) + " '".charAt(pow);
		moveBuffer.push([moveCnt, move, ts, locTime]);
		giikerutil.log('[gancube]', 'v3 move placed to fifo buffer', moveCnt, move, ts, locTime);
		evictMoveBuffer(true);
	} else if (mode == 2) {
		// cube state
		moveCnt = parseInt(bin.slice(32, 40) + bin.slice(24, 32), 2);
		if (prevMoveCnt != -1) {
			if (prevMoveLocTime != null && locTime - prevMoveLocTime > 500) {
				// Debounce the facelet event if there are active cube moves
				const diff = (moveCnt - prevMoveCnt) & 0xff;
				if (diff > 0) {
					giikerutil.log(
						'[gancube]',
						'v3 cube state is ahead of the last recorded move',
						prevMoveCnt,
						moveCnt,
						diff
					);
					// Constraint to avoid firmware bug with facelets state event at 255 move counter.
					// When receiving facelets state with 0 move counter we can't be sure that
					// move with 0 counter is fulfilled, and wrong move from previous loop may be restored instead.
					if (moveCnt != 0) {
						const startMoveCnt = moveBuffer[0] ? moveBuffer[0][0] : (moveCnt + 1) & 0xff;
						requestMoveHistory(startMoveCnt, diff + 1);
					}
				}
			}
			return;
		}
		giikerutil.log('[gancube]', 'v3 processing facelets event', prevMoveCnt, moveCnt, decoded);
		const cc = new mathlib.CubieCube();
		let echk = 0;
		let cchk = 0xf00;
		for (let i = 0; i < 7; i++) {
			const perm = parseInt(bin.slice(40 + i * 3, 43 + i * 3), 2);
			const ori = parseInt(bin.slice(61 + i * 2, 63 + i * 2), 2);
			cchk -= ori << 3;
			cchk ^= perm;
			cc.ca[i] = (ori << 3) | perm;
		}
		cc.ca[7] = (cchk & 0xff8) % 24 | (cchk & 0x7);
		for (let i = 0; i < 11; i++) {
			const perm = parseInt(bin.slice(77 + i * 4, 81 + i * 4), 2);
			const ori = parseInt(bin.slice(121 + i, 122 + i), 2);
			echk ^= (perm << 1) | ori;
			cc.ea[i] = (perm << 1) | ori;
		}
		cc.ea[11] = echk;
		if (cc.verify() != 0) {
			keyCheck++;
			giikerutil.log('[gancube]', 'v3 facelets state verify error');
			return;
		}
		latestFacelet = cc.toFaceCube();
		giikerutil.log('[gancube]', 'v3 facelets event state parsed', latestFacelet);
		initCubeState();
	} else if (mode == 6) {
		// move history
		const startMoveCnt = parseInt(bin.slice(24, 32), 2);
		const numberOfMoves = (len - 1) * 2;
		giikerutil.log(
			'[gancube]',
			'v3 received move history event',
			startMoveCnt,
			numberOfMoves,
			decoded
		);
		for (let i = 0; i < numberOfMoves; i++) {
			const axis = parseInt(bin.slice(32 + 4 * i, 35 + 4 * i), 2);
			const pow = parseInt(bin.slice(35 + 4 * i, 36 + 4 * i), 2);
			if (axis < 6) {
				const move = 'DUBFLR'.charAt(axis) + " '".charAt(pow);
				injectLostMoveToBuffer([(startMoveCnt - i) & 0xff, move, null, null]);
			}
		}
		evictMoveBuffer(false);
	} else if (mode == 7) {
		// hardware info
		giikerutil.log('[gancube]', 'v3 received hardware info event', decoded);
		const hardwareVersion = parseInt(bin.slice(80, 84), 2) + '.' + parseInt(bin.slice(84, 88), 2);
		const softwareVersion = parseInt(bin.slice(72, 76), 2) + '.' + parseInt(bin.slice(76, 80), 2);
		let devName = '';
		for (let i = 0; i < 5; i++)
			devName += String.fromCharCode(parseInt(bin.slice(32 + i * 8, 40 + i * 8), 2));
		giikerutil.log('[gancube]', 'Hardware Version', hardwareVersion);
		giikerutil.log('[gancube]', 'Software Version', softwareVersion);
		giikerutil.log('[gancube]', 'Device Name', devName);
	} else if (mode == 16) {
		// battery
		giikerutil.log('[gancube]', 'v3 received battery event', decoded);
		batteryLevel = parseInt(bin.slice(24, 32), 2);
		giikerutil.updateBattery([batteryLevel, deviceName + '*']);
	} else {
		giikerutil.log('[gancube]', 'v3 received unknown event', mode, decoded);
	}
}

($ as any).parseV3Data = parseV3Data; // for debug

function onStateChangedV4(event: Event) {
	const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
	if (decoder == null) {
		return;
	}
	parseV4Data(value);
}

function parseV4Data(value: DataView | any) {
	const locTime = $.now();
	const decoded = decode(value);
	const binStr: string[] = [];
	for (let i = 0; i < decoded.length; i++) {
		binStr[i] = (decoded[i] + 256).toString(2).slice(1);
	}
	const bin = binStr.join('');
	const mode = parseInt(bin.slice(0, 8), 2);
	const len = parseInt(bin.slice(8, 16), 2);
	// V4 validation: mode should be known
	if (![0x01, 0xed, 0xd1, 0xf5, 0xf6, 0xfa, 0xfc, 0xfd, 0xfe, 0xff, 0xef, 0xec].includes(mode)) {
		badPacketCount++;
		if (badPacketCount > 10) {
			// Higher threshold for V4
			giikerutil.log('[gancube]', 'Too many bad V4 packets, disconnecting');
			if (_gatt && _gatt.connected) _gatt.disconnect();
		}
	} else {
		badPacketCount = 0;
	}

	if (mode == 0x01) {
		// cube move
		prevMoveLocTime = locTime;
		moveCnt = parseInt(bin.slice(56, 64) + bin.slice(48, 56), 2);
		giikerutil.log('[gancube]', 'v4 received move event', prevMoveCnt, moveCnt, decoded);
		if (moveCnt == prevMoveCnt || prevMoveCnt == -1) {
			return;
		}
		const ts = parseInt(
			bin.slice(40, 48) + bin.slice(32, 40) + bin.slice(24, 32) + bin.slice(16, 24),
			2
		);
		const pow = parseInt(bin.slice(64, 66), 2);
		const axis = [2, 32, 8, 1, 16, 4].indexOf(parseInt(bin.slice(66, 72), 2));
		if (axis == -1) {
			giikerutil.log('[gancube]', 'v4 move event invalid axis');
			return;
		}
		const move = 'URFDLB'.charAt(axis) + " '".charAt(pow);
		moveBuffer.push([moveCnt, move, ts, locTime]);
		giikerutil.log('[gancube]', 'v4 move placed to fifo buffer', moveCnt, move, ts, locTime);
		evictMoveBuffer(true);
	} else if (mode == 0xed) {
		// cube state
		moveCnt = parseInt(bin.slice(24, 32) + bin.slice(16, 24), 2);
		if (prevMoveCnt != -1) {
			if (prevMoveLocTime != null && locTime - prevMoveLocTime > 500) {
				// Debounce the facelet event if there are active cube moves
				const diff = (moveCnt - prevMoveCnt) & 0xff;
				if (diff > 0) {
					giikerutil.log(
						'[gancube]',
						'v4 cube state is ahead of the last recorded move',
						prevMoveCnt,
						moveCnt,
						diff
					);
					// Constraint to avoid firmware bug with facelets state event at 255 move counter.
					// When receiving facelets state with 0 move counter we can't be sure that
					// move with 0 counter is fulfilled, and wrong move from previous loop may be restored instead.
					if (moveCnt != 0) {
						const startMoveCnt = moveBuffer[0] ? moveBuffer[0][0] : (moveCnt + 1) & 0xff;
						requestMoveHistory(startMoveCnt, diff + 1);
					}
				}
			}
			return;
		}
		giikerutil.log('[gancube]', 'v4 processing facelets event', prevMoveCnt, moveCnt, decoded);
		const cc = new mathlib.CubieCube();
		let echk = 0;
		let cchk = 0xf00;
		for (let i = 0; i < 7; i++) {
			const perm = parseInt(bin.slice(32 + i * 3, 35 + i * 3), 2);
			const ori = parseInt(bin.slice(53 + i * 2, 55 + i * 2), 2);
			cchk -= ori << 3;
			cchk ^= perm;
			cc.ca[i] = (ori << 3) | perm;
		}
		cc.ca[7] = (cchk & 0xff8) % 24 | (cchk & 0x7);
		for (let i = 0; i < 11; i++) {
			const perm = parseInt(bin.slice(69 + i * 4, 73 + i * 4), 2);
			const ori = parseInt(bin.slice(113 + i, 114 + i), 2);
			echk ^= (perm << 1) | ori;
			cc.ea[i] = (perm << 1) | ori;
		}
		cc.ea[11] = echk;
		if (cc.verify() != 0) {
			keyCheck++;
			giikerutil.log('[gancube]', 'v4 facelets state verify error');
			return;
		}
		latestFacelet = cc.toFaceCube();
		giikerutil.log('[gancube]', 'v4 facelets event state parsed', latestFacelet);
		initCubeState();
	} else if (mode == 0xd1) {
		// move history
		const startMoveCnt = parseInt(bin.slice(16, 24), 2);
		const numberOfMoves = (len - 1) * 2;
		giikerutil.log(
			'[gancube]',
			'v4 received move history event',
			startMoveCnt,
			numberOfMoves,
			decoded
		);
		for (let i = 0; i < numberOfMoves; i++) {
			const axis = parseInt(bin.slice(24 + 4 * i, 27 + 4 * i), 2);
			const pow = parseInt(bin.slice(27 + 4 * i, 28 + 4 * i), 2);
			if (axis < 6) {
				const move = 'DUBFLR'.charAt(axis) + " '".charAt(pow);
				injectLostMoveToBuffer([(startMoveCnt - i) & 0xff, move, null, null]);
			}
		}
		evictMoveBuffer(false);
	} else if ([0xf5, 0xf6, 0xfa, 0xfc, 0xfd, 0xfe, 0xff].indexOf(mode) != -1) {
		// hardware info
		switch (mode) {
			case 0xfa:
				const year = parseInt(bin.slice(32, 40) + bin.slice(24, 32), 2);
				const month = parseInt(bin.slice(40, 48), 2);
				const day = parseInt(bin.slice(48, 56), 2);
				giikerutil.log('[gancube]', 'Product Date', year + '-' + month + '-' + day);
				break;
			case 0xfc:
				let hwName = '';
				for (let i = 0; i < len - 1; i++)
					hwName += String.fromCharCode(parseInt(bin.slice(24 + i * 8, 32 + i * 8), 2));
				giikerutil.log('[gancube]', 'Hardware Name', hwName);
				break;
			case 0xfd:
				const swMajor = parseInt(bin.slice(24, 28), 2);
				const swMinor = parseInt(bin.slice(28, 32), 2);
				giikerutil.log('[gancube]', 'Software Version', swMajor + '.' + swMinor);
				break;
			case 0xfe:
				const hwMajor = parseInt(bin.slice(24, 28), 2);
				const hwMinor = parseInt(bin.slice(28, 32), 2);
				giikerutil.log('[gancube]', 'Hardware Version', hwMajor + '.' + hwMinor);
				break;
		}
	} else if (mode == 0xef) {
		// battery
		giikerutil.log('[gancube]', 'v4 received battery event', decoded);
		batteryLevel = parseInt(bin.slice(8 + len * 8, 16 + len * 8), 2);
		giikerutil.log('[gancube]', 'v4 battery level', batteryLevel);
		giikerutil.updateBattery([batteryLevel, deviceName + '*']);
	} else if (mode == 0xec) {
		// gyro
	} else {
		giikerutil.log('[gancube]', 'v4 received unknown event', mode, decoded);
	}
}

($ as any).parseV4Data = parseV4Data; // for debug

function clear(): Promise<void> {
	let result: Promise<void> = Promise.resolve();
	if (_chrct_f6) {
		result = _chrct_f6
			.stopNotifications()
			.then(() => {})
			.catch(() => {}) as Promise<void>;
	}
	if (_chrct_v2read) {
		_chrct_v2read.removeEventListener('characteristicvaluechanged', onStateChangedV2);
		result = _chrct_v2read
			.stopNotifications()
			.then(() => {})
			.catch(() => {}) as Promise<void>;
	}
	if (_chrct_v3read) {
		_chrct_v3read.removeEventListener('characteristicvaluechanged', onStateChangedV3);
		result = _chrct_v3read
			.stopNotifications()
			.then(() => {})
			.catch(() => {}) as Promise<void>;
	}
	if (_chrct_v4read) {
		_chrct_v4read.removeEventListener('characteristicvaluechanged', onStateChangedV4);
		result = _chrct_v4read
			.stopNotifications()
			.then(() => {})
			.catch(() => {}) as Promise<void>;
	}
	_gatt = null;
	_service_data = null;
	_service_meta = null;
	_chrct_f2 = null;
	_chrct_f5 = null;
	_chrct_f6 = null;
	_chrct_f7 = null;
	_service_v2data = null;
	_chrct_v2read = null;
	_chrct_v2write = null;
	_service_v3data = null;
	_chrct_v3read = null;
	_chrct_v3write = null;
	_service_v4data = null;
	_chrct_v4read = null;
	_chrct_v4write = null;
	deviceName = null;
	deviceMac = null;
	decoder = null;
	badPacketCount = 0;
	return result;
}

// Register cube model
const cubeModel: CubeModel = {
	prefix: ['GAN', 'MG', 'AiCube'],
	init: init,
	opservs: [
		SERVICE_UUID_META,
		SERVICE_UUID_DATA,
		SERVICE_UUID_V2DATA,
		SERVICE_UUID_V3DATA,
		SERVICE_UUID_V4DATA
	],
	cics: GAN_CIC_LIST,
	getBatteryLevel: getBatteryLevel,
	clear: clear,
	getMacAddress: getMacAddress
};

GiikerCube.regCubeModel(cubeModel);

export default cubeModel;
