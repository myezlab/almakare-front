import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.logs'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const useLogsStore = defineStore('logs', () => {
  const byCollection = ref(loadFromStorage())

  watch(
    byCollection,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore quota / serialization errors in MVP
      }
    },
    { deep: true },
  )

  function getLogs(collectionName) {
    return byCollection.value[collectionName] || []
  }

  function add(collectionName, log) {
    if (!byCollection.value[collectionName]) byCollection.value[collectionName] = []
    byCollection.value[collectionName].unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      type: 'info',
      ...log,
    })
  }

  function clear(collectionName) {
    byCollection.value[collectionName] = []
  }

  return { byCollection, getLogs, add, clear }
})
