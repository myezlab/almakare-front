import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'almakare.self'
const PICTURE_KEYS = ['avatarUrl']
const DEFAULT_AVATAR_URL = 'https://randomuser.me/api/portraits/men/61.jpg'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function stripPictures(obj) {
  const out = { ...obj }
  for (const k of PICTURE_KEYS) delete out[k]
  return out
}

export const useSelfStore = defineStore('self', () => {

  const stored = loadFromStorage()
  const item = ref({ avatarUrl: DEFAULT_AVATAR_URL, ...(stored || { id: '123456' }) })

  watch(
    item,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripPictures(val)))
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
