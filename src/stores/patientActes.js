import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'almakare.patientActes.items'

const HOSPITALIZATION_STEPS = [
  {
    title: 'Ordonnance du médecin adresseur',
    desc: "Un médecin adresseur complète vos données et émet une ordonnance, transmise directement à un médecin spécialiste du sommeil.",
    illustration: 'doctors-orders.svg',
    dayOffset: -18,
    duration: '~ 30 min',
  },
  {
    title: "Génération de l'acte",
    desc: "Le médecin spécialiste prend connaissance de votre dossier et génère l'acte médical correspondant à votre examen.",
    illustration: 'doctor.svg',
    dayOffset: -14,
    duration: '~ 15 min',
  },
  {
    title: 'Planification',
    desc: "Le coordonnateur planifie l'acte dans l'agenda des hospitalisations et vous propose une date.",
    illustration: 'tasks.svg',
    dayOffset: -10,
    duration: '~ 10 min',
  },
  {
    title: 'Pose des capteurs',
    desc: "Le jour de l'hospitalisation, le technicien vous accueille et pose les capteurs sur votre corps pour la nuit d'enregistrement.",
    illustration: 'technician.svg',
    dayOffset: -5,
    duration: '~ 45 min',
  },
  {
    title: 'Remontée des données',
    desc: "Au matin, ce même technicien retire les capteurs et remonte les données brutes enregistrées pendant la nuit.",
    illustration: 'details.svg',
    dayOffset: -4,
    duration: '~ 30 min',
  },
  {
    title: 'Rapport technique',
    desc: "Un technicien de prélecture prend le relais. Il analyse les données et produit un rapport technique détaillé.",
    illustration: 'report.svg',
    dayOffset: -2,
    duration: '~ 2 h',
  },
  {
    title: 'Interprétation médicale',
    desc: "Le médecin spécialiste interprète le rapport et pose le diagnostic à partir des résultats de l'acte.",
    illustration: 'doctors.svg',
    dayOffset: 0,
    duration: '~ 30 min',
  },
  {
    title: 'Résultats transmis',
    desc: "Les résultats sont envoyés à votre médecin adresseur et à vous-même. Vous pouvez alors discuter du traitement.",
    illustration: 'congratulations.svg',
    dayOffset: null,
    duration: '~ 15 min',
  },
]

const SEED = [
  {
    id: 'pa-seed-hospitalization-001',
    patientId: '123456',
    type: 'hospitalization',
    acteRef: 'acte-polysomno',
    label: 'Hospitalisation pour évaluation du sommeil',
    description:
      "Parcours complet d'évaluation pour suspicion d'apnée du sommeil : ordonnance, planification, enregistrement nocturne au centre, analyse et interprétation des résultats.",
    status: 'in-progress',
    doctorId: 'tm-seed-001',
    startedAt: '2026-05-03',
    currentStep: 4,
    steps: HOSPITALIZATION_STEPS,
    locationId: 'etablissement-paris',
    locationName: 'Centre du sommeil — Paris',
    locationAddress: "15 boulevard de l'Hôpital, 75013 Paris",
    price: 420,
    illustration: 'technician.svg',
    paymentStatus: 'pending',
  },
  {
    id: 'pa-seed-hospitalization-002',
    patientId: '123456',
    type: 'hospitalization',
    acteRef: 'acte-polysomno',
    label: 'Hospitalisation pour évaluation du sommeil',
    description:
      "Premier parcours d'évaluation pour suspicion d'apnée du sommeil, finalisé en mars 2026 : enregistrement nocturne, analyse technique et interprétation médicale transmise au médecin adresseur.",
    status: 'completed',
    doctorId: 'tm-seed-002',
    startedAt: '2026-02-15',
    completedAt: '2026-03-15',
    currentStep: HOSPITALIZATION_STEPS.length,
    steps: HOSPITALIZATION_STEPS,
    locationId: 'etablissement-paris',
    locationName: 'Centre du sommeil — Paris',
    locationAddress: "15 boulevard de l'Hôpital, 75013 Paris",
    price: 420,
    illustration: 'congratulations.svg',
    paymentStatus: 'paid',
  },
]

function loadActes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return JSON.parse(JSON.stringify(SEED))
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return JSON.parse(JSON.stringify(SEED))
    return parsed
  } catch {
    return JSON.parse(JSON.stringify(SEED))
  }
}

export const usePatientActesStore = defineStore('patientActes', () => {
  const items = ref(loadActes())

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore
      }
    },
    { deep: true },
  )

  function actesForPatient(patientId) {
    return items.value.filter((a) => a.patientId === patientId)
  }

  function ongoingActesForPatient(patientId) {
    return actesForPatient(patientId).filter((a) => a.status === 'in-progress')
  }

  function pastActesForPatient(patientId) {
    return actesForPatient(patientId).filter((a) => a.status === 'completed')
  }

  function getActe(id) {
    return items.value.find((a) => a.id === id) || null
  }

  function setCurrentStep(acteId, step) {
    const idx = items.value.findIndex((a) => a.id === acteId)
    if (idx === -1) return
    const acte = items.value[idx]
    const total = acte.steps?.length || 1
    const clamped = Math.max(1, Math.min(total, step))
    items.value[idx] = { ...acte, currentStep: clamped }
  }

  return {
    items,
    actesForPatient,
    ongoingActesForPatient,
    pastActesForPatient,
    getActe,
    setCurrentStep,
  }
})
