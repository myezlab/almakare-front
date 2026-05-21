<script setup>
import { useAppointmentsStore } from '@/stores/appointments'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { useTeamStore } from '@/stores/team'
import {
  mdiAlertOutline,
  mdiApple,
  mdiCalendarCheckOutline,
  mdiCalendarPlusOutline,
  mdiCashMultiple,
  mdiCheckCircleOutline,
  mdiChevronLeft,
  mdiClockOutline,
  mdiCloseCircleOutline,
  mdiCreditCardOutline,
  mdiDoctor,
  mdiFileDocumentOutline,
  mdiGoogle,
  mdiInformationOutline,
  mdiMapMarkerOutline,
  mdiMicrosoftOutlook,
  mdiNotebookOutline,
  mdiTimerSandComplete,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

dayjs.extend(relativeTime)
dayjs.locale('fr')

const route = useRoute()
const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const teamStore = useTeamStore()
const organisationStore = useOrganisationStore()
const messagesStore = useMessagesStore()

const appointmentId = computed(() => route.params.id)

const appointment = computed(() =>
  appointmentsStore.items.find((a) => a.id === appointmentId.value) || null,
)

const doctor = computed(() => {
  if (!appointment.value) return null
  return teamStore.items.find((m) => m.id === appointment.value.doctorId) || null
})

const acte = computed(() => {
  if (!appointment.value) return null
  return (organisationStore.item.actes || []).find((a) => a.id === appointment.value.acteId) || null
})

const startDateTime = computed(() => {
  if (!appointment.value) return null
  return dayjs(`${appointment.value.date}T${appointment.value.startTime}:00`)
})

const isPast = computed(() => {
  if (!startDateTime.value) return false
  return startDateTime.value.isBefore(dayjs())
})

const statusLabel = computed(() => {
  if (!appointment.value) return ''
  if (appointment.value.status === 'cancelled') return 'Annulé'
  if (appointment.value.status === 'completed' || isPast.value) return 'Passé'
  return 'À venir'
})

const statusColor = computed(() => {
  if (!appointment.value) return 'grey'
  if (appointment.value.status === 'cancelled') return 'error'
  if (appointment.value.status === 'completed' || isPast.value) return 'grey'
  return 'primary'
})

const dateLong = computed(() => {
  if (!startDateTime.value) return ''
  return startDateTime.value.format('dddd D MMMM YYYY')
})

const timeRange = computed(() => {
  if (!appointment.value) return ''
  return `${appointment.value.startTime} – ${appointment.value.endTime}`
})

const relativeWhen = computed(() => {
  if (!startDateTime.value) return ''
  return startDateTime.value.fromNow()
})

const TABS = [
  { value: 'details', label: 'Détails', icon: mdiInformationOutline },
  { value: 'paiement', label: 'Paiement', icon: mdiCreditCardOutline },
]
const activeTab = ref('details')

function initials(person) {
  return `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase()
}

function formatDuration(mins) {
  if (!mins) return ''
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `~${h}h` : `~${h}h${String(m).padStart(2, '0')}`
}

// ============ Add to calendar ============
function calendarEvent() {
  const a = appointment.value
  if (!a) return null
  const doctorName = `Dr ${doctor.value?.firstName ?? ''} ${doctor.value?.lastName ?? ''}`.trim()
  const title = `RDV ${doctorName}${acte.value ? ` — ${acte.value.label}` : ''}`
  const parts = []
  if (acte.value?.label) parts.push(acte.value.label)
  if (doctorName) parts.push(doctorName)
  if (a.notes) parts.push(`Motif : ${a.notes}`)
  const location = [a.locationName, a.locationAddress].filter(Boolean).join(' — ')
  return {
    title,
    description: parts.join('\n'),
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

function addToGoogleCalendar() {
  const ev = calendarEvent()
  if (!ev) return
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', ev.title)
  url.searchParams.set('dates', `${toCalendarStamp(ev.date, ev.startTime)}/${toCalendarStamp(ev.date, ev.endTime)}`)
  url.searchParams.set('ctz', 'Europe/Paris')
  if (ev.description) url.searchParams.set('details', ev.description)
  if (ev.location) url.searchParams.set('location', ev.location)
  window.open(url.toString(), '_blank', 'noopener')
}

function addToOutlook() {
  const ev = calendarEvent()
  if (!ev) return
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

function downloadIcs() {
  const ev = calendarEvent()
  if (!ev) return
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Almakare//Rendez-vous//FR',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Paris:${toCalendarStamp(ev.date, ev.startTime)}`,
    `DTEND;TZID=Europe/Paris:${toCalendarStamp(ev.date, ev.endTime)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : null,
    ev.location ? `LOCATION:${esc(ev.location)}` : null,
    'END:VEVENT', 'END:VCALENDAR',
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

// ============ Cancel ============
const cancelDialog = ref(false)

function confirmCancel() {
  if (!appointment.value) return
  appointmentsStore.cancelAppointment(appointment.value.id)
  messagesStore.add({ type: 'success', text: 'Rendez-vous annulé' })
  cancelDialog.value = false
  router.push({ name: 'Rendezvous' })
}

// ============ Payment (placeholder) ============
const paymentStatus = computed(() => {
  if (!appointment.value) return 'pending'
  if (appointment.value.paymentStatus) return appointment.value.paymentStatus
  if (appointment.value.status === 'completed' || isPast.value) return 'paid'
  return 'pending'
})
</script>

<template>
  <div>
    <v-row v-if="appointment" justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- Back -->
        <div :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-btn :prepend-icon="mdiChevronLeft" variant="text" class="text-none mb-3 ml-n2"
            @click="router.back()">
            Retour
          </v-btn>
        </div>

        <!-- HERO -->
        <v-card class="card-shadow pa-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-4">
            <v-avatar color="primary" variant="tonal" size="56" class="mr-3">
              <v-img v-if="doctor?.avatarUrl" :src="doctor.avatarUrl" cover />
              <span v-else class="text-title-small font-weight-bold">{{ initials(doctor) }}</span>
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-headline-small font-weight-bold">
                Dr {{ doctor?.firstName }} {{ doctor?.lastName }}
              </div>
              <div v-if="acte" class="text-body-medium text-medium-emphasis mt-1 d-flex align-center flex-wrap ga-2">
                <span class="acte-dot"
                  :style="{ background: acte.agendaColor || 'rgb(var(--v-theme-primary))' }" />
                {{ acte.label }}
              </div>
            </div>
            <v-chip :color="statusColor" variant="tonal" size="small" class="flex-shrink-0 ml-2">
              {{ statusLabel }}
            </v-chip>
          </div>

          <div class="appt-hero-banner">
            <div class="appt-hero-banner-time">{{ timeRange }}</div>
            <div class="appt-hero-banner-date">
              {{ dateLong }} <span class="text-medium-emphasis">· {{ relativeWhen }}</span>
            </div>
          </div>

          <v-tabs v-if="!$vuetify.display.mobile" v-model="activeTab" color="primary" align-tabs="center"
            :show-arrows="false" class="mt-6 appt-tabs">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" class="text-none">
              <v-icon :icon="t.icon" size="18" class="mr-1" />
              {{ t.label }}
            </v-tab>
          </v-tabs>
          <v-chip-group v-else v-model="activeTab" mandatory class="mt-4 appt-chips" column>
            <v-chip v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" variant="flat"
              :class="{ 'bg-primary': activeTab === t.value, 'bg-white border-light': activeTab !== t.value }"
              class="text-none">
              {{ t.label }}
            </v-chip>
          </v-chip-group>
        </v-card>

        <!-- ============ TAB: DETAILS ============ -->
        <template v-if="activeTab === 'details'">
          <!-- Doctor -->
          <v-card class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiDoctor" size="14" class="mr-1" color="primary" />
              Médecin
            </div>
            <div class="text-title-medium font-weight-bold mt-2">
              Dr {{ doctor?.firstName }} {{ doctor?.lastName }}
            </div>
            <div v-if="doctor?.specialty" class="text-body-small text-medium-emphasis mt-1">
              {{ doctor.specialty }}
            </div>
          </v-card>

          <!-- Location -->
          <v-card v-if="appointment.locationName || appointment.locationAddress"
            class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" color="primary" />
              Lieu
            </div>
            <div v-if="appointment.locationName" class="text-title-medium font-weight-bold mt-2">
              {{ appointment.locationName }}
            </div>
            <div v-if="appointment.locationAddress" class="text-body-medium text-medium-emphasis mt-1">
              {{ appointment.locationAddress }}
            </div>
          </v-card>

          <!-- Acte info -->
          <v-card v-if="acte" class="card-shadow pa-5 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiInformationOutline" size="14" class="mr-1" color="primary" />
              Consultation
            </div>
            <div class="text-title-medium font-weight-bold mt-2">{{ acte.label }}</div>
            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-chip :prepend-icon="mdiTimerSandComplete" size="small" variant="tonal" color="grey">
                {{ formatDuration(acte.averageDurationMinutes) }}
              </v-chip>
              <v-chip v-if="acte.price" :prepend-icon="mdiCashMultiple" size="small" variant="tonal" color="grey">
                {{ acte.price }} €
              </v-chip>
            </div>
            <div v-if="acte.description" class="text-body-medium text-medium-emphasis mt-3">
              {{ acte.description }}
            </div>
          </v-card>

          <!-- Notes -->
          <v-card v-if="appointment.notes" class="card-shadow pa-5 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiNotebookOutline" size="14" class="mr-1" color="primary" />
              Motif
            </div>
            <div class="text-body-medium mt-2">{{ appointment.notes }}</div>
          </v-card>

          <!-- Actions -->
          <v-card v-if="!isPast && appointment.status !== 'cancelled'"
            class="card-shadow pa-5" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiCalendarPlusOutline" size="14" class="mr-1" color="primary" />
              Actions
            </div>
            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-menu location="bottom start">
                <template #activator="{ props }">
                  <v-btn variant="tonal" color="primary" rounded="lg" class="text-none"
                    :prepend-icon="mdiCalendarPlusOutline" v-bind="props">
                    Ajouter à mon calendrier
                  </v-btn>
                </template>
                <v-list density="compact" class="rounded-15">
                  <v-list-item @click="addToGoogleCalendar">
                    <template #prepend>
                      <v-icon :icon="mdiGoogle" class="cal-icon-google" />
                    </template>
                    <v-list-item-title class="text-body-medium">Google Calendar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="addToOutlook">
                    <template #prepend>
                      <v-icon :icon="mdiMicrosoftOutlook" class="cal-icon-outlook" />
                    </template>
                    <v-list-item-title class="text-body-medium">Outlook</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="downloadIcs">
                    <template #prepend>
                      <v-icon :icon="mdiApple" class="cal-icon-apple" />
                    </template>
                    <v-list-item-title class="text-body-medium">Apple Calendar (.ics)</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-btn variant="text" color="error" rounded="lg" class="text-none"
                :prepend-icon="mdiCloseCircleOutline" @click="cancelDialog = true">
                Annuler le RDV
              </v-btn>
            </div>
          </v-card>
        </template>

        <!-- ============ TAB: PAIEMENT ============ -->
        <template v-else-if="activeTab === 'paiement'">
          <v-card class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiCreditCardOutline" size="14" class="mr-1" color="primary" />
              Statut du paiement
            </div>
            <div class="d-flex align-center mt-3">
              <v-chip v-if="paymentStatus === 'paid'" color="success" variant="tonal"
                :prepend-icon="mdiCheckCircleOutline" size="large">
                Payé
              </v-chip>
              <v-chip v-else color="warning" variant="tonal"
                :prepend-icon="mdiClockOutline" size="large">
                À régler
              </v-chip>
              <div v-if="acte?.price" class="ml-auto text-headline-small font-weight-bold">
                {{ acte.price }} €
              </div>
            </div>
          </v-card>

          <v-card class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiFileDocumentOutline" size="14" class="mr-1" color="primary" />
              Détail
            </div>
            <div class="payment-row mt-3">
              <span>{{ acte?.label || 'Consultation' }}</span>
              <span class="font-weight-bold">{{ acte?.price ? `${acte.price} €` : '—' }}</span>
            </div>
            <v-divider class="my-3" />
            <div class="payment-row">
              <span class="font-weight-bold">Total</span>
              <span class="text-headline-small font-weight-bold">
                {{ acte?.price ? `${acte.price} €` : '—' }}
              </span>
            </div>
          </v-card>

          <v-card v-if="paymentStatus !== 'paid'"
            class="card-shadow pa-5" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="text-body-medium text-medium-emphasis mb-3">
              Le règlement se fait directement auprès du médecin lors de la consultation. Le paiement en
              ligne sera bientôt disponible.
            </div>
            <v-btn :prepend-icon="mdiCreditCardOutline" color="primary" rounded="lg" disabled
              class="text-none">
              Payer en ligne (bientôt)
            </v-btn>
          </v-card>
        </template>

      </v-col>
    </v-row>

    <!-- Not found -->
    <v-row v-else justify="center" class="mt-16 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 8" class="text-center">
        <v-icon :icon="mdiAlertOutline" size="48" color="medium-emphasis" />
        <div class="text-headline-small font-weight-bold mt-3">Rendez-vous introuvable</div>
        <div class="text-body-medium text-medium-emphasis mt-1 mb-4">
          Ce rendez-vous n'existe pas ou a été supprimé.
        </div>
        <v-btn color="primary" rounded="lg" class="text-none"
          @click="router.push({ name: 'Rendezvous' })">
          Retour aux rendez-vous
        </v-btn>
      </v-col>
    </v-row>

    <!-- Cancel dialog -->
    <v-dialog v-model="cancelDialog" max-width="420" :fullscreen="false">
      <v-card v-if="appointment" class="pa-2 rounded-15">
        <v-card-text class="px-6 pt-6 pb-2 text-center">
          <div class="cancel-icon-wrap mb-4">
            <v-icon :icon="mdiAlertOutline" size="40" color="error" />
          </div>
          <div class="text-headline-small font-weight-bold mb-2">Annuler ce rendez-vous ?</div>
          <div class="text-body-medium text-medium-emphasis">
            Le créneau du <strong>{{ appointment.date }}</strong> à
            <strong>{{ appointment.startTime }}</strong> sera libéré.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-row class="ga-2" no-gutters>
            <v-col>
              <v-btn variant="text" rounded="lg" size="large" block class="text-none"
                @click="cancelDialog = false">
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
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.card-label {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.55);
}

.acte-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.appt-hero-banner {
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.appt-hero-banner-time {
  font-size: 22px;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.3px;
}

.appt-hero-banner-date {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 2px;
  text-transform: capitalize;
}

.appt-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.appt-chips :deep(.v-slide-group__container) {
  overflow: visible;
  contain: none;
}

.appt-chips :deep(.v-slide-group__content) {
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  white-space: normal;
}

.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.cal-icon-google { color: #4285F4; }
.cal-icon-outlook { color: #0078D4; }
.cal-icon-apple { color: #000000; }

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
