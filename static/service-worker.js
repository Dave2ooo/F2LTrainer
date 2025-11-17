const CACHE_NAME = 'f2l-trainer-cache-v1';
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
	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request);
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
