<script setup>
import { useAppointmentsStore } from '@/stores/appointments'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { useSelfStore } from '@/stores/self'
import { useTeamStore } from '@/stores/team'
import {
  mdiAlertOutline,
  mdiApple,
  mdiArrowLeft,
  mdiCalendarCheckOutline,
  mdiCalendarClockOutline,
  mdiCalendarPlusOutline,
  mdiHistory,
  mdiCashMultiple,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClockOutline,
  mdiClose,
  mdiCloseCircleOutline,
  mdiCrosshairsGps,
  mdiDoctor,
  mdiDotsVertical,
  mdiGoogle,
  mdiHospitalBuilding,
  mdiInformationOutline,
  mdiLockOutline,
  mdiMagnify,
  mdiMapMarkerOutline,
  mdiMicrosoftOutlook,
  mdiNotebookOutline,
  mdiTimerSandComplete,
} from '@mdi/js'
import { computed, ref } from 'vue'

const teamStore = useTeamStore()
const appointmentsStore = useAppointmentsStore()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const organisationStore = useOrganisationStore()

const establishments = computed(() => organisationStore.item.establishments || [])
const actes = computed(() => organisationStore.item.actes || [])

const allDoctors = computed(() =>
  teamStore.items.filter((m) => {
    const roles = Array.isArray(m.roles) && m.roles.length > 0 ? m.roles : (m.role ? [m.role] : [])
    return roles.includes('doctor') && m.invitationStatus === 'accepted'
  }),
)

function establishmentFor(id) {
  if (!id) return null
  return establishments.value.find((e) => e.id === id) || null
}

function acteFor(id) {
  if (!id) return null
  return actes.value.find((a) => a.id === id) || null
}

function doctorEstablishments(doctor) {
  return (doctor?.establishmentIds || [])
    .map((id) => establishmentFor(id))
    .filter(Boolean)
}

// =================== STEP MACHINE ===================
// 'search'   → search + cards (centres + doctors)
// 'centre'   → list of doctors for the selected centre
// 'acte'     → choose consultation/acte (filtered by first-visit history)
// 'calendar' → pick a time slot for chosen acte

const step = ref('search')
const selectedCentre = ref(null)
const selectedDoctor = ref(null)
const selectedActe = ref(null)
const acteInfoOpen = ref(false)
const acteInfoTarget = ref(null)
const searchQuery = ref('')

function pickCentre(centre) {
  selectedCentre.value = centre
  step.value = 'centre'
}

function pickDoctor(doctor) {
  selectedDoctor.value = doctor
  step.value = 'acte'
}

function showActeInfo(acte) {
  acteInfoTarget.value = acte
  acteInfoOpen.value = true
}

function chooseActe(acte) {
  selectedActe.value = acte
  acteInfoOpen.value = false
  acteInfoTarget.value = null
  selectedLocationId.value = null
  step.value = 'calendar'
}

function goBack() {
  if (step.value === 'calendar') {
    selectedActe.value = null
    step.value = 'acte'
    return
  }
  if (step.value === 'acte') {
    selectedDoctor.value = null
    step.value = selectedCentre.value ? 'centre' : 'search'
    return
  }
  if (step.value === 'centre') {
    selectedCentre.value = null
    step.value = 'search'
    return
  }
}

function resetFlow() {
  step.value = 'search'
  selectedCentre.value = null
  selectedDoctor.value = null
  selectedActe.value = null
  selectedLocationId.value = null
  searchQuery.value = ''
}

const showBack = computed(() => step.value !== 'search')

const headerTitle = computed(() => {
  switch (step.value) {
    case 'centre': return selectedCentre.value?.name || 'Centre du sommeil'
    case 'acte': return 'Choisir une consultation'
    case 'calendar': return 'Choisir un créneau'
    default: return 'Rendez-vous'
  }
})

const headerSubtitle = computed(() => {
  if (step.value === 'centre') return 'Sélectionnez un médecin du centre'
  if (step.value === 'acte') return selectedDoctor.value
    ? `Dr ${selectedDoctor.value.firstName} ${selectedDoctor.value.lastName}`
    : ''
  if (step.value === 'calendar' && selectedDoctor.value && selectedActe.value) {
    return `Dr ${selectedDoctor.value.firstName} ${selectedDoctor.value.lastName} · ${selectedActe.value.label}`
  }
  return 'Consultez vos rendez-vous ou prenez-en un nouveau'
})

// =================== SEARCH RESULTS ===================
function matchesQuery(text) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  return String(text || '').toLowerCase().includes(q)
}

// =================== GEOLOCATION ===================
const userLocation = ref(null)
const locationLoading = ref(false)
const locationError = ref('')

function distanceKm(a, b) {
  if (!a || !b) return null
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function centreDistance(centre) {
  if (!userLocation.value || !centre?.coordinates) return null
  return distanceKm(userLocation.value, centre.coordinates)
}

function doctorDistance(doctor) {
  if (!userLocation.value) return null
  const distances = (doctor?.locations || [])
    .map((l) => l.coordinates ? distanceKm(userLocation.value, l.coordinates) : null)
    .filter((d) => d != null)
  if (distances.length === 0) return null
  return Math.min(...distances)
}

function formatDistance(km) {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

function requestAroundMe() {
  if (userLocation.value) {
    clearAroundMe()
    return
  }
  if (!navigator.geolocation) {
    locationError.value = 'La géolocalisation n\'est pas disponible sur votre appareil.'
    return
  }
  locationLoading.value = true
  locationError.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locationLoading.value = false
    },
    (err) => {
      locationLoading.value = false
      if (err.code === err.PERMISSION_DENIED) {
        locationError.value = 'Autorisation refusée. Activez la localisation pour voir les résultats à proximité.'
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        locationError.value = 'Position indisponible. Réessayez dans un instant.'
      } else if (err.code === err.TIMEOUT) {
        locationError.value = 'Délai dépassé. Réessayez.'
      } else {
        locationError.value = 'Impossible d\'obtenir votre position.'
      }
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
  )
}

function clearAroundMe() {
  userLocation.value = null
  locationError.value = ''
}

const filteredCentres = computed(() => {
  const list = establishments.value.filter((c) =>
    matchesQuery(`${c.name} ${c.location} ${c.description || ''} ${c.address || ''}`),
  )
  if (!userLocation.value) return list
  return [...list].sort((a, b) => {
    const da = centreDistance(a) ?? Infinity
    const db = centreDistance(b) ?? Infinity
    return da - db
  })
})

const filteredDoctors = computed(() => {
  const list = allDoctors.value.filter((d) =>
    matchesQuery(`${d.firstName} ${d.lastName} ${d.specialty || ''}`),
  )
  if (!userLocation.value) return list
  return [...list].sort((a, b) => {
    const da = doctorDistance(a) ?? Infinity
    const db = doctorDistance(b) ?? Infinity
    return da - db
  })
})

const doctorsOfSelectedCentre = computed(() => {
  if (!selectedCentre.value) return []
  return allDoctors.value.filter((d) =>
    (d.establishmentIds || []).includes(selectedCentre.value.id),
  )
})

// =================== ACTE SELECTION ===================
const patient = computed(() => selfStore.item || {})

const isFirstVisitWithDoctor = computed(() => {
  if (!selectedDoctor.value) return true
  return !appointmentsStore.hasPriorAppointmentWithDoctor(patient.value.id, selectedDoctor.value.id)
})

const proposedActes = computed(() => {
  const doctor = selectedDoctor.value
  if (!doctor) return []
  return (doctor.acteIds || [])
    .map((id) => acteFor(id))
    .filter((a) => a && a.visible !== false)
})

const availableActes = computed(() => {
  const wantFirstVisit = isFirstVisitWithDoctor.value
  return proposedActes.value.filter((a) => Boolean(a.isFirstVisit) === wantFirstVisit)
})

const lockedActes = computed(() => {
  const wantFirstVisit = isFirstVisitWithDoctor.value
  return proposedActes.value.filter((a) => Boolean(a.isFirstVisit) !== wantFirstVisit)
})

const lockedReason = computed(() =>
  isFirstVisitWithDoctor.value
    ? 'Disponible après votre première consultation avec ce médecin'
    : 'Réservée aux patient ayant déjà effectués une première consultation',
)

const isActeInfoLocked = computed(() => {
  if (!acteInfoTarget.value) return false
  return lockedActes.value.some((a) => a.id === acteInfoTarget.value.id)
})

function formatDuration(mins) {
  if (!mins) return ''
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `~${h}h` : `~${h}h${String(m).padStart(2, '0')}`
}

// =================== CALENDAR ===================
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const weekStart = ref(startOfWeek(new Date()))
const todayISO = computed(() => toISODate(new Date()))

const weekDays = computed(() =>
  Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  }),
)

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`
  }
  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()]} – ${last.getDate()} ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`
})

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function goToday() {
  weekStart.value = startOfWeek(new Date())
}

const selectedLocationId = ref(null)

const doctorLocations = computed(() => selectedDoctor.value?.locations || [])

function availableSlotsForDay(date) {
  if (!selectedDoctor.value || !selectedActe.value) return []
  return appointmentsStore.availableSlots({
    doctor: selectedDoctor.value,
    date,
    durationMinutes: selectedActe.value.averageDurationMinutes,
    locationId: selectedLocationId.value,
  })
}

function formatLongDate(date) {
  return `${DAY_LABELS[(date.getDay() === 0 ? 6 : date.getDay() - 1)]} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`
}

// =================== BOOKING CONFIRMATION ===================
const confirmDialog = ref(false)
const confirmSlot = ref(null)
const confirmNotes = ref('')

function openConfirm(slot, day) {
  confirmSlot.value = { ...slot, date: toISODate(day) }
  confirmNotes.value = ''
  confirmDialog.value = true
}

function confirmBooking() {
  if (!confirmSlot.value || !selectedDoctor.value || !selectedActe.value) return
  const p = patient.value
  const fullName = p.fullName
    || `${p.firstName || ''} ${p.lastName || ''}`.trim()
    || p.email
    || 'Patient'
  const booked = appointmentsStore.bookAppointment({
    doctorId: selectedDoctor.value.id,
    acteId: selectedActe.value.id,
    patientId: p.id,
    patientFullName: fullName,
    date: confirmSlot.value.date,
    startTime: confirmSlot.value.startTime,
    endTime: confirmSlot.value.endTime,
    locationId: confirmSlot.value.locationId,
    locationName: confirmSlot.value.locationName,
    locationAddress: confirmSlot.value.locationAddress,
    notes: confirmNotes.value.trim(),
  })
  if (!booked) {
    messagesStore.add({ type: 'error', text: 'Ce créneau n\'est plus disponible' })
    confirmDialog.value = false
    return
  }
  messagesStore.add({ type: 'success', text: 'Rendez-vous confirmé' })
  confirmDialog.value = false
  resetFlow()
}

// =================== ADD TO CALENDAR ===================
function calendarEventFor(a) {
  const doctorName = `Dr ${a.doctor?.firstName ?? ''} ${a.doctor?.lastName ?? ''}`.trim()
  const title = `RDV ${doctorName}${a.acte ? ` — ${a.acte.label}` : ''}`
  const descriptionParts = []
  if (a.acte?.label) descriptionParts.push(a.acte.label)
  if (doctorName) descriptionParts.push(doctorName)
  if (a.notes) descriptionParts.push(`Motif : ${a.notes}`)
  const description = descriptionParts.join('\n')
  const location = [a.locationName, a.locationAddress].filter(Boolean).join(' — ')
  return {
    title,
    description,
    location,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    uid: `appointment-${a.id}@almakare`,
  }
}

function toCalendarStamp(date, time) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function toIsoLocal(date, time) {
  return `${date}T${time}:00`
}

function addToGoogleCalendar(a) {
  const ev = calendarEventFor(a)
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', ev.title)
  url.searchParams.set('dates', `${toCalendarStamp(ev.date, ev.startTime)}/${toCalendarStamp(ev.date, ev.endTime)}`)
  url.searchParams.set('ctz', 'Europe/Paris')
  if (ev.description) url.searchParams.set('details', ev.description)
  if (ev.location) url.searchParams.set('location', ev.location)
  window.open(url.toString(), '_blank', 'noopener')
}

function addToOutlook(a) {
  const ev = calendarEventFor(a)
  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
  url.searchParams.set('path', '/calendar/action/compose')
  url.searchParams.set('rru', 'addevent')
  url.searchParams.set('subject', ev.title)
  url.searchParams.set('startdt', toIsoLocal(ev.date, ev.startTime))
  url.searchParams.set('enddt', toIsoLocal(ev.date, ev.endTime))
  if (ev.description) url.searchParams.set('body', ev.description)
  if (ev.location) url.searchParams.set('location', ev.location)
  window.open(url.toString(), '_blank', 'noopener')
}

function downloadIcs(a) {
  const ev = calendarEventFor(a)
  const escapeIcs = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Almakare//Rendez-vous//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Paris:${toCalendarStamp(ev.date, ev.startTime)}`,
    `DTEND;TZID=Europe/Paris:${toCalendarStamp(ev.date, ev.endTime)}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeIcs(ev.description)}` : null,
    ev.location ? `LOCATION:${escapeIcs(ev.location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rdv-${ev.date}-${ev.startTime.replace(':', '')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// =================== CANCEL ===================
const cancelDialog = ref(false)
const appointmentToCancel = ref(null)

function askCancel(appointment) {
  appointmentToCancel.value = appointment
  cancelDialog.value = true
}

function closeCancel() {
  cancelDialog.value = false
  appointmentToCancel.value = null
}

function confirmCancel() {
  if (!appointmentToCancel.value) return
  appointmentsStore.cancelAppointment(appointmentToCancel.value.id)
  messagesStore.add({ type: 'success', text: 'Rendez-vous annulé' })
  closeCancel()
}

const myAppointments = computed(() => {
  const p = patient.value
  return appointmentsStore
    .appointmentsForPatient(p.id)
    .map((a) => {
      const doctor = teamStore.items.find((m) => m.id === a.doctorId)
      return { ...a, doctor, acte: acteFor(a.acteId) }
    })
})

function appointmentKey(a) {
  return `${a.date} ${a.startTime}`
}

const nowKey = computed(() => {
  const d = new Date()
  return `${toISODate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const upcomingAppointments = computed(() =>
  myAppointments.value
    .filter((a) => appointmentKey(a) >= nowKey.value)
    .sort((a, b) => appointmentKey(a).localeCompare(appointmentKey(b))),
)

const pastAppointments = computed(() =>
  myAppointments.value
    .filter((a) => appointmentKey(a) < nowKey.value)
    .sort((a, b) => appointmentKey(b).localeCompare(appointmentKey(a))),
)

const appointmentsTab = ref('upcoming')

const visibleAppointments = computed(() =>
  appointmentsTab.value === 'past' ? pastAppointments.value : upcomingAppointments.value,
)

function initials(person) {
  return `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase()
}

function centreInitials(centre) {
  if (!centre?.name) return ''
  return centre.name
    .replace(/centre du sommeil/i, '')
    .replace(/[—\-:]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col cols="auto" v-if="showBack">
            <v-btn :icon="mdiArrowLeft" variant="text" @click="goBack" aria-label="Retour" />
          </v-col>
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">{{ headerTitle }}</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiCalendarClockOutline" size="18" class="mr-1" />
              {{ headerSubtitle }}
            </div>
          </v-col>
        </v-row>

        <!-- =================== MY APPOINTMENTS (search step only) =================== -->
        <v-card v-if="step === 'search' && (upcomingAppointments.length > 0 || pastAppointments.length > 0)"
          class="card-shadow pa-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="appt-tabs mb-4">
            <button class="appt-tab"
              :class="{ 'appt-tab-active': appointmentsTab === 'upcoming' }"
              @click="appointmentsTab = 'upcoming'">
              <v-icon :icon="mdiCalendarCheckOutline" size="16" class="mr-1" />
              À venir
              <span v-if="upcomingAppointments.length" class="appt-tab-count">
                {{ upcomingAppointments.length }}
              </span>
            </button>
            <button class="appt-tab"
              :class="{ 'appt-tab-active': appointmentsTab === 'past' }"
              @click="appointmentsTab = 'past'">
              <v-icon :icon="mdiHistory" size="16" class="mr-1" />
              Passés
              <span v-if="pastAppointments.length" class="appt-tab-count">
                {{ pastAppointments.length }}
              </span>
            </button>
          </div>

          <div v-if="visibleAppointments.length === 0"
            class="text-body-small text-medium-emphasis text-center pa-4">
            <template v-if="appointmentsTab === 'upcoming'">
              Aucun rendez-vous à venir pour le moment.
            </template>
            <template v-else>
              Aucun rendez-vous passé.
            </template>
          </div>

          <div v-for="(a, i) in visibleAppointments" :key="a.id"
            class="appt-row"
            :class="{
              'appt-row-divided': i < visibleAppointments.length - 1,
              'appt-row-past': appointmentsTab === 'past',
            }">
            <div class="appt-row-icon" :class="{ 'appt-row-icon-past': appointmentsTab === 'past' }">
              <v-icon :icon="appointmentsTab === 'past' ? mdiHistory : mdiCalendarCheckOutline"
                size="22" :color="appointmentsTab === 'past' ? 'medium-emphasis' : 'primary'" />
            </div>
            <div class="appt-row-main">
              <div class="appt-row-title">
                {{ a.date }} · {{ a.startTime }} – {{ a.endTime }}
              </div>
              <div class="appt-row-sub">
                Dr {{ a.doctor?.firstName }} {{ a.doctor?.lastName }}
                <span v-if="a.acte" class="ml-1">· {{ a.acte.label }}</span>
                <span v-if="a.notes" class="ml-1">· {{ a.notes }}</span>
              </div>
              <div v-if="a.locationAddress || a.locationName" class="appt-row-establishment">
                <v-icon :icon="mdiMapMarkerOutline" size="12" class="appt-row-establishment-icon mr-1" />
                <span v-if="a.locationName" class="appt-row-establishment-name font-weight-medium">{{ a.locationName }}</span>
                <span v-if="a.locationAddress" class="appt-row-establishment-address"
                  :class="{ 'text-medium-emphasis': a.locationName }">
                  <span v-if="a.locationName" class="appt-row-establishment-sep">· </span>{{ a.locationAddress }}
                </span>
              </div>
            </div>
            <template v-if="appointmentsTab === 'upcoming'">
              <v-menu v-if="$vuetify.display.mobile" location="bottom end">
                <template #activator="{ props }">
                  <v-btn :icon="mdiDotsVertical" variant="text" size="small" v-bind="props"
                    aria-label="Actions du rendez-vous" />
                </template>
                <v-list density="compact" class="rounded-15">
                  <v-list-subheader class="text-body-small">Ajouter à mon calendrier</v-list-subheader>
                  <v-list-item @click="addToGoogleCalendar(a)">
                    <template #prepend>
                      <v-icon :icon="mdiGoogle" class="cal-icon-google" />
                    </template>
                    <v-list-item-title class="text-body-medium">Google Calendar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="addToOutlook(a)">
                    <template #prepend>
                      <v-icon :icon="mdiMicrosoftOutlook" class="cal-icon-outlook" />
                    </template>
                    <v-list-item-title class="text-body-medium">Outlook</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="downloadIcs(a)">
                    <template #prepend>
                      <v-icon :icon="mdiApple" class="cal-icon-apple" />
                    </template>
                    <v-list-item-title class="text-body-medium">Apple Calendar (.ics)</v-list-item-title>
                  </v-list-item>
                  <v-divider class="my-1" />
                  <v-list-item :prepend-icon="mdiCloseCircleOutline" base-color="error" @click="askCancel(a)">
                    <v-list-item-title class="text-body-medium">Annuler le RDV</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <template v-else>
                <v-menu location="bottom end">
                  <template #activator="{ props }">
                    <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none"
                      :prepend-icon="mdiCalendarPlusOutline" v-bind="props">
                      Ajouter à mon calendrier
                    </v-btn>
                  </template>
                  <v-list density="compact" class="rounded-15">
                    <v-list-item @click="addToGoogleCalendar(a)">
                      <template #prepend>
                        <v-icon :icon="mdiGoogle" class="cal-icon-google" />
                      </template>
                      <v-list-item-title class="text-body-medium">Google Calendar</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="addToOutlook(a)">
                      <template #prepend>
                        <v-icon :icon="mdiMicrosoftOutlook" class="cal-icon-outlook" />
                      </template>
                      <v-list-item-title class="text-body-medium">Outlook</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="downloadIcs(a)">
                      <template #prepend>
                        <v-icon :icon="mdiApple" class="cal-icon-apple" />
                      </template>
                      <v-list-item-title class="text-body-medium">Apple Calendar (.ics)</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-btn variant="text" color="error" size="small" rounded="lg" class="text-none"
                  :prepend-icon="mdiCloseCircleOutline" @click="askCancel(a)">
                  Annuler
                </v-btn>
              </template>
            </template>
          </div>
        </v-card>

        <!-- =================== BOOK A NEW APPOINTMENT INTRO (search step) =================== -->
        <div v-if="step === 'search'"
          class="text-title-small font-weight-bold mb-3 mt-2"
          :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-icon :icon="mdiCalendarPlusOutline" size="18" class="mr-2" color="primary" />
          Prendre un nouveau rendez-vous
        </div>

        <!-- =================== STEP 1 : SEARCH =================== -->
        <template v-if="step === 'search'">
          <v-card class="card-shadow pa-6 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="search-row">
              <v-text-field v-model="searchQuery" :prepend-inner-icon="mdiMagnify"
                placeholder="Rechercher un médecin, un centre du sommeil, une spécialité…"
                variant="outlined" rounded="lg" hide-details density="comfortable" clearable
                class="flex-grow-1 search-input" />
              <v-btn :prepend-icon="mdiCrosshairsGps"
                :color="userLocation ? 'primary' : undefined"
                :variant="userLocation ? 'flat' : 'outlined'"
                rounded="lg" size="large"
                class="text-none search-around-btn"
                :loading="locationLoading"
                @click="requestAroundMe">
                Autour de moi
              </v-btn>
            </div>
            <div v-if="locationError" class="text-body-small text-error mt-3 d-flex align-center">
              <v-icon :icon="mdiAlertOutline" size="14" class="mr-1" />
              {{ locationError }}
            </div>
            <div v-else-if="userLocation"
              class="text-body-small text-medium-emphasis mt-3 d-flex align-center flex-wrap">
              <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" color="primary" />
              <span>Résultats triés par distance depuis votre position</span>
              <v-btn variant="text" size="x-small" color="primary"
                class="ml-2 text-none" @click="clearAroundMe">
                Effacer
              </v-btn>
            </div>
          </v-card>

          <!-- Centres du sommeil -->
          <v-card v-if="filteredCentres.length > 0" class="card-shadow pa-6 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="text-title-medium font-weight-bold mb-3">
              <v-icon :icon="mdiHospitalBuilding" size="20" class="mr-2" color="primary" />
              Centres du sommeil
            </div>
            <div class="centre-grid">
              <button v-for="centre in filteredCentres" :key="centre.id" class="centre-card"
                @click="pickCentre(centre)">
                <v-avatar color="primary" variant="tonal" size="56" class="mr-3">
                  <v-img v-if="centre.logoUrl" :src="centre.logoUrl" cover />
                  <span v-else class="text-title-small font-weight-bold">{{ centreInitials(centre) }}</span>
                </v-avatar>
                <div class="centre-card-body">
                  <div class="centre-card-name">{{ centre.name }}</div>
                  <div v-if="centre.location" class="centre-card-location">
                    <v-icon :icon="mdiMapMarkerOutline" size="13" class="mr-1" />
                    {{ centre.location }}
                    <span v-if="centreDistance(centre) != null" class="centre-card-distance">
                      {{ formatDistance(centreDistance(centre)) }}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </v-card>

          <!-- Médecins -->
          <v-card class="card-shadow pa-6"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="text-title-medium font-weight-bold mb-3">
              <v-icon :icon="mdiDoctor" size="20" class="mr-2" color="primary" />
              Médecins
            </div>
            <div v-if="filteredDoctors.length === 0"
              class="text-body-small text-medium-emphasis text-center pa-6">
              Aucun médecin ne correspond à votre recherche.
            </div>
            <div v-else class="doctor-grid">
              <button v-for="doc in filteredDoctors" :key="doc.id" class="doctor-card"
                @click="pickDoctor(doc)">
                <v-avatar color="primary" variant="tonal" size="64" class="mb-2">
                  <v-img v-if="doc.avatarUrl" :src="doc.avatarUrl" cover />
                  <span v-else class="text-title-small font-weight-bold">{{ initials(doc) }}</span>
                </v-avatar>
                <div class="doctor-card-name">Dr {{ doc.firstName }} {{ doc.lastName }}</div>
                <div v-if="doc.specialty" class="doctor-card-specialty">{{ doc.specialty }}</div>
                <div v-if="doctorEstablishments(doc).length" class="doctor-card-meta">
                  <v-icon :icon="mdiHospitalBuilding" size="13" class="mr-1" />
                  {{ doctorEstablishments(doc).map((e) => e.name.replace(/Centre du sommeil — /, '')).join(', ') }}
                </div>
                <div v-if="doctorDistance(doc) != null" class="doctor-card-distance">
                  <v-icon :icon="mdiMapMarkerOutline" size="12" class="mr-1" />
                  {{ formatDistance(doctorDistance(doc)) }}
                </div>
              </button>
            </div>
          </v-card>
        </template>

        <!-- =================== STEP 2 : CENTRE → DOCTORS =================== -->
        <template v-else-if="step === 'centre' && selectedCentre">
          <v-card class="card-shadow pa-6"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" variant="tonal" size="56" class="mr-3">
                <span class="text-title-small font-weight-bold">{{ centreInitials(selectedCentre) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-title-medium font-weight-bold">{{ selectedCentre.name }}</div>
                <div v-if="selectedCentre.location" class="text-body-small text-medium-emphasis d-flex align-center mt-1">
                  <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" />
                  {{ selectedCentre.location }}
                </div>
              </div>
            </div>

            <div v-if="selectedCentre.description" class="doctor-description mb-4">
              {{ selectedCentre.description }}
            </div>

            <v-divider class="mb-4" />

            <div class="text-title-small font-weight-bold mb-3">
              Médecins du centre
            </div>
            <div v-if="doctorsOfSelectedCentre.length === 0"
              class="text-body-small text-medium-emphasis text-center pa-6">
              Aucun médecin disponible pour ce centre.
            </div>
            <div v-else class="doctor-grid">
              <button v-for="doc in doctorsOfSelectedCentre" :key="doc.id" class="doctor-card"
                @click="pickDoctor(doc)">
                <v-avatar color="primary" variant="tonal" size="64" class="mb-2">
                  <v-img v-if="doc.avatarUrl" :src="doc.avatarUrl" cover />
                  <span v-else class="text-title-small font-weight-bold">{{ initials(doc) }}</span>
                </v-avatar>
                <div class="doctor-card-name">Dr {{ doc.firstName }} {{ doc.lastName }}</div>
                <div v-if="doc.specialty" class="doctor-card-specialty">{{ doc.specialty }}</div>
              </button>
            </div>
          </v-card>
        </template>

        <!-- =================== STEP 3 : ACTE SELECTION =================== -->
        <template v-else-if="step === 'acte' && selectedDoctor">
          <v-card class="card-shadow pa-4 pa-md-6"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" variant="tonal" size="56" class="mr-3">
                <v-img v-if="selectedDoctor.avatarUrl" :src="selectedDoctor.avatarUrl" cover />
                <span v-else class="text-title-small font-weight-bold">{{ initials(selectedDoctor) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-title-medium font-weight-bold">
                  Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}
                </div>
                <div class="d-flex flex-wrap align-center ga-2 mt-1">
                  <v-chip v-if="selectedDoctor.specialty" size="x-small" variant="tonal" color="primary"
                    class="font-weight-bold">
                    {{ selectedDoctor.specialty }}
                  </v-chip>
                </div>
              </div>
            </div>

            <div v-if="selectedDoctor.description" class="doctor-description mb-4">
              {{ selectedDoctor.description }}
            </div>

            <v-divider class="mb-4" />

            <div class="acte-intro mb-3">
              <template v-if="isFirstVisitWithDoctor">
                <strong>Première consultation</strong> — vous n'avez pas encore consulté ce médecin.
                Choisissez le type de consultation initiale qui vous convient.
              </template>
              <template v-else>
                <strong>Consultation de suivi</strong> — vous avez déjà consulté ce médecin.
              </template>
            </div>

            <div v-if="availableActes.length === 0 && lockedActes.length === 0"
              class="text-body-small text-medium-emphasis text-center pa-6">
              Aucune consultation disponible auprès de ce médecin.
            </div>
            <div v-else class="acte-list">
              <button v-for="acte in availableActes" :key="acte.id" class="acte-card"
                :style="{ '--acte-color': acte.agendaColor || 'rgb(var(--v-theme-primary))' }"
                @click="showActeInfo(acte)">
                <div class="acte-card-dot" />
                <div class="acte-card-body">
                  <div class="acte-card-title">{{ acte.label }}</div>
                  <div class="acte-card-meta">
                    <span class="acte-card-meta-item">
                      <v-icon :icon="mdiTimerSandComplete" size="13" class="mr-1" />
                      {{ formatDuration(acte.averageDurationMinutes) }}
                    </span>
                    <span v-if="acte.price" class="acte-card-meta-item">
                      <v-icon :icon="mdiCashMultiple" size="13" class="mr-1" />
                      {{ acte.price }} €
                    </span>
                  </div>
                </div>
                <v-icon :icon="mdiInformationOutline" size="20" color="medium-emphasis" />
              </button>
            </div>

            <template v-if="lockedActes.length > 0">
              <div class="locked-section-label">
                <v-icon :icon="mdiLockOutline" size="14" class="mr-1" />
                Autres consultations proposées par ce médecin
              </div>
              <div class="acte-list">
                <button v-for="acte in lockedActes" :key="acte.id" class="acte-card acte-card-locked"
                  :style="{ '--acte-color': acte.agendaColor || 'rgb(var(--v-theme-primary))' }"
                  :title="lockedReason"
                  @click="showActeInfo(acte)">
                  <div class="acte-card-dot" />
                  <div class="acte-card-body">
                    <div class="acte-card-title">{{ acte.label }}</div>
                    <div class="acte-card-meta">
                      <span class="acte-card-meta-item">
                        <v-icon :icon="mdiTimerSandComplete" size="13" class="mr-1" />
                        {{ formatDuration(acte.averageDurationMinutes) }}
                      </span>
                      <span v-if="acte.price" class="acte-card-meta-item">
                        <v-icon :icon="mdiCashMultiple" size="13" class="mr-1" />
                        {{ acte.price }} €
                      </span>
                    </div>
                    <div class="acte-card-locked-reason">
                      <v-icon :icon="mdiLockOutline" size="12" class="mr-1" />
                      {{ lockedReason }}
                    </div>
                  </div>
                  <v-icon :icon="mdiInformationOutline" size="20" color="medium-emphasis" />
                </button>
              </div>
            </template>
          </v-card>
        </template>

        <!-- =================== STEP 4 : CALENDAR =================== -->
        <template v-else-if="step === 'calendar' && selectedDoctor && selectedActe">
          <v-card class="card-shadow pa-4 pa-md-6"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="acte-banner mb-3">
              <div class="acte-banner-dot"
                :style="{ background: selectedActe.agendaColor || 'rgb(var(--v-theme-primary))' }" />
              <div class="acte-banner-body">
                <div class="acte-banner-title">{{ selectedActe.label }}</div>
                <div class="acte-banner-meta">
                  <v-icon :icon="mdiTimerSandComplete" size="14" class="mr-1" />
                  {{ formatDuration(selectedActe.averageDurationMinutes) }}
                  <span v-if="selectedActe.price" class="ml-3">
                    <v-icon :icon="mdiCashMultiple" size="14" class="mr-1" />
                    {{ selectedActe.price }} €
                  </span>
                </div>
              </div>
            </div>

            <div v-if="doctorLocations.length > 1" class="location-filter mb-4">
              <div class="location-filter-label">
                <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" />
                Adresse
              </div>
              <div class="location-chips">
                <button class="location-chip"
                  :class="{ 'location-chip-active': selectedLocationId === null }"
                  @click="selectedLocationId = null">
                  Toutes
                </button>
                <button v-for="loc in doctorLocations" :key="loc.id"
                  class="location-chip"
                  :class="{ 'location-chip-active': selectedLocationId === loc.id }"
                  @click="selectedLocationId = loc.id">
                  {{ loc.shortLabel || loc.name }}
                </button>
              </div>
              <div v-if="selectedLocationId" class="location-filter-address">
                {{ doctorLocations.find((l) => l.id === selectedLocationId)?.address }}
              </div>
            </div>

            <div class="d-flex align-center mb-4">
              <v-btn :icon="mdiChevronLeft" variant="text" size="small" @click="prevWeek" />
              <div class="flex-grow-1 text-center">
                <div class="text-title-medium font-weight-bold">{{ weekRangeLabel }}</div>
                <v-btn variant="text" size="x-small" color="primary" rounded="lg" class="text-none mt-1"
                  @click="goToday">
                  Cette semaine
                </v-btn>
              </div>
              <v-btn :icon="mdiChevronRight" variant="text" size="small" @click="nextWeek" />
            </div>

            <div class="patient-days">
              <div v-for="(day, idx) in weekDays" :key="idx" class="patient-day"
                :class="{ 'patient-day-today': toISODate(day) === todayISO }">
                <div class="patient-day-header">
                  <div class="patient-day-name">{{ DAY_LABELS[idx] }}</div>
                  <div class="patient-day-num">{{ day.getDate() }}</div>
                  <div class="patient-day-month">{{ MONTH_LABELS[day.getMonth()].slice(0, 3) }}.</div>
                </div>
                <div class="patient-day-slots">
                  <div v-if="availableSlotsForDay(day).length === 0" class="patient-day-empty">
                    Pas de disponibilité
                  </div>
                  <button v-for="slot in availableSlotsForDay(day)"
                    :key="`${toISODate(day)}-${slot.startTime}-${slot.locationId}`"
                    class="patient-slot"
                    @click="openConfirm(slot, day)">
                    <span class="patient-slot-time">
                      <v-icon :icon="mdiClockOutline" size="13" class="mr-1" />
                      {{ slot.startTime }}
                    </span>
                    <span v-if="!selectedLocationId && doctorLocations.length > 1"
                      class="patient-slot-loc">
                      {{ slot.locationShortLabel }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </v-card>
        </template>

      </v-col>
    </v-row>

    <!-- =================== ACTE INFO DIALOG =================== -->
    <v-dialog v-model="acteInfoOpen" max-width="520" :fullscreen="false">
      <v-card v-if="acteInfoTarget" class="acte-info-card pa-2 rounded-15">
        <v-card-title class="acte-info-header d-flex align-center">
          <div class="flex-grow-1 min-w-0">
            <div class="acte-info-title font-weight-bold">{{ acteInfoTarget.label }}</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Détails de la consultation
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="acteInfoOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="acte-info-body">
          <div class="acte-info-meta mb-4">
            <div class="acte-info-meta-item">
              <v-icon :icon="mdiTimerSandComplete" size="18" class="mr-2" color="primary" />
              <div>
                <div class="font-weight-bold text-body-medium">
                  {{ formatDuration(acteInfoTarget.averageDurationMinutes) }}
                </div>
                <div class="text-body-small text-medium-emphasis">Durée moyenne</div>
              </div>
            </div>
            <div v-if="acteInfoTarget.price" class="acte-info-meta-item">
              <v-icon :icon="mdiCashMultiple" size="18" class="mr-2" color="primary" />
              <div>
                <div class="font-weight-bold text-body-medium">{{ acteInfoTarget.price }} €</div>
                <div class="text-body-small text-medium-emphasis">Tarif indicatif</div>
              </div>
            </div>
          </div>
          <div v-if="acteInfoTarget.description" class="acte-info-description">
            {{ acteInfoTarget.description }}
          </div>
        </v-card-text>
        <div v-if="isActeInfoLocked" class="acte-info-locked-note mx-6 mb-2">
          <v-icon :icon="mdiLockOutline" size="16" class="mr-2" color="medium-emphasis" />
          <span>{{ lockedReason }}</span>
        </div>
        <v-divider />
        <v-card-actions class="acte-info-actions">
          <v-spacer class="acte-info-spacer" />
          <v-btn variant="text" rounded="lg" class="text-none acte-info-btn-back" @click="acteInfoOpen = false">
            Retour
          </v-btn>
          <v-btn v-if="!isActeInfoLocked" color="primary" rounded="lg" flat class="text-none acte-info-btn-choose"
            @click="chooseActe(acteInfoTarget)">
            Choisir et voir les disponibilités
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== CONFIRMATION DIALOG =================== -->
    <v-dialog v-model="confirmDialog" max-width="480" :fullscreen="false">
      <v-card v-if="confirmSlot && selectedDoctor && selectedActe" class="pa-2 rounded-15">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Confirmer le rendez-vous</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Vous êtes sur le point de réserver ce créneau.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="confirmDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <div class="confirm-banner mb-3">
            <div class="confirm-banner-time">
              {{ confirmSlot.startTime }} – {{ confirmSlot.endTime }}
            </div>
            <div class="confirm-banner-date">
              {{ formatLongDate(new Date(confirmSlot.date)) }}
            </div>
          </div>
          <div class="info-line mb-2">
            <v-icon :icon="mdiDoctor" size="18" class="mr-2" color="primary" />
            <strong>Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</strong>
          </div>
          <div class="info-line mb-3">
            <div class="acte-banner-dot mr-2"
              :style="{ background: selectedActe.agendaColor || 'rgb(var(--v-theme-primary))' }" />
            <span>{{ selectedActe.label }}
              <span class="text-medium-emphasis">· {{ formatDuration(selectedActe.averageDurationMinutes) }}</span>
            </span>
          </div>
          <div v-if="confirmSlot.locationAddress || confirmSlot.locationName" class="establishment-card mb-3">
            <v-icon :icon="mdiMapMarkerOutline" size="18" class="mr-2 mt-1" color="primary" />
            <div>
              <div v-if="confirmSlot.locationName" class="font-weight-bold text-body-medium">
                {{ confirmSlot.locationName }}
              </div>
              <div v-if="confirmSlot.locationAddress" class="text-body-small text-medium-emphasis mt-1">
                {{ confirmSlot.locationAddress }}
              </div>
            </div>
          </div>
          <v-textarea v-model="confirmNotes" label="Motif (optionnel)" variant="outlined" rounded="lg"
            rows="2" auto-grow :prepend-inner-icon="mdiNotebookOutline" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="confirmDialog = false">Annuler</v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="confirmBooking">
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== CANCEL DIALOG =================== -->
    <v-dialog v-model="cancelDialog" max-width="420" :fullscreen="false">
      <v-card v-if="appointmentToCancel" class="pa-2 rounded-15">
        <v-card-text class="px-6 pt-6 pb-2 text-center">
          <div class="cancel-icon-wrap mb-4">
            <v-icon :icon="mdiAlertOutline" size="40" color="error" />
          </div>
          <div class="text-headline-small font-weight-bold mb-2">Annuler ce rendez-vous ?</div>
          <div class="text-body-medium text-medium-emphasis">
            Le créneau du
            <strong>{{ appointmentToCancel.date }}</strong>
            à
            <strong>{{ appointmentToCancel.startTime }}</strong>
            avec
            <strong>Dr {{ appointmentToCancel.doctor?.firstName }} {{ appointmentToCancel.doctor?.lastName }}</strong>
            sera libéré.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-row class="ga-2" no-gutters>
            <v-col>
              <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="closeCancel">
                Garder
              </v-btn>
            </v-col>
            <v-col>
              <v-btn color="error" rounded="lg" flat size="large" block class="text-none"
                :prepend-icon="mdiCloseCircleOutline" @click="confirmCancel">
                Annuler le RDV
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* ============ SEARCH ROW ============ */
.search-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1 1 240px;
  min-width: 0;
}

.search-around-btn {
  flex-shrink: 0;
  height: 48px;
}

@media (max-width: 600px) {
  .search-around-btn {
    width: 100%;
  }
}

/* ============ CENTRES ============ */
.centre-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.centre-card {
  display: flex;
  align-items: center;
  text-align: left;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.centre-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-2px);
}

.centre-card-body {
  flex: 1;
  min-width: 0;
}

.centre-card-name {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.centre-card-location {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
}

.centre-card-distance {
  display: inline-block;
  margin-left: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 10px;
  border-radius: 999px;
}

/* ============ DOCTORS ============ */
.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.doctor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.doctor-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-2px);
}

.doctor-card-name {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.doctor-card-specialty {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 10px;
  border-radius: 999px;
  line-height: 1.4;
}

.doctor-card-meta {
  margin-top: 6px;
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
  text-align: center;
}

.doctor-card-distance {
  margin-top: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.doctor-description {
  font-size: 13.5px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.72);
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* ============ ACTES ============ */
.acte-intro {
  font-size: 13.5px;
  color: rgba(0, 0, 0, 0.72);
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.acte-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.acte-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.acte-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-1px);
}

.acte-card-dot {
  flex-shrink: 0;
  width: 10px;
  height: 36px;
  border-radius: 4px;
  background: var(--acte-color);
}

.acte-card-body {
  flex: 1;
  min-width: 0;
}

.acte-card-title {
  font-weight: 700;
  font-size: 14.5px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.acte-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.acte-card-meta-item {
  display: inline-flex;
  align-items: center;
}

.locked-section-label {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.5);
  display: inline-flex;
  align-items: center;
}

.acte-card-locked {
  opacity: 0.75;
  background: rgba(0, 0, 0, 0.025);
  border-style: dashed;
}

.acte-card-locked:hover {
  opacity: 1;
  border-color: rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.acte-card-locked .acte-card-dot {
  opacity: 0.45;
}

.acte-card-locked-reason {
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  font-size: 11.5px;
  font-style: italic;
  color: rgba(0, 0, 0, 0.55);
}

.acte-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.acte-banner-dot {
  width: 10px;
  height: 28px;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.acte-banner-body {
  flex: 1;
  min-width: 0;
}

.acte-banner-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.acte-banner-meta {
  margin-top: 2px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.6);
}

.acte-info-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.acte-info-meta-item {
  display: inline-flex;
  align-items: center;
}

.acte-info-locked-note {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px dashed rgba(0, 0, 0, 0.18);
}

.acte-info-description {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(0, 0, 0, 0.78);
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.acte-info-header {
  padding: 20px 24px 8px 24px;
  gap: 8px;
  white-space: normal;
  align-items: flex-start;
}

.acte-info-title {
  font-size: 20px;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.acte-info-body {
  padding: 16px 24px;
}

.acte-info-actions {
  padding: 16px 24px;
}

@media (max-width: 600px) {
  .acte-info-card {
    padding: 4px !important;
  }
  .acte-info-header {
    padding: 14px 16px 6px 16px;
  }
  .acte-info-title {
    font-size: 17px;
  }
  .acte-info-body {
    padding: 12px 16px;
  }
  .acte-info-meta {
    flex-direction: column;
    gap: 12px;
  }
  .acte-info-locked-note {
    margin-left: 16px !important;
    margin-right: 16px !important;
  }
  .acte-info-actions {
    padding: 12px 16px;
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .acte-info-spacer {
    display: none;
  }
  .acte-info-btn-back,
  .acte-info-btn-choose {
    width: 100%;
    margin: 0 !important;
  }
  .acte-info-btn-choose {
    margin-bottom: 8px !important;
  }
}

/* ============ CALENDAR ============ */
.patient-days {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-day {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
}

.patient-day-today {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.04);
}

.patient-day-header {
  flex-shrink: 0;
  width: 64px;
  text-align: center;
}

.patient-day-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.5);
}

.patient-day-num {
  font-size: 22px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.1;
  margin-top: 2px;
}

.patient-day-today .patient-day-num {
  color: rgb(var(--v-theme-primary));
}

.patient-day-month {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  text-transform: lowercase;
  margin-top: 2px;
}

.patient-day-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex-grow: 1;
}

.patient-day-empty {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
}

.location-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.location-filter-label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
}

.location-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.location-chip {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.location-chip:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
}

.location-chip-active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: white;
}

.location-chip-active:hover {
  color: white;
}

.location-filter-address {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.patient-slot {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  background: white;
  color: rgb(var(--v-theme-primary));
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.patient-slot-time {
  display: inline-flex;
  align-items: center;
}

.patient-slot-loc {
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 1px;
  text-transform: none;
  letter-spacing: 0;
}

.patient-slot:hover {
  background: rgba(var(--v-theme-primary), 0.12);
  transform: translateY(-1px);
}

.patient-slot:active {
  transform: translateY(0);
}

/* ============ CONFIRM / APPOINTMENTS ============ */
.establishment-card {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.appt-row-establishment {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 2px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 4px;
}

.appt-row-establishment-icon {
  margin-right: 0 !important;
}

@media (max-width: 959px) {
  .appt-row-establishment-address {
    flex-basis: 100%;
    padding-left: 16px;
  }
  .appt-row-establishment-sep {
    display: none;
  }
}

.confirm-banner {
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.confirm-banner-time {
  font-size: 22px;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.3px;
}

.confirm-banner-date {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 2px;
}

.info-line {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.appt-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.appt-tab {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.appt-tab:hover {
  color: rgb(var(--v-theme-primary));
}

.appt-tab-active {
  color: rgb(var(--v-theme-primary));
  border-bottom-color: rgb(var(--v-theme-primary));
}

.appt-tab-count {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.65);
  padding: 1px 8px;
  border-radius: 999px;
  line-height: 1.4;
}

.appt-tab-active .appt-tab-count {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
}

.appt-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
}

.appt-row-past .appt-row-title,
.appt-row-past .appt-row-sub {
  color: rgba(0, 0, 0, 0.55);
}

.appt-row-icon-past {
  background: rgba(0, 0, 0, 0.06) !important;
}

.appt-row-divided {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.appt-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  flex-shrink: 0;
}

.appt-row-main {
  flex: 1;
  min-width: 0;
}

.appt-row-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.appt-row-sub {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.cal-icon-google {
  color: #4285F4;
}

.cal-icon-outlook {
  color: #0078D4;
}

.cal-icon-apple {
  color: #000000;
}

.cancel-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), 0.12);
}
</style>
