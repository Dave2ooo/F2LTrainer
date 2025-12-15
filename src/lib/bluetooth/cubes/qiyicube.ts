/**
 * QiYi Cube implementation
 * Ported from csTimer's qiyicube.js with minimal changes
 * Note: This implementation requires lz-string for key decompression
 */

import { GiikerCube } from '../core/bluetooth';
import { CubieCube, SOLVED_FACELET } from '../core/mathlib';
import { giikerutil, $, DEBUGBL } from '../core/utils';
import type { CubeModel } from '../core/types';
import LZString from 'lz-string';
import { bluetoothState } from '../store.svelte';

let _gatt: BluetoothRemoteGATTServer | null = null;
let _service: BluetoothRemoteGATTService | null = null;
let _deviceName: string | null = null;
let _chrct_cube: BluetoothRemoteGATTCharacteristic | null = null;

const UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';
const SERVICE_UUID = '0000fff0' + UUID_SUFFIX;
const CHRCT_UUID_CUBE = '0000fff6' + UUID_SUFFIX;

const QIYI_CIC_LIST = [0x0504];

let decoder: any = null;
let deviceMac: string | null = null;
const KEYS = ['NoDg7ANAjGkEwBYCc0xQnADAVgkzGAzHNAGyRTanQi5QIFyHrjQMQgsC6QA'];

async function initMac(forcePrompt: boolean, isWrongKey?: boolean) {
	let defaultMac: string | null = null;
	if (_deviceName && /^(QY-QYSC|XMD-TornadoV4-i)-.-[0-9A-F]{4}$/.exec(_deviceName)) {
		defaultMac = 'CC:A3:00:00:' + _deviceName.slice(-4, -2) + ':' + _deviceName.slice(-2);
	}
	deviceMac =
		(await giikerutil.reqMacAddr(forcePrompt, isWrongKey || false, deviceMac, defaultMac)) || null;

	if (!deviceMac) {
		throw new Error('MAC address required');
	}
	bluetoothState.setDeviceMac(deviceMac);
}

function crc16modbus(data: number[]): number {
	let crc = 0xffff;
	for (let i = 0; i < data.length; i++) {
		crc ^= data[i];
		for (let j = 0; j < 8; j++) {
			crc = (crc & 0x1) > 0 ? (crc >> 1) ^ 0xa001 : crc >> 1;
		}
	}
	return crc;
}

// content: [u8, u8, ..]
function sendMessage(content: number[]): Promise<void> {
	if (!_chrct_cube || DEBUGBL) {
		return DEBUGBL ? Promise.resolve() : Promise.reject();
	}
	const msg = [0xfe];
	msg.push(4 + content.length); // length = 1 (op) + cont.length + 2 (crc)
	for (let i = 0; i < content.length; i++) {
		msg.push(content[i]);
	}
	const crc = crc16modbus(msg);
	msg.push(crc & 0xff, crc >> 8);
	const npad = (16 - (msg.length % 16)) % 16;
	for (let i = 0; i < npad; i++) {
		msg.push(0);
	}
	const encMsg: number[] = [];
	decoder = decoder || $.aes128(JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[0])!));
	for (let i = 0; i < msg.length; i += 16) {
		const block = msg.slice(i, i + 16);
		decoder!.encrypt(block);
		for (let j = 0; j < 16; j++) {
			encMsg[i + j] = block[j];
		}
	}
	giikerutil.log('[qiyicube] send message to cube', msg, encMsg);
	return _chrct_cube.writeValue(new Uint8Array(encMsg).buffer as ArrayBuffer) as Promise<void>;
}

function sendHello(mac: string | undefined | null): Promise<void> {
	if (!mac) {
		return Promise.reject('empty mac');
	}
	const content = [0x00, 0x6b, 0x01, 0x00, 0x00, 0x22, 0x06, 0x00, 0x02, 0x08, 0x00];
	for (let i = 5; i >= 0; i--) {
		content.push(parseInt(mac.slice(i * 3, i * 3 + 2), 16));
	}
	return sendMessage(content);
}

function getManufacturerDataBytes(mfData: any): DataView | undefined {
	if (mfData instanceof DataView) {
		// workaround for Bluefy browser
		return new DataView(mfData.buffer.slice(2));
	}
	for (const id of QIYI_CIC_LIST) {
		if (mfData.has(id)) {
			giikerutil.log(
				'[qiyicube] found Manufacturer Data under CIC = 0x' + id.toString(16).padStart(4, '0')
			);
			return mfData.get(id);
		}
	}
	giikerutil.log('[qiyicube] Looks like this cube has new unknown CIC');
	return undefined;
}

function init(device: BluetoothDevice): Promise<void> {
	clear();
	_deviceName = device.name ? device.name.trim() : 'QiYi';
	giikerutil.log('[qiyicube] start init device');
	return GiikerCube.waitForAdvs()
		.then(function (mfData) {
			const dataView = getManufacturerDataBytes(mfData);
			if (dataView && dataView.byteLength >= 6) {
				const mac: string[] = [];
				for (let i = 5; i >= 0; i--) {
					mac.push((dataView.getUint8(i) + 0x100).toString(16).slice(1));
				}
				return Promise.resolve(mac.join(':'));
			}
			return Promise.reject(-3);
		})
		.then(
			function (mac: string) {
				giikerutil.log('[qiyicube] init, found cube bluetooth hardware MAC = ' + mac);
				deviceMac = mac;
				bluetoothState.setDeviceMac(mac);
			},
			function (err: any) {
				giikerutil.log(
					'[qiyicube] init, unable to automatically determine cube MAC, error code = ' + err
				);
			}
		)
		.then(function () {
			return device.gatt!.connect();
		})
		.then(function (gatt) {
			_gatt = gatt;
			return gatt.getPrimaryService(SERVICE_UUID);
		})
		.then(function (service) {
			_service = service;
			giikerutil.log('[qiyicube] got primary service', SERVICE_UUID);
			return _service.getCharacteristics();
		})
		.then(function (chrcts) {
			giikerutil.log('[qiyicube] find chrcts', chrcts);
			_chrct_cube = GiikerCube.findUUID(chrcts, CHRCT_UUID_CUBE);
		})
		.then(function () {
			_chrct_cube!.addEventListener('characteristicvaluechanged', onCubeEvent);
			return _chrct_cube!.startNotifications();
		})
		.then(function () {
			return initMac(false);
		})
		.then(function () {
			return sendHello(deviceMac);
		});
}

function onCubeEvent(event: Event) {
	const target = event.target as BluetoothRemoteGATTCharacteristic;
	const value = target.value!;
	const encMsg: number[] = [];
	for (let i = 0; i < value.byteLength; i++) {
		encMsg[i] = value.getUint8(i);
	}
	giikerutil.log('[qiyicube] receive enc data', encMsg);
	decoder = decoder || $.aes128(JSON.parse(LZString.decompressFromEncodedURIComponent(KEYS[0])!));
	const msg: number[] = [];
	for (let i = 0; i < encMsg.length; i += 16) {
		const block = encMsg.slice(i, i + 16);
		decoder!.decrypt(block);
		for (let j = 0; j < 16; j++) {
			msg[i + j] = block[j];
		}
	}
	giikerutil.log('[qiyicube] decrypted msg', msg);
	const msgSlice = msg.slice(0, msg[1]);
	if (msgSlice.length < 3 || crc16modbus(msgSlice) !== 0) {
		giikerutil.log('[qiyicube] crc checked error');
		return;
	}
	parseCubeData(msgSlice);
}

let curCubie = new CubieCube();
let prevCubie = new CubieCube();
let prevMoves: string[] = [];
let lastTs = 0;
let batteryLevel = 0;

function parseCubeData(msg: number[]) {
	const locTime = $.now();
	if (msg[0] !== 0xfe) {
		giikerutil.log('[qiyicube] error cube data', msg);
		return;
	}
	const opcode = msg[2];
	const ts = (msg[3] << 24) | (msg[4] << 16) | (msg[5] << 8) | msg[6];
	if (opcode === 0x2) {
		// cube hello
		batteryLevel = msg[35];
		sendMessage(msg.slice(2, 7));
		const newFacelet = parseFacelet(msg.slice(7, 34));
		GiikerCube.callback(newFacelet, [], [Math.trunc(ts / 1.6), locTime], _deviceName || undefined);
		prevCubie.fromFacelet(newFacelet);
		// Skip solved state check for now
	} else if (opcode === 0x3) {
		// state change
		sendMessage(msg.slice(2, 7));
		// check timestamps
		const todoMoves: [number, number][] = [[msg[34], ts]];
		while (todoMoves.length < 10) {
			const off = 91 - 5 * todoMoves.length;
			const hisTs = (msg[off] << 24) | (msg[off + 1] << 16) | (msg[off + 2] << 8) | msg[off + 3];
			const hisMv = msg[off + 4];
			if (hisTs <= lastTs) {
				break;
			}
			todoMoves.push([hisMv, hisTs]);
		}
		if (todoMoves.length > 1) {
			giikerutil.log('[qiyicube] miss history moves', JSON.stringify(todoMoves), lastTs);
		}
		const toCallback: [string, string[], [number, number], string?][] = [];
		let curFacelet: string = '';
		for (let i = todoMoves.length - 1; i >= 0; i--) {
			const axis = [4, 1, 3, 0, 2, 5][(todoMoves[i][0] - 1) >> 1];
			const power = [0, 2][todoMoves[i][0] & 1];
			const m = axis * 3 + power;
			CubieCube.CubeMult(prevCubie, CubieCube.moveCube[m], curCubie);
			prevMoves.unshift('URFDLB'.charAt(axis) + " 2'".charAt(power));
			prevMoves = prevMoves.slice(0, 8);
			curFacelet = curCubie.toFaceCube();
			toCallback.push([
				curFacelet,
				prevMoves.slice(),
				[Math.trunc(todoMoves[i][1] / 1.6), locTime],
				_deviceName || undefined
			]);
			const tmp = curCubie;
			curCubie = prevCubie;
			prevCubie = tmp;
		}
		const newFacelet = parseFacelet(msg.slice(7, 34));
		if (newFacelet !== curFacelet) {
			giikerutil.log('[qiyicube] facelet', newFacelet);
			curCubie.fromFacelet(newFacelet);
			GiikerCube.callback(
				newFacelet,
				prevMoves,
				[Math.trunc(ts / 1.6), locTime],
				_deviceName || undefined
			);
			const tmp = curCubie;
			curCubie = prevCubie;
			prevCubie = tmp;
		} else {
			for (let i = 0; i < toCallback.length; i++) {
				GiikerCube.callback.apply(null, toCallback[i]);
			}
		}
		const newBatteryLevel = msg[35];
		if (newBatteryLevel !== batteryLevel) {
			batteryLevel = newBatteryLevel;
			giikerutil.updateBattery([batteryLevel, _deviceName || 'QiYi']);
		}
	}
	lastTs = ts;
}

function parseFacelet(faceMsg: number[]): string {
	const ret: string[] = [];
	for (let i = 0; i < 54; i++) {
		ret.push('LRDUFB'.charAt((faceMsg[i >> 1] >> (i % 2 << 2)) & 0xf));
	}
	return ret.join('');
}

function getBatteryLevel(): Promise<[number, string]> {
	return Promise.resolve([batteryLevel, _deviceName || 'QiYi']);
}

function clear(): Promise<void> {
	let result: Promise<void> = Promise.resolve();
	if (_chrct_cube) {
		_chrct_cube.removeEventListener('characteristicvaluechanged', onCubeEvent);
		result = _chrct_cube.stopNotifications().then(() => {}) as Promise<void>;
		_chrct_cube = null;
	}
	_service = null;
	_gatt = null;
	_deviceName = null;
	deviceMac = null;
	curCubie = new CubieCube();
	prevCubie = new CubieCube();
	prevMoves = [];
	lastTs = 0;
	batteryLevel = 0;
	return result;
}

// Register cube model
const cubeModel: CubeModel = {
	prefix: ['QY-QYSC', 'XMD-TornadoV4-i'],
	init: init,
	opservs: [SERVICE_UUID],
	cics: QIYI_CIC_LIST,
	getBatteryLevel: getBatteryLevel,
	clear: clear
};

GiikerCube.regCubeModel(cubeModel);

export default cubeModel;
