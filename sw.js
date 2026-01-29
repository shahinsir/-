// Service Worker for Education App - Version 4.0.0
const APP_VERSION = '4.0.0';
const CACHE_NAME = 'education-app-v4-' + APP_VERSION;
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://i.ibb.co/wFnz89n6/icon-192x192.png',
  'https://i.ibb.co/XGNQ8V4/icon-180x180.png',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage-compat.js'
];

// Install event - Cache resources
self.addEventListener('install', event => {
  console.log('🔄 Service Worker installing v' + APP_VERSION + '...');
  
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell for version:', APP_VERSION);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed and resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating v' + APP_VERSION + '...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete ALL old caches
            if (cacheName !== CACHE_NAME && cacheName.startsWith('education-app-')) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated and ready');
      
      // Send message to all clients about update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'APP_UPDATED',
            version: APP_VERSION,
            message: 'অ্যাপ আপডেট হয়েছে! নতুন ফিচার: ফাইল ব্যবস্থাপনা, বই, গাইড, ভিডিও'
          });
        });
      });
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Message event
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});