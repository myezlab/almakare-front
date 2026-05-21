import { TEAM_SEED } from '@/data/team'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'almakare.team'

function seedById() {
  const map = {}
  for (const m of TEAM_SEED) map[m.id] = m
  return map
}

function migrateLocations(m, seed) {
  if (Array.isArray(m.locations) && m.locations.length > 0) return m.locations
  if (seed?.locations) return JSON.parse(JSON.stringify(seed.locations))
  if (m.cabinetAddress || m.workingHours) {
    return [{
      id: `loc-${m.id}-default`,
      name: m.cabinetName || 'Cabinet',
      shortLabel: 'Cabinet',
      address: m.cabinetAddress || '',
      workingHours: m.workingHours || {},
    }]
  }
  return []
}

function hydrateFromSeed(items) {
  const byId = seedById()
  return items.map((m) => {
    const seed = byId[m.id]
    if (!seed) return { ...m, locations: migrateLocations(m, null) }
    return {
      ...m,
      specialty: m.specialty ?? seed.specialty,
      description: m.description ?? seed.description,
      establishmentIds: m.establishmentIds ?? seed.establishmentIds,
      acteIds: m.acteIds ?? seed.acteIds,
      locations: migrateLocations(m, seed),
    }
  })
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return TEAM_SEED.map((m) => ({ ...m }))
    return hydrateFromSeed(JSON.parse(raw))
  } catch {
    return TEAM_SEED.map((m) => ({ ...m }))
  }
}

export const useTeamStore = defineStore('team', () => {
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

  return { items }
})
