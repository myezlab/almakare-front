import { ORGANISATION_SEED } from '@/data/organisation'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'myezlab.organisation'

function migrateDevices(state) {
  const seedEstablishmentsById = Object.fromEntries(
    (ORGANISATION_SEED.establishments || []).map((e) => [e.id, e]),
  )
  const seedEstablishmentIds = new Set(Object.keys(seedEstablishmentsById))
  const existingIds = new Set((state.establishments || []).map((e) => e.id))
  const establishments = (state.establishments || []).map((e) => {
    const seed = seedEstablishmentsById[e.id]
    return {
      ...e,
      description: e.description ?? seed?.description ?? '',
      devices: Array.isArray(e.devices)
        ? e.devices
        : seed?.devices
          ? JSON.parse(JSON.stringify(seed.devices))
          : [],
    }
  })
  for (const id of seedEstablishmentIds) {
    if (!existingIds.has(id)) {
      establishments.push(JSON.parse(JSON.stringify(seedEstablishmentsById[id])))
    }
  }

  const seedActesById = Object.fromEntries(
    (ORGANISATION_SEED.actes || []).map((a) => [a.id, a]),
  )
  const seedActeIds = new Set(Object.keys(seedActesById))
  const existingActes = Array.isArray(state.actes) ? state.actes : []
  const existingActeIds = new Set(existingActes.map((a) => a.id))
  const actes = existingActes.length === 0
    ? JSON.parse(JSON.stringify(ORGANISATION_SEED.actes || []))
    : existingActes.map((a) => {
      const seed = seedActesById[a.id]
      return {
        ...a,
        description: a.description ?? seed?.description ?? '',
        isFirstVisit: a.isFirstVisit ?? seed?.isFirstVisit ?? false,
      }
    })
  if (existingActes.length > 0) {
    for (const id of seedActeIds) {
      if (!existingActeIds.has(id)) {
        actes.push(JSON.parse(JSON.stringify(seedActesById[id])))
      }
    }
  }

  return { ...state, establishments, actes }
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

  function getActes() {
    return item.value.actes || []
  }

  function findActe(id) {
    return getActes().find((a) => a.id === id) || null
  }

  function addActe(payload) {
    const id = `acte-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const acte = {
      id,
      label: payload.label || '',
      internalCode: payload.internalCode || '',
      externalCode: payload.externalCode || '',
      visibleOnOnlineAgenda: !!payload.visibleOnOnlineAgenda,
      sendPlanningEmail: !!payload.sendPlanningEmail,
      price: Number(payload.price) || 0,
      agendaColor: payload.agendaColor || '#1976D2',
      billingType: payload.billingType || 'hourly',
      billableByDoctor: !!payload.billableByDoctor,
      machineTypes: Array.isArray(payload.machineTypes) ? [...payload.machineTypes] : [],
      billAssociatedGhs: !!payload.billAssociatedGhs,
      linkedActeId: payload.linkedActeId || '',
      concurrentAppointments: Number(payload.concurrentAppointments) || 1,
      averageDurationMinutes: Number(payload.averageDurationMinutes) || 0,
      visible: payload.visible !== undefined ? !!payload.visible : true,
      order: Number(payload.order) || getActes().length + 1,
      specificDirectory: payload.specificDirectory || '',
    }
    item.value = {
      ...item.value,
      actes: [...getActes(), acte],
    }
    return acte
  }

  function updateActe(id, patch) {
    item.value = {
      ...item.value,
      actes: getActes().map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }
  }

  function removeActe(id) {
    item.value = {
      ...item.value,
      actes: getActes().filter((a) => a.id !== id),
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
    findActe,
    addActe,
    updateActe,
    removeActe,
  }
})
