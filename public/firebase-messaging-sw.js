
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyCoz_bvKg59wWYty-4OWmPCLLF_wbe3tr8",
  authDomain: "myezlabo.firebaseapp.com",
  projectId: "myezlabo",
  storageBucket: "myezlabo.firebasestorage.app",
  messagingSenderId: "552504419331",
  appId: "1:552504419331:web:de4a0e05982ca40edbda36",
  measurementId: "G-Q2PR1Y63KF"
})

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  
  // Check if any client (tab/window) is currently focused
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    const hasVisibleClient = clientList.some(client => client.visibilityState === 'visible')
    
    // Only show notification if no visible client (app is truly in background)
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
      console.log('[firebase-messaging-sw.js] App is visible, foreground handler will show toast')
    }
  })
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event.notification.data)
  
  event.notification.close()

  const url = '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(c => c.navigate(url))
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
