import { CABINET_MEDICAL_SEED } from '@/data/centre-sommeil'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.cabinet'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { ...CABINET_MEDICAL_SEED, selectedServiceIds: [...CABINET_MEDICAL_SEED.selectedServiceIds] }
    }
    return JSON.parse(raw)
  } catch {
    return { ...CABINET_MEDICAL_SEED, selectedServiceIds: [...CABINET_MEDICAL_SEED.selectedServiceIds] }
  }
}

export const useCabinetStore = defineStore('cabinet', () => {
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
