import { ORGANISATION_SEED } from '@/data/organisation'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.organisation'

function migrateDevices(state) {
  const seedDevicesByEstablishmentId = Object.fromEntries(
    (ORGANISATION_SEED.establishments || []).map((e) => [e.id, e.devices || []]),
  )
  const establishments = (state.establishments || []).map((e) => {
    if (Array.isArray(e.devices)) return e
    const seeded = seedDevicesByEstablishmentId[e.id]
    return {
      ...e,
      devices: seeded ? JSON.parse(JSON.stringify(seeded)) : [],
    }
  })
  return { ...state, establishments }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { ...ORGANISATION_SEED, selectedServiceIds: [...ORGANISATION_SEED.selectedServiceIds] }
    }
    return migrateDevices(JSON.parse(raw))
  } catch {
    return { ...ORGANISATION_SEED, selectedServiceIds: [...ORGANISATION_SEED.selectedServiceIds] }
  }
}

export const useOrganisationStore = defineStore('organisation', () => {
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

  function getEstablishments() {
    return item.value.establishments || []
  }

  function findEstablishment(id) {
    return getEstablishments().find((e) => e.id === id) || null
  }

  function addEstablishment(payload) {
    const id = `etablissement-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const establishment = {
      id,
      name: payload.name || '',
      location: payload.location || '',
      logoUrl: payload.logoUrl || '',
      devices: [],
    }
    item.value = {
      ...item.value,
      establishments: [...getEstablishments(), establishment],
    }
    return establishment
  }

  function updateEstablishment(id, patch) {
    item.value = {
      ...item.value,
      establishments: getEstablishments().map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    }
  }

  function removeEstablishment(id) {
    item.value = {
      ...item.value,
      establishments: getEstablishments().filter((e) => e.id !== id),
    }
  }

  function addDevice(establishmentId, payload) {
    const id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const device = {
      id,
      name: payload.name || '',
      acquiredAt: payload.acquiredAt || '',
      bookings: [],
    }
    item.value = {
      ...item.value,
      establishments: getEstablishments().map((e) =>
        e.id === establishmentId
          ? { ...e, devices: [...(e.devices || []), device] }
          : e,
      ),
    }
    return device
  }

  function removeDevice(establishmentId, deviceId) {
    item.value = {
      ...item.value,
      establishments: getEstablishments().map((e) =>
        e.id === establishmentId
          ? { ...e, devices: (e.devices || []).filter((d) => d.id !== deviceId) }
          : e,
      ),
    }
  }

  return {
    item,
    update,
    findEstablishment,
    addEstablishment,
    updateEstablishment,
    removeEstablishment,
    addDevice,
    removeDevice,
  }
})
