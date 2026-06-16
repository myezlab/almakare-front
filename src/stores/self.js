import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { FAKE_CLINICAL_DATA } from '@/data/clinicalData'

const STORAGE_KEY = 'almakare.self'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Fill the demo clinical readings whenever the field is missing OR empty, so the
// "Données cliniques" panel always has content even if a stale persisted item
// carries blank clinical fields. Real (non-empty) edits always take precedence.
function withClinicalDefaults(base) {
  const result = { ...base }
  for (const [key, value] of Object.entries(FAKE_CLINICAL_DATA)) {
    if (result[key] == null || result[key] === '') result[key] = value
  }
  return result
}

export const useSelfStore = defineStore('self', () => {

  const stored = loadFromStorage()
  const item = ref(withClinicalDefaults(stored || { id: '123456' }))

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

  // Clear the signed-in user but keep the demo clinical readings, so the
  // "Données cliniques" panel still has content after sign-out / sign-up again.
  function reset() {
    item.value = withClinicalDefaults({})
  }

  return { item, getItem, init, reset }
})
