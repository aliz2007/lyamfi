/// <reference lib="webworker" />

// App Test ne conserve aucune copie HTML. Les publications Cloudflare/Lovable
// sont donc visibles à la prochaine navigation, sans ancien cache à purger.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
  }
});
