import { WEEKDAY_KEYS } from '@/data/team'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const APPOINTMENTS_STORAGE_KEY = 'almakare.appointments.items'

function loadAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    return parsed.filter((a) => a && a.date && a.startTime && a.endTime)
  } catch {
    return []
  }
}

function parseHM(hm) {
  const [h, m] = hm.split(':').map((n) => parseInt(n, 10))
  return h * 60 + m
}

function formatHM(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function weekdayKey(date) {
  return WEEKDAY_KEYS[(date.getDay() + 6) % 7]
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayISO() {
  return toISODate(new Date())
}

export const useAppointmentsStore = defineStore('appointments', () => {
  const items = ref(loadAppointments())

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

  function appointmentsForDoctor(doctorId) {
    return items.value.filter((a) => a.doctorId === doctorId && a.status !== 'cancelled')
  }

  function appointmentsForPatient(patientId) {
    return items.value.filter((a) => a.patientId === patientId && a.status !== 'cancelled')
  }

  function hasPriorAppointmentWithDoctor(patientId, doctorId) {
    return items.value.some(
      (a) => a.patientId === patientId && a.doctorId === doctorId && a.status !== 'cancelled',
    )
  }

  // ---- Availability computation ----
  // Generate all candidate slots for one doctor / date / duration based on workingHours,
  // then exclude windows that overlap booked appointments.

  function availableSlots({ doctor, date, durationMinutes, locationId = null, granularityMinutes = 15 }) {
    if (!doctor || !Array.isArray(doctor.locations) || !durationMinutes) return []
    const iso = toISODate(date)
    if (iso < todayISO()) return []
    const key = weekdayKey(date)

    const locations = locationId
      ? doctor.locations.filter((l) => l.id === locationId)
      : doctor.locations

    const booked = appointmentsForDoctor(doctor.id)
      .filter((a) => a.date === iso)
      .map((a) => ({ start: parseHM(a.startTime), end: parseHM(a.endTime) }))

    const nowMins = iso === todayISO()
      ? (() => {
        const now = new Date()
        return now.getHours() * 60 + now.getMinutes()
      })()
      : -1

    const slots = []
    for (const loc of locations) {
      const ranges = (loc.workingHours && loc.workingHours[key]) || []
      for (const r of ranges) {
        const rStart = parseHM(r.start)
        const rEnd = parseHM(r.end)
        for (let t = rStart; t + durationMinutes <= rEnd; t += granularityMinutes) {
          const slotStart = t
          const slotEnd = t + durationMinutes
          if (slotStart < nowMins) continue
          const conflict = booked.some(
            (b) => slotStart < b.end && slotEnd > b.start,
          )
          if (conflict) continue
          slots.push({
            startTime: formatHM(slotStart),
            endTime: formatHM(slotEnd),
            locationId: loc.id,
            locationName: loc.name,
            locationShortLabel: loc.shortLabel || loc.name,
            locationAddress: loc.address || '',
          })
        }
      }
    }
    slots.sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
      return a.locationId.localeCompare(b.locationId)
    })
    return slots
  }

  function bookAppointment({
    doctorId,
    acteId,
    patientId,
    patientFullName,
    date,
    startTime,
    endTime,
    locationId = null,
    locationName = '',
    locationAddress = '',
    notes = '',
  }) {
    // Final-collision check
    const startMin = parseHM(startTime)
    const endMin = parseHM(endTime)
    const conflict = appointmentsForDoctor(doctorId).some((a) => {
      if (a.date !== date) return false
      const s = parseHM(a.startTime)
      const e = parseHM(a.endTime)
      return startMin < e && endMin > s
    })
    if (conflict) return null
    const appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      doctorId,
      acteId: acteId || null,
      patientId,
      patientFullName,
      date,
      startTime,
      endTime,
      locationId: locationId || null,
      locationName: locationName || '',
      locationAddress: locationAddress || '',
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }
    items.value = [...items.value, appointment]
    return appointment
  }

  function cancelAppointment(appointmentId) {
    const idx = items.value.findIndex((a) => a.id === appointmentId)
    if (idx === -1) return
    items.value[idx] = { ...items.value[idx], status: 'cancelled' }
  }

  return {
    items,
    appointmentsForDoctor,
    appointmentsForPatient,
    hasPriorAppointmentWithDoctor,
    availableSlots,
    bookAppointment,
    cancelAppointment,
  }
})
