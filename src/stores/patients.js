import patientsSeed from '@/data/patients.json'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'almakare.patients'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return patientsSeed.map((p) => ({ ...p }))
    return JSON.parse(raw)
  } catch {
    return patientsSeed.map((p) => ({ ...p }))
  }
}

export const usePatientsStore = defineStore('patients', () => {
  const items = ref(loadFromStorage())

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore quota / serialization errors in MVP
      }
    },
    { deep: true },
  )

  function startHospitalization(id) {
    const idx = items.value.findIndex((p) => p.id === id)
    if (idx === -1) return
    if (items.value[idx].hospitalizationStep > 0) return
    items.value[idx] = { ...items.value[idx], hospitalizationStep: 1 }
  }

  return { items, startHospitalization }
})
