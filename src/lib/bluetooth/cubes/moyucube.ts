/**
 * MoYu Cube implementation
 * Ported from csTimer's moyucube.js with minimal changes
 */

import { GiikerCube } from '../core/bluetooth';
import { CubieCube, SOLVED_FACELET } from '../core/mathlib';
import { giikerutil, $ } from '../core/utils';
import type { CubeModel } from '../core/types';

let _gatt: BluetoothRemoteGATTServer | null = null;
let _service: BluetoothRemoteGATTService | null = null;
let _deviceName: string | null = null;
let _chrct_write: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_read: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_turn: BluetoothRemoteGATTCharacteristic | null = null;
let _chrct_gyro: BluetoothRemoteGATTCharacteristic | null = null;

const UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';
const SERVICE_UUID = '00001000' + UUID_SUFFIX;
const CHRCT_UUID_WRITE = '00001001' + UUID_SUFFIX;
const CHRCT_UUID_READ = '00001002' + UUID_SUFFIX;
const CHRCT_UUID_TURN = '00001003' + UUID_SUFFIX;
const CHRCT_UUID_GYRO = '00001004' + UUID_SUFFIX;

function init(device: BluetoothDevice, expectedMac?: string): Promise<void> {
	clear();
	_deviceName = device.name || 'MoYu';
	return device
		.gatt!.connect()
		.then(function (gatt) {
			_gatt = gatt;
			return gatt.getPrimaryService(SERVICE_UUID);
		})
		.then(function (service) {
			_service = service;
			return _service.getCharacteristics();
		})
		.then(function (chrcts) {
			giikerutil.log('[moyucube] find chrcts', chrcts);
			_chrct_write = GiikerCube.findUUID(chrcts, CHRCT_UUID_WRITE);
			_chrct_read = GiikerCube.findUUID(chrcts, CHRCT_UUID_READ);
			_chrct_turn = GiikerCube.findUUID(chrcts, CHRCT_UUID_TURN);
			_chrct_gyro = GiikerCube.findUUID(chrcts, CHRCT_UUID_GYRO);
		})
		.then(function () {
			_chrct_read!.addEventListener('characteristicvaluechanged', onReadEvent);
			_chrct_turn!.addEventListener('characteristicvaluechanged', onTurnEvent);
			_chrct_gyro!.addEventListener('characteristicvaluechanged', onGyroEvent);
			_chrct_read!.startNotifications();
			_chrct_turn!.startNotifications();
			_chrct_gyro!.startNotifications();
		});
}

let faceStatus = [0, 0, 0, 0, 0, 0];
let curFacelet = SOLVED_FACELET;
let curCubie = new CubieCube();
let prevCubie = new CubieCube();
let prevMoves: string[] = [];

function onReadEvent(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	giikerutil.log('[moyucube] Received read event', value);
}

function onGyroEvent(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	giikerutil.log('[moyucube] Received gyro event', value);
}

function onTurnEvent(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	giikerutil.log('[moyucube] Received turn event', value);
	parseTurn(value);
}

function parseTurn(data: DataView) {
	const locTime = $.now();
	if (data.byteLength < 1) {
		return;
	}
	const n_moves = data.getUint8(0);
	if (data.byteLength < 1 + n_moves * 6) {
		return;
	}
	for (let i = 0; i < n_moves; i++) {
		const offset = 1 + i * 6;
		let ts =
			(data.getUint8(offset + 1) << 24) |
			(data.getUint8(offset + 0) << 16) |
			(data.getUint8(offset + 3) << 8) |
			data.getUint8(offset + 2);
		ts = Math.round((ts / 65536) * 1000);
		const face = data.getUint8(offset + 4);
		const dir = Math.round(data.getUint8(offset + 5) / 36);
		const prevRot = faceStatus[face];
		const curRot = faceStatus[face] + dir;
		faceStatus[face] = (curRot + 9) % 9;
		const axis = [3, 4, 5, 1, 2, 0][face];
		let pow = 0;
		if (prevRot >= 5 && curRot <= 4) {
			pow = 2;
		} else if (prevRot <= 4 && curRot >= 5) {
			pow = 0;
		} else {
			continue;
		}
		const m = axis * 3 + pow;
		giikerutil.log('[moyucube] move', 'URFDLB'.charAt(axis) + " 2'".charAt(pow));
		CubieCube.CubeMult(prevCubie, CubieCube.moveCube[m], curCubie);
		curFacelet = curCubie.toFaceCube();
		prevMoves.unshift('URFDLB'.charAt(axis) + " 2'".charAt(pow));
		if (prevMoves.length > 8) prevMoves = prevMoves.slice(0, 8);
		GiikerCube.callback(curFacelet, prevMoves, [ts, locTime], _deviceName || undefined);
		const tmp = curCubie;
		curCubie = prevCubie;
		prevCubie = tmp;
	}
}

function getBatteryLevel(): Promise<[number, string]> {
	if (!_gatt) {
		return Promise.reject('Bluetooth Cube is not connected');
	}
	return Promise.resolve([100, _deviceName || 'MoYu']);
}

function clear(): Promise<void> {
	let result: Promise<void> = Promise.resolve();
	if (_chrct_read || _chrct_turn || _chrct_gyro) {
		_chrct_read && _chrct_read.removeEventListener('characteristicvaluechanged', onReadEvent);
		_chrct_turn && _chrct_turn.removeEventListener('characteristicvaluechanged', onTurnEvent);
		_chrct_gyro && _chrct_gyro.removeEventListener('characteristicvaluechanged', onGyroEvent);
		result = Promise.all([
			_chrct_read && _chrct_read.stopNotifications().catch($.noop),
			_chrct_turn && _chrct_turn.stopNotifications().catch($.noop),
			_chrct_gyro && _chrct_gyro.stopNotifications().catch($.noop)
		]).then(() => {}) as Promise<void>;
		_chrct_read = null;
		_chrct_turn = null;
		_chrct_gyro = null;
	}
	_chrct_write = null;
	_service = null;
	_gatt = null;
	_deviceName = null;
	faceStatus = [0, 0, 0, 0, 0, 0];
	curFacelet = SOLVED_FACELET;
	curCubie = new CubieCube();
	prevCubie = new CubieCube();
	prevMoves = [];
	return result;
}

// Register cube model
const cubeModel: CubeModel = {
	prefix: 'MHC',
	init: init,
	opservs: [SERVICE_UUID],
	getBatteryLevel: getBatteryLevel,
	clear: clear
};

GiikerCube.regCubeModel(cubeModel);

export default cubeModel;
