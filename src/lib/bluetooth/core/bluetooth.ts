/**
 * Bluetooth manager for smart cubes
 * Ported from csTimer's bluetooth.js with minimal changes
 */

import type { BluetoothCube, CubeModel, CubeCallback, EventCallback } from './types';
import { giikerutil, $, DEBUG, DEBUGBL } from './utils';
import { bluetoothState } from '../store.svelte';

export function createBluetoothManager(): BluetoothCube {
	/* { prefix: cubeModel } */
	const cubeModels: Record<string, CubeModel> = {};

	function regCubeModel(cubeModel: CubeModel) {
		if ($.isArray(cubeModel.prefix)) {
			cubeModel.prefix.map((prefix) => {
				cubeModels[prefix] = cubeModel;
			});
		} else {
			cubeModels[cubeModel.prefix] = cubeModel;
		}
	}

	let cube: CubeModel | undefined = undefined;
	let _device: BluetoothDevice | null = null;

	function toUuid128(uuid: string): string {
		if (/^[0-9A-Fa-f]{4}$/.exec(uuid)) {
			uuid = '0000' + uuid + '-0000-1000-8000-00805F9B34FB';
		}
		return uuid.toUpperCase();
	}

	function findUUID(elems: any[], uuid: string): any {
		uuid = toUuid128(uuid);
		for (let i = 0; i < elems.length; i++) {
			const elem = elems[i];
			if (toUuid128(elem.uuid) === uuid) {
				return elem;
			}
		}
		return null;
	}

	function waitForAdvs(): Promise<any> {
		if (!_device || !(_device as any).watchAdvertisements) {
			return Promise.reject(-1);
		}
		const abortController = new AbortController();
		return new Promise(function (resolve, reject) {
			const onAdvEvent = function (event: any) {
				giikerutil.log('[bluetooth] receive adv event', event);
				_device && _device.removeEventListener('advertisementreceived', onAdvEvent);
				abortController.abort();
				resolve(event.manufacturerData);
			};
			_device!.addEventListener('advertisementreceived', onAdvEvent);
			(_device as any).watchAdvertisements({ signal: abortController.signal });
			setTimeout(function () {
				// reject if no mac found
				_device && _device.removeEventListener('advertisementreceived', onAdvEvent);
				abortController.abort();
				reject(-2);
			}, 10000);
		});
	}

	function onHardwareEvent(info: string, event?: any): Promise<void> {
		let res: Promise<void> = Promise.resolve();
		if (info === 'disconnect') {
			res = Promise.resolve(stop(true));
		}
		return res.then(function () {
			if (typeof evtCallback === 'function') {
				evtCallback(info, event);
			}
		});
	}

	const onDisconnect = onHardwareEvent.bind(null, 'disconnect');

	function init(reconnect?: boolean, expectedMac?: string): Promise<void> {
		return giikerutil
			.chkAvail()
			.then(function () {
				if (_device && reconnect) {
					giikerutil.log('[bluetooth]', 'reconnecting...', _device);
					return waitUntilDeviceAvailable(_device);
				}
				const filters = Object.keys(cubeModels).map((prefix) => ({ namePrefix: prefix }));
				const opservs = [
					...new Set(
						Array.prototype.concat.apply(
							[],
							Object.values(cubeModels).map((cubeModel) => cubeModel.opservs || [])
						)
					)
				];
				const cics = [
					...new Set(
						Array.prototype.concat.apply(
							[],
							Object.values(cubeModels).map((cubeModel) => cubeModel.cics || [])
						)
					)
				];
				giikerutil.log('[bluetooth]', 'scanning...', Object.keys(cubeModels));
				return (window.navigator as any).bluetooth.requestDevice({
					filters: filters,
					optionalServices: opservs,
					optionalManufacturerData: cics
				});
			})
			.then(function (device: BluetoothDevice) {
				giikerutil.log('[bluetooth]', 'BLE device is selected, name=' + device.name, device);
				_device = device;
				device.addEventListener('gattserverdisconnected', onDisconnect);
				cube = undefined;
				for (const prefix in cubeModels) {
					if (device.name && device.name.startsWith(prefix)) {
						cube = cubeModels[prefix];
						break;
					}
				}
				if (!cube) {
					return Promise.reject('Cannot detect device type');
				}
				return cube.init(device, expectedMac);
			})
			.then(async () => {
				bluetoothState.setConnected(true);
				bluetoothState.setDeviceName(_device?.name || null);
				bluetoothState.setDeviceId(_device?.id || null);

				if (cube && cube.getMacAddress) {
					try {
						const mac = await cube.getMacAddress();
						bluetoothState.setDeviceMac(mac || null);
					} catch (e) {
						console.warn('[bluetooth] failed to get MAC address', e);
						bluetoothState.setDeviceMac(null);
					}
				} else {
					bluetoothState.setDeviceMac(null);
				}

				GiikerCube.setCallback(bluetoothState.handleCubeCallback);
			})
			.catch((err) => {
				giikerutil.log('[bluetooth] connection failed', err);
				// Attempt cleanup if partial connection
				if (_device) {
					_device.removeEventListener('gattserverdisconnected', onDisconnect);
					if (_device.gatt && _device.gatt.connected) {
						_device.gatt.disconnect();
					}
					_device = null;
				}
				bluetoothState.setConnected(false);
				bluetoothState.setDeviceName(null);
				bluetoothState.setDeviceId(null);
				bluetoothState.setDeviceMac(null);
				// Propagate error to caller
				return Promise.reject(err);
			});
	}

	// Wait until target device start sending bluetooth advertisiment packets
	function waitUntilDeviceAvailable(device: BluetoothDevice): Promise<BluetoothDevice> {
		const abortController = new AbortController();
		return new Promise(function (resolve, reject) {
			if (!(device as any).watchAdvertisements) {
				reject('Bluetooth Advertisements API is not supported by this browser');
			} else {
				const onAdvEvent = function (event: any) {
					DEBUG && console.log('[bluetooth] received advertisement packet from device', event);
					delete (device as any).stopWaiting;
					device.removeEventListener('advertisementreceived', onAdvEvent);
					abortController.abort();
					resolve(device);
				};
				(device as any).stopWaiting = function () {
					DEBUG && console.log('[bluetooth] cancel waiting for device advertisements');
					delete (device as any).stopWaiting;
					device.removeEventListener('advertisementreceived', onAdvEvent);
					abortController.abort();
				};
				device.addEventListener('advertisementreceived', onAdvEvent);
				(device as any).watchAdvertisements({ signal: abortController.signal });
				DEBUG && console.log('[bluetooth] start waiting for device advertisement packet');
			}
		});
	}

	function stop(isHardwareEvent?: boolean): Promise<void> {
		if (!_device) {
			return Promise.resolve();
		}
		return Promise.resolve()
			.then(() => cube && cube.clear(isHardwareEvent))
			.catch((e) => {
				console.warn('[bluetooth] error clearing cube:', e);
			})
			.then(function () {
				if (_device) {
					_device.removeEventListener('gattserverdisconnected', onDisconnect);
					if (_device.gatt && _device.gatt.connected) {
						_device.gatt.disconnect();
					}
					_device = null;
				}
				bluetoothState.setConnected(false);
				bluetoothState.setDeviceName(null);
				bluetoothState.setDeviceId(null);
				if (isHardwareEvent) {
					bluetoothState.setErrorMessage('Cube disconnected unexpectedly. Please reconnect.');
				}
			});
	}

	let callback: CubeCallback = $.noop as any;
	let evtCallback: EventCallback = $.noop as any;

	return {
		init: init,
		stop: stop,
		isConnected: function () {
			return _device !== null || DEBUGBL;
		},
		setCallback: function (func: CubeCallback) {
			callback = func;
		},
		setEventCallback: function (func: EventCallback) {
			evtCallback = func;
		},
		getCube: function () {
			return (
				cube ||
				(DEBUGBL
					? {
							getBatteryLevel: function () {
								return Promise.resolve([80, 'Debug'] as [number, string]);
							},
							init: $.noop as any,
							clear: $.noop as any,
							prefix: 'Debug'
						}
					: null)
			);
		},
		regCubeModel: regCubeModel,
		findUUID: findUUID,
		waitForAdvs: waitForAdvs,
		onDisconnect: onDisconnect,
		callback: function () {
			return callback.apply(null, arguments as any);
		}
	};
}

// Export singleton instances
export const GiikerCube = createBluetoothManager();
export const BluetoothTimer = createBluetoothManager();

// Timer state constants
export const BluetoothTimerSTATE = {
	DISCONNECT: 0, // Fired when timer is disconnected from bluetooth
	GET_SET: 1, // Grace delay is expired and timer is ready to start
	HANDS_OFF: 2, // Hands removed from the timer before grace delayexpired
	RUNNING: 3, // Timer is running
	STOPPED: 4, // Timer is stopped, this event includes recorded time
	IDLE: 5, // Timer is reset and idle
	HANDS_ON: 6, // Hands are placed on the timer
	FINISHED: 7, // Timer moves to this state immediately after STOPPED
	INSPECTION: 8,
	GAN_RESET: 9
};
