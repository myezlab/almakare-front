import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SLOTS_STORAGE_KEY = 'almakare.appointments.slots'
const APPOINTMENTS_STORAGE_KEY = 'almakare.appointments.items'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(baseISO, days) {
  const d = new Date(baseISO)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const DEFAULT_DOCTOR_SLOTS = [
  { doctorId: 'tm-seed-001', date: addDaysISO(todayISO(), 1), startTime: '09:00', endTime: '09:30' },
  { doctorId: 'tm-seed-001', date: addDaysISO(todayISO(), 1), startTime: '09:30', endTime: '10:00' },
  { doctorId: 'tm-seed-001', date: addDaysISO(todayISO(), 1), startTime: '10:00', endTime: '10:30' },
  { doctorId: 'tm-seed-001', date: addDaysISO(todayISO(), 2), startTime: '14:00', endTime: '14:30' },
  { doctorId: 'tm-seed-001', date: addDaysISO(todayISO(), 2), startTime: '14:30', endTime: '15:00' },
  { doctorId: 'tm-seed-002', date: addDaysISO(todayISO(), 1), startTime: '11:00', endTime: '11:30' },
  { doctorId: 'tm-seed-002', date: addDaysISO(todayISO(), 3), startTime: '15:00', endTime: '15:30' },
  { doctorId: 'tm-seed-002', date: addDaysISO(todayISO(), 3), startTime: '15:30', endTime: '16:00' },
  { doctorId: 'tm-seed-009', date: addDaysISO(todayISO(), 4), startTime: '10:00', endTime: '10:30' },
]

function buildSeedSlots() {
  return DEFAULT_DOCTOR_SLOTS.map((s, i) => ({
    id: `slot-seed-${i + 1}`,
    ...s,
  }))
}

function loadSlots() {
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY)
    if (raw === null) return buildSeedSlots()
    return JSON.parse(raw)
  } catch {
    return buildSeedSlots()
  }
}

function loadAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (raw === null) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const useAppointmentsStore = defineStore('appointments', () => {
  const slots = ref(loadSlots())
  const items = ref(loadAppointments())

  watch(
    slots,
    (val) => {
      try {
        localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore MVP storage errors
      }
    },
    { deep: true },
  )

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(val))
      } catch {
        // ignore MVP storage errors
      }
    },
    { deep: true },
  )

  function addSlot({ doctorId, date, startTime, endTime }) {
    const slot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      doctorId,
      date,
      startTime,
      endTime,
    }
    slots.value = [...slots.value, slot]
    return slot
  }

  function removeSlot(slotId) {
    slots.value = slots.value.filter((s) => s.id !== slotId)
    items.value = items.value.filter((a) => a.slotId !== slotId)
  }

  function isSlotBooked(slotId) {
    return items.value.some((a) => a.slotId === slotId && a.status !== 'cancelled')
  }

  function getAppointmentForSlot(slotId) {
    return items.value.find((a) => a.slotId === slotId && a.status !== 'cancelled') || null
  }

  function bookSlot({ slotId, doctorId, patientId, patientFullName, notes = '' }) {
    if (isSlotBooked(slotId)) return null
    const appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slotId,
      doctorId,
      patientId,
      patientFullName,
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }
    items.value = [...items.value, appointment]
    return appointment
  }

  function createAppointment({ doctorId, patientId, patientFullName, date, startTime, endTime, notes = '' }) {
    const slot = addSlot({ doctorId, date, startTime, endTime })
    return bookSlot({ slotId: slot.id, doctorId, patientId, patientFullName, notes })
  }

  function cancelAppointment(appointmentId) {
    const idx = items.value.findIndex((a) => a.id === appointmentId)
    if (idx === -1) return
    items.value[idx] = { ...items.value[idx], status: 'cancelled' }
  }

  function slotsForDoctor(doctorId) {
    return slots.value.filter((s) => s.doctorId === doctorId)
  }

  function appointmentsForDoctor(doctorId) {
    return items.value.filter((a) => a.doctorId === doctorId && a.status !== 'cancelled')
  }

  function appointmentsForPatient(patientId) {
    return items.value.filter((a) => a.patientId === patientId && a.status !== 'cancelled')
  }

  return {
    slots,
    items,
    addSlot,
    removeSlot,
    isSlotBooked,
    getAppointmentForSlot,
    bookSlot,
    createAppointment,
    cancelAppointment,
    slotsForDoctor,
    appointmentsForDoctor,
    appointmentsForPatient,
  }
})
