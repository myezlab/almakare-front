import { getAnalytics } from "firebase/analytics"
import { initializeApp } from "firebase/app"
import { getFunctions } from 'firebase/functions'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyCoz_bvKg59wWYty-4OWmPCLLF_wbe3tr8",
  authDomain: "myezlabo.firebaseapp.com",
  projectId: "myezlabo",
  storageBucket: "myezlabo.firebasestorage.app",
  messagingSenderId: "552504419331",
  appId: "1:552504419331:web:de4a0e05982ca40edbda36",
  measurementId: "G-Q2PR1Y63KF"
}

const app = initializeApp(firebaseConfig)
const functions = getFunctions(app, 'europe-west1')
const analytics = getAnalytics(app)

// Initialize messaging only if supported (browser environment)
let messaging = null
let swRegistrationPromise = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
    // Use the active service worker registration (managed by VitePWA, which
    // imports firebase-messaging-init.js for push notification handling)
    swRegistrationPromise = navigator.serviceWorker.ready
  } catch (error) {
    console.error('Failed to initialize messaging:', error)
  }
}

export { functions, messaging, swRegistrationPromise }


