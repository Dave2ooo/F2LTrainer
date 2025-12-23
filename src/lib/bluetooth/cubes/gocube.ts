/**
 * GoCube / Rubik's Connected implementation
 * Ported from csTimer's gocube.js with minimal changes
 */

import { GiikerCube } from '../core/bluetooth';
import { CubieCube, SOLVED_FACELET } from '../core/mathlib';
import { giikerutil, $ } from '../core/utils';
import type { CubeModel } from '../core/types';

let _gatt: BluetoothRemoteGATTServer | null = null;
let _service: BluetoothRemoteGATTService | null = null;
let _read: BluetoothRemoteGATTCharacteristic | null = null;
let _write: BluetoothRemoteGATTCharacteristic | null = null;
let _deviceName: string | null = null;

const UUID_SUFFIX = '-b5a3-f393-e0a9-e50e24dcca9e';
const SERVICE_UUID = '6e400001' + UUID_SUFFIX;
const CHRCT_UUID_WRITE = '6e400002' + UUID_SUFFIX;
const CHRCT_UUID_READ = '6e400003' + UUID_SUFFIX;

const WRITE_BATTERY = 50;
const WRITE_STATE = 51;

function init(device: BluetoothDevice): Promise<void> {
	clear();
	_deviceName = device.name && device.name.startsWith('GoCube') ? 'GoCube' : 'Rubiks Connected';
	return device.gatt!.connect().then(function (gatt) {
		_gatt = gatt;
		return gatt.getPrimaryService(SERVICE_UUID);
	}).then(function (service) {
		_service = service;
		return _service.getCharacteristic(CHRCT_UUID_WRITE);
	}).then(function (chrct) {
		_write = chrct;
		return _service!.getCharacteristic(CHRCT_UUID_READ);
	}).then(function (chrct) {
		_read = chrct;
		return _read.startNotifications();
	}).then(function () {
		return _read!.addEventListener('characteristicvaluechanged', onStateChanged);
	}).then(function () {
		return _write!.writeValue(new Uint8Array([WRITE_STATE]).buffer as ArrayBuffer);
	});
}

function onStateChanged(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	parseData(value);
}

function toHexVal(value: DataView): number[] {
	const valhex: number[] = [];
	for (let i = 0; i < value.byteLength; i++) {
		valhex.push(value.getUint8(i) >> 4 & 0xf);
		valhex.push(value.getUint8(i) & 0xf);
	}
	return valhex;
}

let _batteryLevel: number | undefined;

const axisPerm = [5, 2, 0, 3, 1, 4];
const facePerm = [0, 1, 2, 5, 8, 7, 6, 3];
const faceOffset = [0, 0, 6, 2, 0, 0];
let moveCntFree = 100;
let curFacelet = SOLVED_FACELET;
let curCubie = new CubieCube();
let prevCubie = new CubieCube();
let prevMoves: string[] = [];

function parseData(value: DataView) {
	const locTime = $.now();
	if (value.byteLength < 4) {
		return;
	}
	if (value.getUint8(0) !== 0x2a ||
		value.getUint8(value.byteLength - 2) !== 0x0d ||
		value.getUint8(value.byteLength - 1) !== 0x0a) {
		return;
	}
	const msgType = value.getUint8(2);
	const msgLen = value.byteLength - 6;
	if (msgType === 1) { // move
		for (let i = 0; i < msgLen; i += 2) {
			const axis = axisPerm[value.getUint8(3 + i) >> 1];
			const power = [0, 2][value.getUint8(3 + i) & 1];
			const m = axis * 3 + power;
			giikerutil.log('[gocube] move', "URFDLB".charAt(axis) + " 2'".charAt(power));
			CubieCube.CubeMult(prevCubie, CubieCube.moveCube[m], curCubie);
			curFacelet = curCubie.toFaceCube();
			prevMoves.unshift("URFDLB".charAt(axis) + " 2'".charAt(power));
			if (prevMoves.length > 8)
				prevMoves = prevMoves.slice(0, 8);
			GiikerCube.callback(curFacelet, prevMoves, [locTime, locTime], _deviceName || undefined);
			const tmp = curCubie;
			curCubie = prevCubie;
			prevCubie = tmp;
			if (++moveCntFree > 20) {
				moveCntFree = 0;
				_write!.writeValue(new Uint8Array([WRITE_STATE]).buffer as ArrayBuffer);
			}
		}
	} else if (msgType === 2) { // cube state
		const facelet: string[] = [];
		for (let a = 0; a < 6; a++) {
			const axis = axisPerm[a] * 9;
			const aoff = faceOffset[a];
			facelet[axis + 4] = "BFUDRL".charAt(value.getUint8(3 + a * 9));
			for (let i = 0; i < 8; i++) {
				facelet[axis + facePerm[(i + aoff) % 8]] = "BFUDRL".charAt(value.getUint8(3 + a * 9 + i + 1));
			}
		}
		const newFacelet = facelet.join('');
		if (newFacelet !== curFacelet) {
			giikerutil.log('[gocube] facelet', newFacelet);
			curCubie.fromFacelet(newFacelet);
		}
	} else if (msgType === 3) { // quaternion
		// Ignore quaternion data
	} else if (msgType === 5) { // battery level
		_batteryLevel = value.getUint8(3);
		giikerutil.log('[gocube] battery level', _batteryLevel);
	} else if (msgType === 7) { // offline stats
		giikerutil.log('[gocube] offline stats', toHexVal(value));
	} else if (msgType === 8) { // cube type
		giikerutil.log('[gocube] cube type', toHexVal(value));
	}
}

function getBatteryLevel(): Promise<[number, string]> {
	if (!_write) {
		return Promise.reject("Bluetooth Cube is not connected");
	}
	_write.writeValue(new Uint8Array([WRITE_BATTERY]).buffer as ArrayBuffer);
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve([_batteryLevel || 0, _deviceName || 'GoCube']);
		}, 1000);
	});
}

function clear(): Promise<void> {
	let result: Promise<void> = Promise.resolve();
	if (_read) {
		_read.removeEventListener('characteristicvaluechanged', onStateChanged);
		result = _read.stopNotifications().then(() => {}) as Promise<void>;
		_read = null;
	}
	_write = null;
	_service = null;
	_gatt = null;
	_deviceName = null;
	moveCntFree = 100;
	curFacelet = SOLVED_FACELET;
	curCubie = new CubieCube();
	prevCubie = new CubieCube();
	prevMoves = [];
	return result;
}

// Register cube model
const cubeModel: CubeModel = {
	prefix: ['GoCube', 'Rubiks'],
	init: init,
	opservs: [SERVICE_UUID],
	getBatteryLevel: getBatteryLevel,
	clear: clear
};

GiikerCube.regCubeModel(cubeModel);

export default cubeModel;
