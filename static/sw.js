// Use a single cache name - no manual versioning needed
// The network-first strategy for critical resources ensures updates are fetched
// Old entries are naturally replaced when new versions are fetched
const CACHE_NAME = 'f2l-trainer-cache';
const urlsToCache = [
    './',
    './manifest.json',
];

self.addEventListener('install', event => {
	// Activate immediately and take control of pages to meet installability heuristics
	self.skipWaiting();
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('fetch', event => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignore non-http requests (like chrome extensions)
	if (!url.protocol.startsWith('http')) return;

	// For navigation requests (HTML) and app bundles, use network-first strategy
	// This ensures we always get the latest version and avoid 404s for renamed chunks
	if (request.mode === 'navigate' || 
	    url.pathname.includes('/_app/') || 
	    url.pathname.endsWith('.js') || 
	    url.pathname.endsWith('.css')) {
		event.respondWith(
			fetch(request)
				.then(response => {
					// Cache successful responses for offline use
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(CACHE_NAME).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache if network fails (offline support)
					return caches.match(request);
				})
		);
	} else {
		// For other resources (images, fonts, etc.), use cache-first strategy
		event.respondWith(
			caches.match(request).then(response => {
				return response || fetch(request).then(fetchResponse => {
					// Cache the fetched resource
					if (fetchResponse && fetchResponse.status === 200) {
						const responseToCache = fetchResponse.clone();
						caches.open(CACHE_NAME).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return fetchResponse;
				});
			})
		);
	}
});

self.addEventListener('activate', event => {
	// Take control of clients immediately so that the active service worker
	// is controlling the page — helpful for ensuring installability on some browsers
	event.waitUntil(
		clients.claim().then(() =>
			caches.keys().then(cacheNames => {
				return Promise.all(
					cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
				);
			})
		)
	);
});
