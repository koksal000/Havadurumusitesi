
// public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  // Optionally, precache assets here if needed
  self.skipWaiting(); // Ensures the new SW activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  // Optionally, clean up old caches here
  event.waitUntil(self.clients.claim()); // Ensures the SW takes control of current clients immediately
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  const data = event.data ? event.data.json() : { title: 'HavaDurumuX Bildirimi', body: 'Yeni bir bildiriminiz var!', icon: '/logo.png', data: { url: '/' } };
  
  const title = data.title || 'HavaDurumuX Bildirimi';
  const options = {
    body: data.body || 'Yeni bir bildiriminiz var!',
    icon: data.icon || '/logo.png', // Default icon
    badge: data.badge || '/logo_badge.png', // A smaller icon for the notification tray (create this image if you want to use it)
    image: data.image, // A larger image within the notification
    vibrate: data.vibrate || [200, 100, 200], // Vibration pattern
    tag: data.tag || 'havadurumux-notification', // Tag to group notifications or replace existing ones
    renotify: data.renotify || false, // If true, new notifications with the same tag will re-alert the user
    requireInteraction: data.requireInteraction || false, // If true, notification stays until user interacts
    actions: data.actions || [], // e.g., [{ action: 'explore', title: 'Keşfet', icon: '/icons/explore.png' }]
    data: data.data || { url: '/' } // Custom data to pass to notificationclick
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received.', event.notification);
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If a window for the app is already open, focus it
        if (client.url === self.location.origin + urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Basic fetch handler for offline capability (optional, can be expanded)
// self.addEventListener('fetch', (event) => {
//   // console.log('Service Worker: Fetching', event.request.url);
//   // Example: Cache-first strategy for static assets (very basic)
//   // event.respondWith(
//   //   caches.match(event.request).then((response) => {
//   //     return response || fetch(event.request);
//   //   })
//   // );
// });
    