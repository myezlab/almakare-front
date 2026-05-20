import { TEAM_SEED } from '@/data/team'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.team'

function seedById() {
  const map = {}
  for (const m of TEAM_SEED) map[m.id] = m
  return map
}

function hydrateFromSeed(items) {
  const byId = seedById()
  return items.map((m) => {
    const seed = byId[m.id]
    if (!seed) return m
    return {
      ...m,
      specialty: m.specialty ?? seed.specialty,
      description: m.description ?? seed.description,
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
