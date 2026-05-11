// This file is imported into VitePWA's generated service worker via workbox.importScripts.
// It sets up Firebase Cloud Messaging for background push notifications.

// IMPORTANT: Register notificationclick BEFORE importing Firebase SDK
// (per Firebase docs, otherwise FCM may overwrite custom click behavior)
self.addEventListener('notificationclick', (event) => {
  // console.log('[SW] Notification click received.', event.notification.data)

  event.notification.close()

  const url = '/notifications' // URL to open when notification is clicked

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window already on the messages page
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise focus any existing window and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(c => c.navigate(url))
          }
        }
        // Open a new window as last resort
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Firebase Messaging setup
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCoz_bvKg59wWYty-4OWmPCLLF_wbe3tr8",
  authDomain: "myezlabo.firebaseapp.com",
  projectId: "myezlabo",
  storageBucket: "myezlabo.firebasestorage.app",
  messagingSenderId: "552504419331",
  appId: "1:552504419331:web:de4a0e05982ca40edbda36",
  measurementId: "G-Q2PR1Y63KF"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  // console.log('[SW] Received background message', payload)

  // If message includes a notification field, FCM auto-shows it — skip to avoid duplicates
  if (payload.notification) return

  // For data-only messages (legacy/fallback), show notification manually
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    const hasVisibleClient = clientList.some(client => client.visibilityState === 'visible')

    if (!hasVisibleClient) {
      const notificationTitle = payload.data?.title || 'New message'
      const notificationOptions = {
        body: payload.data?.body || 'You have a new message',
        icon: '/pwa-192x192.png',
        badge: '/badge.png',
        data: payload.data
      }

      return self.registration.showNotification(notificationTitle, notificationOptions)
    } else {
      // console.log('[SW] App is visible, foreground handler will show toast')
    }
  })
})
