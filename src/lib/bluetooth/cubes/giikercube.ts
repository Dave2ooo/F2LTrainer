/**
 * Giiker Cube implementation
 * Ported from csTimer's giikercube.js with minimal changes
 */

import { GiikerCube } from '../core/bluetooth';
import { CubieCube, SOLVED_FACELET } from '../core/mathlib';
import { giikerutil, $ } from '../core/utils';
import type { CubeModel } from '../core/types';

let _gatt: BluetoothRemoteGATTServer | null = null;
let _chrct: BluetoothRemoteGATTCharacteristic | null = null;

const UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';

const SERVICE_UUID_DATA = '0000aadb' + UUID_SUFFIX;
const CHRCT_UUID_DATA = '0000aadc' + UUID_SUFFIX;

const SERVICE_UUID_RW = '0000aaaa' + UUID_SUFFIX;
const CHRCT_UUID_READ = '0000aaab' + UUID_SUFFIX;
const CHRCT_UUID_WRITE = '0000aaac' + UUID_SUFFIX;

let deviceName: string | null = null;

function init(device: BluetoothDevice, expectedMac?: string): Promise<void> {
	clear();
	deviceName = device.name && device.name.startsWith('Gi') ? 'Giiker' : 'Mi Smart';
	return device
		.gatt!.connect()
		.then(function (gatt) {
			_gatt = gatt;
			return gatt.getPrimaryService(SERVICE_UUID_DATA);
		})
		.then(function (service) {
			return service.getCharacteristic(CHRCT_UUID_DATA);
		})
		.then(function (chrct) {
			_chrct = chrct;
			return _chrct.startNotifications();
		})
		.then(function () {
			return _chrct!.readValue();
		})
		.then(function (value) {
			const initState = parseState(value);
			// Skip solving state check for now
			return _chrct!.addEventListener('characteristicvaluechanged', onStateChanged);
		});
}

function onStateChanged(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	parseState(value);
}

const cFacelet = [
	[26, 15, 29],
	[20, 8, 9],
	[18, 38, 6],
	[24, 27, 44],
	[51, 35, 17],
	[45, 11, 2],
	[47, 0, 36],
	[53, 42, 33]
];

const eFacelet = [
	[25, 28],
	[23, 12],
	[19, 7],
	[21, 41],
	[32, 16],
	[5, 10],
	[3, 37],
	[30, 43],
	[52, 34],
	[48, 14],
	[46, 1],
	[50, 39]
];

function toHexVal(value: DataView): number[] {
	const raw: number[] = [];
	for (let i = 0; i < 20; i++) {
		raw.push(value.getUint8(i));
	}
	if (raw[18] === 0xa7) {
		// decrypt
		const key = [
			176, 81, 104, 224, 86, 137, 237, 119, 38, 26, 193, 161, 210, 126, 150, 81, 93, 13, 236, 249,
			89, 235, 88, 24, 113, 81, 214, 131, 130, 199, 2, 169, 39, 165, 171, 41
		];
		const k1 = (raw[19] >> 4) & 0xf;
		const k2 = raw[19] & 0xf;
		for (let i = 0; i < 18; i++) {
			raw[i] += key[i + k1] + key[i + k2];
		}
		raw.splice(18); // Keep only first 18 elements
	}
	const valhex: number[] = [];
	for (let i = 0; i < raw.length; i++) {
		valhex.push((raw[i] >> 4) & 0xf);
		valhex.push(raw[i] & 0xf);
	}
	return valhex;
}

function parseState(value: DataView): [string, string[]] {
	const locTime = $.now();

	const valhex = toHexVal(value);
	const eo: number[] = [];
	for (let i = 0; i < 3; i++) {
		for (let mask = 8; mask !== 0; mask >>= 1) {
			eo.push(valhex[i + 28] & mask ? 1 : 0);
		}
	}
	const cc = new CubieCube();
	const coMask = [-1, 1, -1, 1, 1, -1, 1, -1];
	for (let i = 0; i < 8; i++) {
		cc.ca[i] = (valhex[i] - 1) | ((3 + valhex[i + 8] * coMask[i]) % 3 << 3);
	}
	for (let i = 0; i < 12; i++) {
		cc.ea[i] = ((valhex[i + 16] - 1) << 1) | eo[i];
	}
	const facelet = cc.toFaceCube(cFacelet, eFacelet);

	const moves = valhex.slice(32, 40);
	const prevMoves: string[] = [];
	for (let i = 0; i < moves.length; i += 2) {
		prevMoves.push('BDLURF'.charAt(moves[i] - 1) + " 2'".charAt((moves[i + 1] - 1) % 7));
	}

	if (giikerutil && (giikerutil as any).log) {
		giikerutil.log('[giiker] Current State: ', facelet);
		giikerutil.log('[giiker] Previous Moves: ', prevMoves.slice().reverse().join(' '));
	}

	GiikerCube.callback(facelet, prevMoves, [locTime, locTime], deviceName || undefined);
	return [facelet, prevMoves];
}

function getBatteryLevel(): Promise<[number, string]> {
	if (!_gatt) {
		return Promise.reject('Bluetooth Cube is not connected');
	}
	let _service: BluetoothRemoteGATTService;
	let _read: BluetoothRemoteGATTCharacteristic;
	let _resolve: (value: [number, string]) => void;
	const listener = function (event: Event) {
		const target = event.target as BluetoothRemoteGATTCharacteristic;
		_resolve([target.value!.getUint8(1), deviceName || 'Giiker']);
		_read.removeEventListener('characteristicvaluechanged', listener);
		_read.stopNotifications();
	};
	return _gatt
		.getPrimaryService(SERVICE_UUID_RW)
		.then(function (service) {
			_service = service;
			return service.getCharacteristic(CHRCT_UUID_READ);
		})
		.then(function (chrct) {
			_read = chrct;
			return _read.startNotifications();
		})
		.then(function () {
			return _read.addEventListener('characteristicvaluechanged', listener);
		})
		.then(function () {
			return _service.getCharacteristic(CHRCT_UUID_WRITE);
		})
		.then(function (chrct) {
			chrct.writeValue(new Uint8Array([0xb5]).buffer as ArrayBuffer);
			return new Promise<[number, string]>(function (resolve) {
				_resolve = resolve;
			});
		});
}

function clear(): Promise<void> {
	let result: Promise<void> = Promise.resolve();
	if (_chrct) {
		_chrct.removeEventListener('characteristicvaluechanged', onStateChanged);
		result = _chrct
			.stopNotifications()
			.then(() => {})
			.catch(() => {}) as Promise<void>;
		_chrct = null;
	}
	_gatt = null;
	deviceName = null;
	return result;
}

// Register cube model
const cubeModel: CubeModel = {
	prefix: ['Gi', 'Mi Smart Magic Cube', 'Hi-'],
	init: init,
	opservs: [SERVICE_UUID_DATA, SERVICE_UUID_RW],
	getBatteryLevel: getBatteryLevel,
	clear: clear
};

GiikerCube.regCubeModel(cubeModel);

export default cubeModel;
