// Capture beforeinstallprompt as early as possible and expose to window for later
window.addEventListener('beforeinstallprompt', (e) => {
	try {
		// Prevent the automatic prompt and save for later
		e.preventDefault();
		window.__deferredPwaPrompt = e;
		// Only mark install available when a service worker controls the page
		window.__pwaInstallAvailable = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
		// Also update when controller changes (SW becomes active)
		if (navigator.serviceWorker) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				window.__pwaInstallAvailable = !!navigator.serviceWorker.controller;
				console.log('PWA: controllerchange — updating __pwaInstallAvailable', window.__pwaInstallAvailable);
			});
		}
		console.log('PWA: beforeinstallprompt captured in pwa-capture.js', e);
	} catch (err) {
		console.error('PWA: capture beforeinstallprompt error', err);
	}
});