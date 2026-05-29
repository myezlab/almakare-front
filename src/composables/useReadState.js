import { ref } from "vue"

const NOTIF_KEY = "readNotificationIds"

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function persist(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // ignore quota / privacy mode errors
  }
}

const readNotificationIds = ref(loadSet(NOTIF_KEY))

function markNotificationRead(id) {
  if (!id || readNotificationIds.value.has(id)) return
  const next = new Set(readNotificationIds.value)
  next.add(id)
  readNotificationIds.value = next
  persist(NOTIF_KEY, next)
}

function isNotificationRead(notification) {
  return !!notification.read || readNotificationIds.value.has(notification.id)
}

export function useReadState() {
  return {
    readNotificationIds,
    markNotificationRead,
    isNotificationRead,
  }
}
