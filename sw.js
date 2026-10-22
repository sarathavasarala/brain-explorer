// Service Worker for Brain Explorer PWA
// Provides offline shell caching and enables Add to Home Screen on mobile.

const CACHE_NAME = 'brain-explorer-v9';
const APP_PRECACHE = [
  './',
  './index.html',
  './styles.css?v=9',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './src/main.js?v=9',
  './src/content/ai-contract.js',
  './src/content/catalog.json',
];
const CDN_PRECACHE = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js',
];
const IMPORT_RE = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]((?:\.{1,2}\/|\/)[^'"]+)['"]/g;

function isThreeCdn(url) {
  return url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith('/npm/three@0.160.0/');
}

async function cacheModuleGraph(cache, entryUrl) {
  const seen = new Set();
  async function visit(rawUrl) {
    const url = new URL(rawUrl, self.location.href);
    if (seen.has(url.href)) return;
    seen.add(url.href);
    if (url.origin !== self.location.origin && !isThreeCdn(url)) return;
    const response = await fetch(url.href, { cache: 'reload' });
    if (!response || !response.ok) return;
    const text = await response.clone().text();
    await cache.put(url.href, response);
    for (const match of text.matchAll(IMPORT_RE)) {
      await visit(new URL(match[1], url).href);
    }
  }
  try {
    await visit(entryUrl);
  } catch {
    // Best effort: the app shell precache still decides install success.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_PRECACHE);
    await cacheModuleGraph(cache, new URL('./src/main.js?v=9', self.location.href).href);
    await Promise.all(CDN_PRECACHE.map((url) => cacheModuleGraph(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || network.then((res) => res || new Response('', { status: 504 }));
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('./index.html')) || new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // On localhost and development IPs, bypass cache so edits immediately reflect
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) {
      return;
    }
    if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(networkFirstNavigation(event.request));
      return;
    }
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (isThreeCdn(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
