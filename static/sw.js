// Use a single cache name - no manual versioning needed
// The network-first strategy for critical resources ensures updates are fetched
// Old entries are naturally replaced when new versions are fetched
const CACHE_NAME = 'f2l-trainer-cache';
const urlsToCache = [
    './',
    './index.html',
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

	// Ignore non-http requests
	if (!url.protocol.startsWith('http')) return;

	// Ignore external domains (Clerk, Convex, etc.) - let them go directly to network
	if (url.origin !== self.location.origin) return;

	// Navigation requests: Network first, fall back to cached App Shell (./)
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then(response => {
					// Optionally cache the fresh nav response if it's 200
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(CACHE_NAME).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache (App Shell)
					return caches.match('./') || caches.match('index.html');
				})
		);
		return;
	}

	// Build assets: Network first (to get latest updates), allow fallback to cache
	if (url.pathname.includes('/_app/') || 
	    url.pathname.endsWith('.js') || 
	    url.pathname.endsWith('.css')) {
		event.respondWith(
			fetch(request)
				.then(response => {
					if (response && response.status === 200) {
						const responseToCache = response.clone();
						caches.open(CACHE_NAME).then(cache => {
							cache.put(request, responseToCache);
						});
					}
					return response;
				})
				.catch(() => {
					return caches.match(request);
				})
		);
		return;
	}

	// Cache-first for everything else (images, fonts)
	event.respondWith(
		caches.match(request).then(response => {
			return response || fetch(request).then(fetchResponse => {
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
