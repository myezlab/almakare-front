import { TEAM_SEED } from '@/data/team'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.team'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return TEAM_SEED.map((m) => ({ ...m, permissions: [...m.permissions] }))
    return JSON.parse(raw)
  } catch {
    return TEAM_SEED.map((m) => ({ ...m, permissions: [...m.permissions] }))
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

  function add(member) {
    items.value.push({
      id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...member,
    })
  }

  function update(id, patch) {
    const idx = items.value.findIndex((m) => m.id === id)
    if (idx === -1) return
    items.value[idx] = { ...items.value[idx], ...patch }
  }

  function remove(id) {
    items.value = items.value.filter((m) => m.id !== id)
  }

  return { items, add, update, remove }
})
