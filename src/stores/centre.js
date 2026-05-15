import { CENTRE_SOMMEIL_SEED } from '@/data/centre-sommeil'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.centre'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { ...CENTRE_SOMMEIL_SEED, selectedServiceIds: [...CENTRE_SOMMEIL_SEED.selectedServiceIds] }
    }
    return JSON.parse(raw)
  } catch {
    return { ...CENTRE_SOMMEIL_SEED, selectedServiceIds: [...CENTRE_SOMMEIL_SEED.selectedServiceIds] }
  }
}

export const useCentreStore = defineStore('centre', () => {
  const item = ref(loadFromStorage())

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

  function update(patch) {
    item.value = { ...item.value, ...patch }
  }

  return { item, update }
})
