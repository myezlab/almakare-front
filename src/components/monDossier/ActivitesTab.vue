<script setup>
import DoctorCard from "@/components/DoctorCard.vue"
import LocationCard from "@/components/LocationCard.vue"
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES_DATA from "@/data/activities.json"
import { DOCTORS_SEED } from "@/data/doctors"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiApple,
  mdiCalendarBlankOutline,
  mdiCalendarPlusOutline,
  mdiCancel,
  mdiCheckCircleOutline,
  mdiClipboardPulseOutline,
  mdiClockOutline,
  mdiFileDocumentEditOutline,
  mdiGoogle,
  mdiMicrosoftOutlook,
  mdiMoonWaningCrescent
} from "@mdi/js"
import dayjs from "dayjs"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()
const router = useRouter()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const openPanels = useUrlPanels("actPanels")

const activities = ref(
  [...ACTIVITIES_DATA].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
)

// Resolve the activity's free-text doctor name ("Dr Lucas Robert") to a seeded
// doctor record so we can show their profile picture, specialty, etc.
function normalizeName(value) {
  return (value || "").replace(/^Dr\.?\s+/i, "").trim().toLowerCase()
}
function getDoctor(activity) {
  const name = normalizeName(activity.doctor)
  return (
    DOCTORS_SEED.find(
      (d) => `${d.firstName} ${d.lastName}`.toLowerCase() === name
    ) || null
  )
}

const lastActivityId = computed(() => activities.value[0]?.id || null)
const secondActivityId = computed(() => activities.value[1]?.id || null)

const epworthCompleted = computed(() => selfStore.item?.epworthScore != null)
const sleepDiaryStarted = computed(() => (selfStore.item?.sleepDiaryEntries || []).length > 0)

const today = dayjs().startOf('day')
function isUpcoming(activity) {
  return dayjs(activity.date).isSame(today) || dayjs(activity.date).isAfter(today)
}

const sections = computed(() => {
  const upcoming = []
  const ongoing = []
  const past = []
  for (const activity of activities.value) {
    const date = dayjs(activity.date).startOf('day')
    if (date.isSame(today)) ongoing.push(activity)
    else if (date.isAfter(today)) upcoming.push(activity)
    else past.push(activity)
  }
  // soonest upcoming first; ongoing and past keep the most recent first
  upcoming.reverse()
  return [
    { key: 'upcoming', title: 'À venir', items: upcoming },
    { key: 'ongoing', title: 'En cours', items: ongoing },
    { key: 'past', title: 'Passés', items: past }
  ].filter((section) => section.items.length > 0)
})

const showCancelDialog = ref(false)
const cancelTarget = ref(null)
const cancelling = ref(false)
const confirmedIds = ref(new Set())
const cancelledIds = ref(new Set())

function isCancelled(activity) {
  return activity.cancelled === true || cancelledIds.value.has(activity.id)
}

function isDone(activity) {
  return !isUpcoming(activity) && !isCancelled(activity)
}

// Show the Annuler / Confirmer buttons in the collapsed header while the
// consultation is upcoming and the patient hasn't confirmed yet.
function showHeaderActions(activity) {
  return (
    isUpcoming(activity) &&
    !isCancelled(activity) &&
    !confirmedIds.value.has(activity.id) &&
    !openPanels.value.includes(activity.id)
  )
}

function confirmAttendance(activity) {
  confirmedIds.value = new Set([...confirmedIds.value, activity.id])
  messagesStore.add({ type: 'success', text: 'Présence confirmée' })
}

function askCancel(activity) {
  cancelTarget.value = activity
  showCancelDialog.value = true
}

async function doCancel() {
  cancelling.value = true
  try {
    if (cancelTarget.value) {
      cancelledIds.value = new Set([...cancelledIds.value, cancelTarget.value.id])
      const next = new Set(confirmedIds.value)
      next.delete(cancelTarget.value.id)
      confirmedIds.value = next
    }
    messagesStore.add({ type: 'success', text: 'Consultation annulée' })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'annulation" })
  } finally {
    cancelling.value = false
    showCancelDialog.value = false
    cancelTarget.value = null
  }
}

function getEventTimes(activity) {
  const start = dayjs(`${activity.date}T${activity.time || '09:00'}`)
  return { start, end: start.add(30, 'minute') }
}

// Long French date/time shown in the open panel, e.g. "Le mercredi 10 juin à 9h00".
function fullDateTime(activity) {
  const start = dayjs(`${activity.date}T${activity.time || '09:00'}`)
  return `Le ${start.format('dddd D MMMM')} à ${start.format('H[h]mm')}`
}

function calendarTitle(activity) {
  return `${activity.type} — ${activity.doctor}`
}

function escapeIcs(value) {
  return (value || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

function addToGoogle(activity) {
  const { start, end } = getEventTimes(activity)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calendarTitle(activity),
    dates: `${start.format('YYYYMMDDTHHmmss')}/${end.format('YYYYMMDDTHHmmss')}`,
    details: activity.report || '',
    location: activity.locationName || ''
  })
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
}

function addToOutlook(activity) {
  const { start, end } = getEventTimes(activity)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: calendarTitle(activity),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: activity.report || '',
    location: activity.locationName || ''
  })
  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
}

function downloadIcs(activity) {
  const { start, end } = getEventTimes(activity)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Almakare//Activites//FR',
    'BEGIN:VEVENT',
    `UID:${activity.id}@almakare`,
    `DTSTART:${start.format('YYYYMMDDTHHmmss')}`,
    `DTEND:${end.format('YYYYMMDDTHHmmss')}`,
    `SUMMARY:${escapeIcs(calendarTitle(activity))}`,
    `LOCATION:${escapeIcs(activity.locationName)}`,
    `DESCRIPTION:${escapeIcs(activity.report)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${activity.type}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

function goToEpworth() {
  router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })
}

function goToSleepDiary() {
  router.push({ name: 'SleepDiary' })
}
</script>

<template>
  <v-row class="mt-6">
    <v-col v-for="section in sections" :key="section.key" cols="12">
      <div class="section-header text-overline text-medium-emphasis px-1 pb-2"
        :class="{ 'pl-4': $vuetify.display.mobile }">
        {{ section.title }}
      </div>
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow pa-2"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <v-expansion-panel v-for="activity in section.items" :key="activity.id" :value="activity.id">
            <v-expansion-panel-title>
              <div v-if="mobile" class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-center ga-2">
                  <span class="panel-title"
                    :class="{ 'text-decoration-line-through text-medium-emphasis': isCancelled(activity) }">
                    {{ activity.type }}
                  </span>
                  <v-chip v-if="isCancelled(activity)" color="error" size="x-small" variant="tonal" label>
                    Annulé
                  </v-chip>
                  <v-chip v-else-if="confirmedIds.has(activity.id)" color="success" size="x-small" variant="tonal"
                    label>
                    Confirmée
                  </v-chip>
                  <v-chip v-else-if="isDone(activity)" color="primary" size="x-small" variant="tonal" label>
                    Effectué
                  </v-chip>
                </div>
                <span v-if="!openPanels.includes(activity.id)"
                  class="d-flex align-center flex-wrap ga-1 text-body-small text-medium-emphasis mt-1">
                  {{ activity.doctor }} •
                  <v-icon :icon="mdiCalendarBlankOutline" size="14" />
                  {{ ISOToDDMMYYYY(activity.date) }}
                  <v-icon :icon="mdiClockOutline" size="14" />
                  {{ activity.time }}
                </span>
                <v-row v-if="showHeaderActions(activity)" no-gutters class="mt-2" @click.stop>
                  <v-col cols="6" class="pr-1">
                    <v-btn block color="error" variant="tonal" rounded="lg" size="small" class="text-none"
                      @click="askCancel(activity)">
                      Annuler
                    </v-btn>
                  </v-col>
                  <v-col cols="6" class="pl-1">
                    <v-btn block color="success" variant="flat" rounded="lg" size="small" class="text-none"
                      @click="confirmAttendance(activity)">
                      Confirmer
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
              <div v-else class="d-flex align-center flex-wrap ga-2 flex-grow-1">
                <span class="panel-title"
                  :class="{ 'text-decoration-line-through text-medium-emphasis': isCancelled(activity) }">
                  {{ activity.type }}
                </span>
                <v-chip v-if="isCancelled(activity)" color="error" size="x-small" variant="tonal" label>
                  Annulé
                </v-chip>
                <v-chip v-else-if="confirmedIds.has(activity.id)" color="success" size="x-small" variant="tonal" label>
                  Confirmé
                </v-chip>
                <v-chip v-else-if="isDone(activity)" color="primary" size="x-small" variant="tonal" label>
                  Effectué
                </v-chip>
                <template v-if="!openPanels.includes(activity.id)">
                  <span class="text-medium-emphasis">•</span>
                  <span class="text-body-medium">{{ activity.doctor }}</span>
                  <span class="text-medium-emphasis">•</span>
                  <v-icon :icon="mdiCalendarBlankOutline" size="16" class="text-medium-emphasis" />
                  <span class="text-body-medium text-medium-emphasis">{{ ISOToDDMMYYYY(activity.date) }}</span>
                  <v-icon :icon="mdiClockOutline" size="16" class="text-medium-emphasis" />
                  <span class="text-body-medium text-medium-emphasis">{{ activity.time }}</span>
                </template>
              </div>
              <div v-if="!mobile && showHeaderActions(activity)" class="d-flex align-center ga-1 mr-2" @click.stop>
                <v-btn color="error" variant="text" rounded="lg" size="small" class="text-none"
                  @click="askCancel(activity)">
                  Annuler
                </v-btn>
                <v-btn color="success" variant="flat" rounded="lg" size="small" class="text-none"
                  @click="confirmAttendance(activity)">
                  Confirmer
                </v-btn>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>

              <!-- =================== CALENDAR + DATE/TIME ROW =================== -->
              <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                <v-menu v-if="isUpcoming(activity)" location="bottom start">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" color="primary" variant="tonal" rounded="lg" size="small" class="text-none"
                      :prepend-icon="mdiCalendarPlusOutline">
                      Ajouter au calendrier
                    </v-btn>
                  </template>
                  <v-list density="compact" rounded="lg" class="card-shadow">
                    <v-list-item :prepend-icon="mdiGoogle" title="Google Agenda" @click="addToGoogle(activity)" />
                    <v-list-item :prepend-icon="mdiMicrosoftOutlook" title="Outlook" @click="addToOutlook(activity)" />
                    <v-list-item :prepend-icon="mdiApple" title="Apple / iCal" @click="downloadIcs(activity)" />
                  </v-list>
                </v-menu>
                <div class="d-flex align-center ga-2 text-medium-emphasis">
                  <span class="text-body-medium font-weight-medium">{{ fullDateTime(activity) }}</span>
                </div>
              </div>

              <!-- =================== DOCTOR CARD =================== -->
              <DoctorCard v-if="getDoctor(activity)" :doctor="getDoctor(activity)" :name="activity.doctor"
                class="mb-3" />

              <!-- =================== LOCATION =================== -->
              <LocationCard :location-name="activity.locationName" class="mb-3" />

              <!-- =================== RAPPORT MÉDECIN (not shown while upcoming) =================== -->
              <v-alert v-if="!isUpcoming(activity) && activity.report" type="warning" variant="tonal"
                :icon="mdiFileDocumentEditOutline" density="comfortable" rounded="lg">
                <div class="text-body-small font-weight-bold mb-1">Rapport médecin</div>
                <div class="text-body-medium">{{ activity.report }}</div>
              </v-alert>

              <v-alert v-else-if="!isUpcoming(activity)" type="warning" variant="tonal"
                :icon="mdiFileDocumentEditOutline" density="comfortable" rounded="lg">
                <div class="text-body-medium font-weight-bold">Rapport médecin</div>
                <div class="text-body-small text-medium-emphasis">Aucun rapport renseigné pour cette consultation.</div>
              </v-alert>

              <!-- =================== EPWORTH PROMPT (last consultation only) =================== -->
              <v-alert v-if="activity.id === lastActivityId && epworthCompleted" type="success" variant="tonal"
                :icon="mdiCheckCircleOutline" density="comfortable" rounded="lg" class="mt-3 cursor-pointer"
                @click="goToEpworth">
                <div class="text-body-medium font-weight-bold">Test d'Epworth complété</div>
                <div class="text-body-small text-medium-emphasis">
                  Merci, vos réponses ont bien été transmises à votre médecin. Cliquez pour revoir vos réponses.
                </div>
              </v-alert>

              <v-alert v-else-if="activity.id === lastActivityId" type="warning" variant="tonal"
                :icon="mdiClipboardPulseOutline" density="comfortable" rounded="lg" class="mt-3">
                <div class="text-body-medium font-weight-bold">Test d'Epworth à compléter</div>
                <div class="text-body-small text-medium-emphasis mb-3">
                  Votre médecin vous demande de remplir le test d'Epworth avant votre prochain rendez-vous.
                </div>
                <v-btn color="warning" variant="flat" rounded="lg" size="small" class="text-none"
                  :prepend-icon="mdiClipboardPulseOutline" @click="goToEpworth">
                  Passer le test
                </v-btn>
              </v-alert>

              <!-- =================== SLEEP DIARY PROMPT (second consultation only) =================== -->
              <v-alert v-if="activity.id === secondActivityId && sleepDiaryStarted" type="success" variant="tonal"
                :icon="mdiCheckCircleOutline" density="comfortable" rounded="lg" class="mt-3 cursor-pointer"
                @click="goToSleepDiary">
                <div class="text-body-medium font-weight-bold">Agenda du sommeil renseigné</div>
                <div class="text-body-small text-medium-emphasis">
                  Vos entrées sont bien partagées avec votre médecin. Cliquez pour ouvrir l'agenda.
                </div>
              </v-alert>

              <v-alert v-else-if="activity.id === secondActivityId" type="warning" variant="tonal"
                :icon="mdiMoonWaningCrescent" density="comfortable" rounded="lg" class="mt-3">
                <div class="text-body-medium font-weight-bold">Agenda du sommeil à compléter</div>
                <div class="text-body-small text-medium-emphasis mb-3">
                  Votre médecin vous demande de remplir votre agenda du sommeil avant votre prochain rendez-vous.
                </div>
                <v-btn color="warning" variant="flat" rounded="lg" size="small" class="text-none"
                  :prepend-icon="mdiMoonWaningCrescent" @click="goToSleepDiary">
                  Ouvrir l'agenda
                </v-btn>
              </v-alert>

              <!-- =================== CANCELLED STATUS =================== -->
              <v-alert v-if="isCancelled(activity)" type="error" variant="tonal" :icon="mdiCancel" density="comfortable"
                rounded="lg" class="mt-3">
                <div class="text-body-medium font-weight-bold">Consultation annulée</div>
                <div class="text-body-small text-medium-emphasis">
                  Cette consultation a été annulée. Pensez à reprendre rendez-vous si nécessaire.
                </div>
              </v-alert>

              <!-- =================== CANCEL / CONFIRM CONSULTATION =================== -->
              <div v-if="isUpcoming(activity) && !isCancelled(activity)"
                class="d-flex justify-center align-center ga-2 mt-4">
                <v-btn color="error" variant="text" rounded="lg" size="small" class="text-none"
                  @click="askCancel(activity)">
                  Annuler la consultation
                </v-btn>
                <v-btn v-if="!confirmedIds.has(activity.id)" color="success" variant="flat" rounded="lg" size="small"
                  class="text-none" @click="confirmAttendance(activity)">
                  Je confirme ma présence
                </v-btn>
              </div>

            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>

    <!-- Cancel confirm dialog -->
    <v-dialog v-model="showCancelDialog" max-width="380">
      <v-card class="card-shadow rounded-15">
        <v-card-title class="pa-4">Annuler la consultation</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <template v-if="cancelTarget">
            Êtes-vous sûr de vouloir annuler la consultation
            <strong>{{ cancelTarget.type }}</strong>
            du {{ ISOToDDMMYYYY(cancelTarget.date) }} à {{ cancelTarget.time }} ?
          </template>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" rounded="lg" size="large" class="text-none" @click="showCancelDialog = false">
            Retour
          </v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" rounded="lg" size="large" class="text-none" :loading="cancelling"
            @click="doCancel">
            Annuler la consultation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
