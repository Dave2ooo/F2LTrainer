import { browser, dev } from '$app/environment';
import { base } from '$app/paths';
import { pwaPrompt, clearPwaPrompt } from '$lib/pwaPrompt.svelte';

export function startPwaManager() {
	if (!browser) return;

	// In development, unregister any existing service workers to avoid caching issues
	if (dev) {
		if ('serviceWorker' in navigator) {
			console.log('PWA Manager: dev mode detected, checking for existing service workers...');
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				if (registrations.length === 0) {
					console.log('PWA Manager: no existing service workers found.');
				} else {
					for (const registration of registrations) {
						console.log('PWA Manager: unregistering SW in dev mode', registration.scope);
						registration.unregister();
					}
				}
			});
		}
		return;
	}

	if (!('serviceWorker' in navigator)) return;

	const swPath = `${base}/service-worker.js`;

	const doRegister = () => {
		console.log('PWA Manager: registering service worker:', swPath);
		navigator.serviceWorker
			.register(swPath)
			.then((reg) => console.log('PWA Manager: registered:', reg.scope))
			.catch((err) => console.error('PWA Manager: registration failed', err));

		navigator.serviceWorker.ready
			.then(() =>
				console.log(
					'PWA Manager: ready; SW controlling clients:',
					!!navigator.serviceWorker.controller
				)
			)
			.catch(() => {});
	};

	// Keep registration quick (do not wait for window.load)
	doRegister();

	function onBeforeInstallPrompt(e: Event) {
		e.preventDefault();
		pwaPrompt.deferredPrompt = e as unknown as typeof pwaPrompt.deferredPrompt;
		console.log('PWA Manager: beforeinstallprompt captured');

		if (navigator.serviceWorker && navigator.serviceWorker.controller) {
			pwaPrompt.installAvailable = true;
			console.log('PWA Manager: install available; SW controller present');
		} else {
			navigator.serviceWorker.ready
				.then(() => {
					if (navigator.serviceWorker && navigator.serviceWorker.controller) {
						pwaPrompt.installAvailable = true;
						console.log('PWA Manager: install available after SW ready');
					}
				})
				.catch(() => {});
		}
	}

	function onAppInstalled() {
		clearPwaPrompt();
		console.log('PWA Manager: appinstalled');
	}

	window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
	window.addEventListener('appinstalled', onAppInstalled);

	// Update install availability when a new controller takes over
	if (navigator.serviceWorker) {
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (pwaPrompt.deferredPrompt) {
				pwaPrompt.installAvailable = !!navigator.serviceWorker.controller;
				console.log('PWA Manager: controllerchange — installAvailable', pwaPrompt.installAvailable);
			}
		});
	}

	// pull early capture from window if present
	if ((window as any).__deferredPwaPrompt) {
		pwaPrompt.deferredPrompt = (window as any).__deferredPwaPrompt;
		pwaPrompt.installAvailable = !!navigator.serviceWorker.controller;
		console.log('PWA Manager: pulled deferred prompt from window');
	}
}

export function stopPwaManager() {
	// No-op for now — event listeners are left alone in dev mode.
}
