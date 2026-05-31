<script setup>
import DocumentDialog from "@/components/DocumentDialog.vue"
import DoctorCard from "@/components/DoctorCard.vue"
import FormGeneratorDialog from "@/components/FormGeneratorDialog.vue"
import LocationCard from "@/components/LocationCard.vue"
import TestDialog from "@/components/TestDialog.vue"
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES_DATA from "@/data/activities.json"
import { DOCTORS_SEED } from "@/data/doctors"
import { DOCUMENTS_BY_KEY } from "@/data/documents"
import { PATIENT_FIELDS, PATIENT_FIELDS_BY_KEY } from "@/data/patientFields"
import { TESTS_BY_KEY } from "@/data/tests"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiApple,
  mdiCalendarBlankOutline,
  mdiCalendarPlusOutline,
  mdiCancel,
  mdiCardAccountDetailsOutline,
  mdiCheckCircleOutline,
  mdiClipboardCheckOutline,
  mdiClockOutline,
  mdiFileDocumentEditOutline,
  mdiGoogle,
  mdiMicrosoftOutlook
} from "@mdi/js"
import dayjs from "dayjs"
import { computed, ref } from "vue"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()
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

const today = dayjs().startOf('day')
function isUpcoming(activity) {
  return dayjs(activity.date).isSame(today) || dayjs(activity.date).isAfter(today)
}
function isPast(activity) {
  return dayjs(activity.date).startOf('day').isBefore(today)
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

// The soonest upcoming consultation carries the preparation tasks the patient
// must complete beforehand (questionnaires, documents, fields…).
const nextConsultation = computed(() => {
  const upcoming = activities.value.filter(isUpcoming)
  upcoming.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return upcoming[0] || null
})
const nextConsultationId = computed(() => nextConsultation.value?.id || null)

// A consultation requests three separate kinds of preparation, each its own
// array on the activity:
//   `requestedFields`    — patient-data field keys (see src/data/patientFields.js),
//                          gathered into a single "Données patient" card.
//   `requestedTests`     — test keys (see src/data/tests.js), one card each.
//   `requestedDocuments` — document keys (see src/data/documents.js), one card each.
const requestedFieldKeys = computed(() => nextConsultation.value?.requestedFields || [])
const requestedTestKeys = computed(() => nextConsultation.value?.requestedTests || [])
const requestedDocumentKeys = computed(() => nextConsultation.value?.requestedDocuments || [])

// Requested fields that drive completion (the primary, non-conditional ones).
const requestedPatientFields = computed(() =>
  requestedFieldKeys.value.map((k) => PATIENT_FIELDS_BY_KEY[k]).filter((f) => f && f.complete)
)
const hasPatientDataRequest = computed(() => requestedPatientFields.value.length > 0)

const patientDataComplete = computed(() => {
  const item = selfStore.item || {}
  return requestedPatientFields.value.every((f) => f.complete(item))
})

// Every field requested for this consultation, plus the conditional details of
// each requested parent. The dialog shows them all (pre-filled with current
// values) so a completed "Données patient" task can be reopened and edited.
const patientDataFields = computed(() => {
  const requestedKeySet = new Set(requestedPatientFields.value.map((f) => f.key))
  return PATIENT_FIELDS.filter(
    (f) => requestedKeySet.has(f.key) || (f.parentKey && requestedKeySet.has(f.parentKey))
  )
})

// Preparation cards: the aggregate "Données patient" card (when any field is
// requested), then one card per requested test, then one per requested document.
const preparationTasks = computed(() => {
  const item = selfStore.item || {}
  const tasks = []
  if (hasPatientDataRequest.value) {
    tasks.push({
      key: 'patientData',
      title: 'Données patient',
      icon: mdiCardAccountDetailsOutline,
      todo: 'Renseignez vos informations administratives et cliniques.',
      completed: patientDataComplete.value,
      action: openPatientDataDialog
    })
  }
  for (const key of requestedTestKeys.value) {
    const test = TESTS_BY_KEY[key]
    if (!test) continue
    tasks.push({
      key: test.key,
      title: test.title,
      icon: test.icon,
      todo: test.todo,
      completed: item[test.scoreKey] != null,
      action: () => openTestDialog(test)
    })
  }
  for (const key of requestedDocumentKeys.value) {
    const doc = DOCUMENTS_BY_KEY[key]
    if (!doc) continue
    tasks.push({
      key: `doc-${doc.key}`,
      title: doc.title,
      icon: doc.icon,
      todo: `Déposez votre document : ${doc.subtitle || doc.title}.`,
      completed: !!item.documents?.[doc.key],
      action: () => openDocumentDialog(doc)
    })
  }
  return tasks
})

const completedTasks = computed(() =>
  preparationTasks.value.filter((task) => task.completed)
)
const todoTasks = computed(() =>
  preparationTasks.value.filter((task) => !task.completed)
)
const completedTasksCount = computed(() => completedTasks.value.length)
const allTasksCompleted = computed(
  () => completedTasksCount.value === preparationTasks.value.length
)

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

// Long French date/time shown in the open panel, e.g. "Mercredi 10 juin à 9h00".
function fullDateTime(activity) {
  const start = dayjs(`${activity.date}T${activity.time || '09:00'}`)
  const text = `${start.format('dddd D MMMM')} à ${start.format('H[h]mm')}`
  return text.charAt(0).toUpperCase() + text.slice(1)
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

// =================== DONNÉES PATIENT FORM GENERATOR ===================
const patientDialogOpen = ref(false)
const patientDialogFields = ref([])
const patientDialogInitial = ref({})
const savingPatientData = ref(false)

function openPatientDataDialog() {
  const item = selfStore.item || {}
  const fields = patientDataFields.value
  patientDialogFields.value = fields
  patientDialogInitial.value = fields.reduce((acc, f) => {
    if (item[f.key] != null) acc[f.key] = item[f.key]
    return acc
  }, {})
  patientDialogOpen.value = true
}

function handlePatientDataSubmit(values) {
  savingPatientData.value = true
  try {
    const update = { ...values }
    if (typeof update.carteVitaleNir === 'string') {
      update.carteVitaleNir = update.carteVitaleNir.replace(/\D/g, '')
    }
    Object.assign(selfStore.item, update)
    patientDialogOpen.value = false
    messagesStore.add({ type: 'success', text: 'Données patient mises à jour' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour' })
  } finally {
    savingPatientData.value = false
  }
}

// =================== TEST (QUESTIONNAIRE) DIALOG ===================
const testDialogOpen = ref(false)
const activeTest = ref(null)
const testDialogAnswers = ref([])
const savingTest = ref(false)

function openTestDialog(test) {
  activeTest.value = test
  testDialogAnswers.value = selfStore.item?.[test.answersKey] || []
  testDialogOpen.value = true
}

function handleTestSubmit({ answers, score }) {
  const test = activeTest.value
  if (!test) return
  savingTest.value = true
  try {
    selfStore.item[test.answersKey] = answers
    selfStore.item[test.scoreKey] = score
    testDialogOpen.value = false
    messagesStore.add({ type: 'success', text: `${test.title} enregistré` })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement du test" })
  } finally {
    savingTest.value = false
  }
}

// =================== DOCUMENT DIALOG ===================
const documentDialogOpen = ref(false)
const activeDocument = ref(null)
const savingDocument = ref(false)

const activeDocumentFile = computed(() =>
  activeDocument.value ? selfStore.item?.documents?.[activeDocument.value.key] || null : null
)

function openDocumentDialog(doc) {
  activeDocument.value = doc
  documentDialogOpen.value = true
}

function handleDocumentSubmit(file) {
  const doc = activeDocument.value
  if (!doc) return
  savingDocument.value = true
  try {
    selfStore.item.documents = { ...(selfStore.item.documents || {}), [doc.key]: file }
    documentDialogOpen.value = false
    messagesStore.add({ type: 'success', text: 'Document enregistré' })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement du document" })
  } finally {
    savingDocument.value = false
  }
}

function handleDocumentRemove() {
  const doc = activeDocument.value
  if (!doc) return
  const next = { ...(selfStore.item.documents || {}) }
  delete next[doc.key]
  selfStore.item.documents = next
  messagesStore.add({ type: 'success', text: 'Document supprimé' })
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
                <div class="d-flex align-center ga-2 text-medium-emphasis" :class="{ 'ml-auto': isPast(activity) }">
                  <v-icon :icon="mdiCalendarBlankOutline" size="18" />
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

              <!-- =================== TÂCHES À COMPLÉTER AVANT LA CONSULTATION =================== -->
              <div v-if="activity.id === nextConsultationId" class="prep-tasks mt-6 mb-6">
                <div class="d-flex align-center justify-space-between ga-2 mb-3">
                  <div class="d-flex align-center ga-2">
                    <v-icon :icon="mdiClipboardCheckOutline" :color="allTasksCompleted ? 'success' : 'primary'"
                      size="20" />
                    <span class="text-body-medium font-weight-bold">À compléter avant votre consultation</span>
                  </div>
                  <v-chip size="small" :color="allTasksCompleted ? 'success' : 'primary'" variant="tonal" label>
                    {{ completedTasksCount }}/{{ preparationTasks.length }}
                  </v-chip>
                </div>

                <p v-if="!allTasksCompleted" class="text-body-small text-medium-emphasis mb-3">
                  Votre médecin vous demande de réaliser ces tâches avant le rendez-vous.
                </p>

                <!-- Completed tasks: compact inline chips -->
                <div v-if="completedTasks.length" class="d-flex flex-wrap ga-2 mb-3">
                  <v-chip v-for="task in completedTasks" :key="task.key" color="success" variant="tonal" size="small"
                    label :prepend-icon="mdiCheckCircleOutline" @click="task.action()">
                    {{ task.title }}
                  </v-chip>
                </div>

                <!-- Remaining tasks: full cards -->
                <div v-for="task in todoTasks" :key="task.key" class="task-row task-todo pa-3 mb-2" role="button"
                  tabindex="0" @click="task.action()" @keydown.enter="task.action()">
                  <div class="d-flex align-center ga-3">
                    <v-avatar class="flex-shrink-0" color="primary" variant="tonal" size="40">
                      <v-icon :icon="task.icon" size="22" />
                    </v-avatar>
                    <div class="task-text flex-grow-1">
                      <div class="text-body-medium font-weight-bold">{{ task.title }}</div>
                      <div class="text-body-small text-medium-emphasis">{{ task.todo }}</div>
                    </div>
                    <v-btn v-if="!mobile" color="primary" variant="flat" rounded="lg" size="small"
                      class="flex-shrink-0 text-none" @click.stop="task.action()">
                      Compléter
                    </v-btn>
                  </div>
                  <v-btn v-if="mobile" block color="primary" variant="flat" rounded="lg" size="small"
                    class="text-none mt-3" @click.stop="task.action()">
                    Compléter
                  </v-btn>
                </div>
              </div>

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
            du {{ fullDateTime(cancelTarget).toLowerCase() }} ?
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

    <!-- Données patient form generator -->
    <FormGeneratorDialog v-model="patientDialogOpen" title="Données patient"
      subtitle="Complétez les informations demandées par votre médecin avant la consultation."
      :fields="patientDialogFields" :initial-values="patientDialogInitial" :loading="savingPatientData"
      @submit="handlePatientDataSubmit" />

    <!-- Test (questionnaire) dialog -->
    <TestDialog v-model="testDialogOpen" :test="activeTest" :initial-answers="testDialogAnswers"
      :loading="savingTest" @submit="handleTestSubmit" />

    <!-- Document upload dialog -->
    <DocumentDialog v-model="documentDialogOpen" :document="activeDocument" :existing="activeDocumentFile"
      :loading="savingDocument" @submit="handleDocumentSubmit" @remove="handleDocumentRemove" />
  </v-row>
</template>

<style scoped>
/* Vuetify defaults to 24px horizontal padding on the title and content;
   trim it down so the panel feels less cramped on the sides. */
:deep(.v-expansion-panel-title) {
  padding-inline: 12px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding-inline: 12px;
}

.task-row {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.task-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.task-row.task-todo {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Let the text column shrink below its content width so a long description
   wraps inside the column instead of dropping under the icon. */
.task-text {
  min-width: 0;
}
</style>
