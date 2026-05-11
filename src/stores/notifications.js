import { functions } from "@/firebase"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, Timestamp } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { defineStore } from 'pinia'
import { ref } from "vue"

const db = getFirestore()
const PAGE_SIZE = 20
const callDeleteNotificationReads = httpsCallable(functions, "notifications-deleteNotificationReads")

export const useNotificationsStore = defineStore('notifications', () => {

  const list = ref([])
  const lastDoc = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)
  const selfStore = useSelfStore()
  const messagesStore = useMessagesStore()

  async function fetchNotifications() {
    if (loading.value || !hasMore.value) return
    loading.value = true

    try {
      let q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      )

      if (lastDoc.value) {
        q = query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc.value),
          limit(PAGE_SIZE)
        )
      }

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        hasMore.value = false
        return
      }

      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      await Promise.all(docs.map(async (notification) => {
        const readDoc = await getDoc(doc(db, 'notifications', notification.id, 'reads', selfStore.item.id))
        notification.read = readDoc.exists()
      }))

      list.value.push(...docs)
      lastDoc.value = snapshot.docs[snapshot.docs.length - 1]

      if (snapshot.docs.length < PAGE_SIZE) {
        hasMore.value = false
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      messagesStore.add({ type: 'error', text: error.message || 'Failed to fetch notifications' })
    } finally {
      loading.value = false
    }
  }

  function reset() {
    list.value = []
    lastDoc.value = null
    hasMore.value = true
    loading.value = false
  }

  async function addNotification(data) {
    const payload = { createdAt: Timestamp.now(), ...data }
    const docRef = await addDoc(collection(db, 'notifications'), payload)
    if (data.projectId) {
      await setDoc(doc(db, `projects/${data.projectId}/notifications/${docRef.id}`), payload)
    }
  }

  async function setNotification(id, data) {
    callDeleteNotificationReads({ notificationId: id, ...(data.projectId ? { projectId: data.projectId } : {}) })
    const payload = { createdAt: Timestamp.now(), ...data }
    await setDoc(doc(db, `notifications/${id}`), payload)
    if (data.projectId) {
      await setDoc(doc(db, `projects/${data.projectId}/notifications/${id}`), payload)
    }
  }

  return { list, loading, hasMore, fetchNotifications, reset, addNotification, setNotification }
})
