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

  function add(patient) {
    const id = `p-${Date.now().toString(36)}`
    const newPatient = {
      id,
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      email: '',
      phoneNumber: '',
      socialSecurityNumber: '',
      dietaryRestrictions: '',
      medicalHistory: '',
      currentTreatments: '',
      weight: null,
      height: null,
      iah: null,
      agreementPersonal: false,
      epworthScore: null,
      lastVisit: new Date().toISOString().slice(0, 10),
      hospitalizationStep: 0,
      invitationStatus: 'pending',
      invitedAt: new Date().toISOString(),
      ...patient,
    }
    items.value = [newPatient, ...items.value]
    return newPatient
  }

  return { items, startHospitalization, add }
})
