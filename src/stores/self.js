import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'almakare.self'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useSelfStore = defineStore('self', () => {

  const stored = loadFromStorage()
  const item = ref(stored || { id: '123456' })

  watch(
    item,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore quota / serialization errors in MVP
      }
    },
    { deep: true },
  )

  async function init() {

  }

  async function getItem(selfId) {

  }

  return { item, getItem, init }
})
