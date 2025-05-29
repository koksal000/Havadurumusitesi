// public/sw.js

const CACHE_NAME = 'havadurumux-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json', // Eğer bir manifest dosyanız varsa
  '/logo.png', // Bildirim ikonu için
  // Diğer önemli statik varlıklar
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Install completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache open/addAll failed during install:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Eski cache'leri temizle
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activate completed, clients claimed.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Şimdilik sadece ağdan getirme stratejisi veya cache-first eklenebilir
  // console.log('Service Worker: Fetching', event.request.url);
  // event.respondWith(
  //   caches.match(event.request)
  //     .then((response) => {
  //       return response || fetch(event.request);
  //     })
  // );
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  const data = event.data ? event.data.json() : { title: 'Yeni Bildirim', body: 'Bir güncelleme var!', icon: '/logo.png', badge: '/logo_badge.png' };

  const title = data.title || 'HavaDurumuX';
  const options = {
    body: data.body || 'Hava durumu bilgisi güncellendi.',
    icon: data.icon || '/logo.png', // /public klasöründe olmalı
    badge: data.badge || '/logo_badge.png', // /public klasöründe olmalı
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/', // Bildirime tıklanınca açılacak URL
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click Received.');
  event.notification.close();
  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Eğer site zaten bir sekmede açıksa, o sekmeye odaklan
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // URL'yi daha esnek kontrol et, örneğin ana domain'i içeriyor mu diye bak
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // Belirli bir sayfaya yönlendirme yapmak istersen:
          // client.navigate(urlToOpen).then(client => client.focus());
          // Sadece odaklanmak istersen:
          return client.focus();
        }
      }
      // Site açık değilse, yeni bir sekmede aç
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('Service Worker: Loaded.');
