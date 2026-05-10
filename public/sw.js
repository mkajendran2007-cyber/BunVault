self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle standard HTTP and HTTPS requests to prevent errors with WebSockets or browser extensions
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch((error) => {
      // Gracefully catch and log network timeouts or offline states without breaking the page load
      console.debug("Service Worker fetch bypassed due to offline/timeout:", error);
      return Response.error();
    })
  );
});
