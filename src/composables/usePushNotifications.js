import { messaging, swRegistrationPromise } from '@/firebase'
import { useMessagesStore } from '@/stores/messages'
import { getAuth } from 'firebase/auth'
import { arrayRemove, arrayUnion, doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { ref } from 'vue'

const VAPID_KEY = 'BHZe-pArcUYIWik9NzFDoEePA0kp8Bpogy_iBiUIJKWrshk2gv4UjlVjVBymCb-MsQRYU4DAR7LZd7PQOU2Bh1k'

const db = getFirestore()
const auth = getAuth()

// Register foreground message listener once at module level to avoid duplicates
let onMessageRegistered = false
export function registerOnMessage(messagesStore) {
  if (onMessageRegistered || !messaging) return
  onMessageRegistered = true
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload)
    const body = payload.notification?.body || payload.data?.body
    const type = payload.data?.type
    messagesStore.add({ type, text: body || 'New message!', to: '/notifications' })
  })
}

export function usePushNotifications() {
  const isSupported = ref('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)
  const permission = ref(Notification.permission)
  const isSubscribed = ref(false)
  const loading = ref(false)

  const messagesStore = useMessagesStore()

  // Request permission and get FCM token
  async function requestPermission() {
    if (!isSupported.value) {
      messagesStore.add({ type: 'error', text: 'Push notifications are not supported in your browser' })
      return null
    }

    if (!messaging) {
      messagesStore.add({ type: 'error', text: 'Firebase messaging is not initialized.' })
      return null
    }

    try {
      const result = await Notification.requestPermission()
      permission.value = result

      if (result === 'granted') {
        const serviceWorkerRegistration = await swRegistrationPromise
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration
        })
        return token
      } else {
        messagesStore.add({ type: 'warning', text: 'Notification permission denied' })
        return null
      }
    } catch (error) {
      console.error('Error getting notification permission:', error)
      messagesStore.add({ type: 'error', text: 'Failed to get notification permission: ' + error.message })
      return null
    }
  }

  // Subscribe: save the FCM token to the user's fcmTokens array
  async function subscribe() {
    loading.value = true
    try {
      const token = await requestPermission()
      if (!token) { loading.value = false; return false }

      const userId = auth.currentUser?.uid
      if (!userId) {
        messagesStore.add({ type: 'error', text: 'You must be signed in' })
        loading.value = false
        return false
      }

      await updateDoc(doc(db, `users/${userId}`), {
        fcmTokens: arrayUnion(token)
      })

      isSubscribed.value = true
      messagesStore.add({ type: 'success', text: 'Push notifications enabled' })
      return true
    } catch (error) {
      console.error('Error subscribing:', error)
      messagesStore.add({ type: 'error', text: 'Failed to enable notifications: ' + (error.message || error.code) })
      return false
    } finally {
      loading.value = false
    }
  }

  // Unsubscribe: remove the current FCM token from the array
  async function unsubscribe() {
    loading.value = true
    try {
      if (!messaging) {
        messagesStore.add({ type: 'error', text: 'Firebase messaging is not initialized.' })
        loading.value = false
        return false
      }

      const userId = auth.currentUser?.uid
      if (!userId) {
        messagesStore.add({ type: 'error', text: 'You must be signed in' })
        loading.value = false
        return false
      }

      const serviceWorkerRegistration = await swRegistrationPromise
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration
      })

      if (token) {
        await updateDoc(doc(db, `users/${userId}`), {
          fcmTokens: arrayRemove(token)
        })
      }

      isSubscribed.value = false
      messagesStore.add({ type: 'success', text: 'Push notifications disabled' })
      return true
    } catch (error) {
      console.error('Error unsubscribing:', error)
      messagesStore.add({ type: 'error', text: 'Failed to disable notifications: ' + (error.message || error.code) })
      return false
    } finally {
      loading.value = false
    }
  }

  // Check if the current device token is in the user's fcmTokens array
  async function checkSubscription() {
    try {
      if (permission.value !== 'granted' || !messaging) {
        isSubscribed.value = false
        return false
      }

      const userId = auth.currentUser?.uid
      if (!userId) { isSubscribed.value = false; return false }

      const serviceWorkerRegistration = await swRegistrationPromise
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration
      })

      if (!token) { isSubscribed.value = false; return false }

      const userDoc = await getDoc(doc(db, `users/${userId}`))
      const data = userDoc.data()
      const tokens = data?.fcmTokens || []

      isSubscribed.value = tokens.includes(token)
      return isSubscribed.value
    } catch (error) {
      console.error('Error checking subscription:', error)
      isSubscribed.value = false
      return false
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription
  }
}
