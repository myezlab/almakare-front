<script setup>
import DateCard from "@/components/DateCard.vue"
import DoctorCard from "@/components/DoctorCard.vue"
import DocumentDialog from "@/components/DocumentDialog.vue"
import FormGeneratorDialog from "@/components/FormGeneratorDialog.vue"
import LocationCard from "@/components/LocationCard.vue"
import ActeProtocolCard from "@/components/monDossier/ActeProtocolCard.vue"
import QuestionnaireResultsDialog from "@/components/QuestionnaireResultsDialog.vue"
import RapportDialog from "@/components/RapportDialog.vue"
import TestDialog from "@/components/TestDialog.vue"
import { ISOToDDMMYYYY, ISOToHHmm, ISOToLongDateTime } from "@/composables/useDates"
import { useProfileHistory } from "@/composables/useProfileHistory"
import { useQuestionnaire } from "@/composables/useQuestionnaire"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES_DATA from "@/data/activities.json"
import { DOCTORS_SEED } from "@/data/doctors"
import { DOCUMENTS_BY_KEY } from "@/data/documents"
import { PATIENT_FIELDS, PATIENT_FIELDS_BY_KEY } from "@/data/patientFields"
import { RAPPORTS_BY_ACTIVITY } from "@/data/rapports"
import { TESTS, TESTS_BY_KEY, evaluateTest } from "@/data/tests"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiCalendarBlankOutline,
  mdiCancel,
  mdiCardAccountDetailsOutline,
  mdiCheck,
  mdiClockOutline,
  mdiClose,
  mdiDoctor,
  mdiFileChartOutline,
  mdiFileDocumentEditOutline,
  mdiOpenInNew,
  mdiPaperclip
} from "@mdi/js"
import dayjs from "dayjs"
import { computed, reactive, ref } from "vue"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { recordProfileChanges } = useProfileHistory()

const openPanels = useUrlPanels("actPanels")

// One live questionnaire per catalog test, sharing the exact logic and data of
// the Questionnaires tab (src/data/tests.js + useQuestionnaire). The questions,
// options, max score and severity bands all come from the test; saving commits
// a { score, date } entry to the test's history and mirrors the latest score
// onto the patient record so prep-task completion stays in sync.
const questionnaireByKey = Object.fromEntries(
  TESTS.map((test) => [
    test.key,
    {
      test,
      instance: reactive(
        useQuestionnaire({
          count: test.questions.length,
          answersKey: test.answersKey,
          scoreKey: test.scoreKey,
          historyKey: `${test.key}History`,
          colorFor: (score) => evaluateTest(test, score).color,
          labelFor: (score) => evaluateTest(test, score).label,
        })
      )
    }
  ])
)

const activities = ref(
  [...ACTIVITIES_DATA].sort((a, b) => (a.startAt < b.startAt ? 1 : a.startAt > b.startAt ? -1 : 0))
)

// Activities come in two flavours: a "consultation" (a visit with the doctor)
// and an "acte" (a medical procedure). The gendered French wording adapts to
// the type; everything else — preparation tasks, calendar export, the cancel
// flow — is shared.
const ACTIVITY_TYPES = {
  consultation: {
    label: "Consultation",
    cancelTitle: "Annuler la consultation",
    cancelledTitle: "Consultation annulée",
    cancelToast: "Consultation annulée"
  },
  acte: {
    label: "Acte",
    cancelTitle: "Annuler l'acte",
    cancelledTitle: "Acte annulé",
    cancelToast: "Acte annulé"
  }
}
function activityMeta(activity) {
  return ACTIVITY_TYPES[activity?.type] || ACTIVITY_TYPES.consultation
}

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

// An activity sits in one of two states based on its end time (startAt → endAt):
// "À venir" as long as it hasn't finished — this covers an acte still running,
// which can take ~12h — and "Passés" once it has finished.
const now = dayjs()
function isUpcoming(activity) {
  return now.isBefore(getEventTimes(activity).end)
}
function isPast(activity) {
  return !isUpcoming(activity)
}
const sections = computed(() => {
  const upcoming = []
  const past = []
  for (const activity of activities.value) {
    if (isUpcoming(activity)) upcoming.push(activity)
    else past.push(activity)
  }
  // soonest upcoming first; past keeps the most recent first
  upcoming.reverse()
  return [
    { key: 'upcoming', title: 'À venir', items: upcoming },
    { key: 'past', title: 'Passés', items: past }
  ].filter((section) => section.items.length > 0)
})

// The soonest upcoming consultation carries the preparation tasks the patient
// must complete beforehand (questionnaires, documents, fields…).
// An activity requests three separate kinds of preparation, each its own
// array on the activity:
//   `requestedFields`    — patient-data field keys (see src/data/patientFields.js),
//                          gathered into a single "Données patient" card.
//   `requestedTests`     — test keys (see src/data/tests.js), one card each.
//   `requestedDocuments` — document keys (see src/data/documents.js), one card each.

// Requested fields that drive completion (the primary, non-conditional ones).
function requestedPatientFields(activity) {
  return (activity?.requestedFields || [])
    .map((k) => PATIENT_FIELDS_BY_KEY[k])
    .filter((f) => f && f.complete)
}

// Every field requested for this activity OR already filled by the patient,
// plus the conditional details of each included parent. Showing already-filled
// fields (even when this activity didn't request them) keeps existing data
// visible and editable in the dialog.
function patientDataFields(activity) {
  const item = selfStore.item || {}
  const requestedKeySet = new Set(requestedPatientFields(activity).map((f) => f.key))
  const includedKeys = new Set(
    PATIENT_FIELDS.filter(
      (f) => f.complete && (requestedKeySet.has(f.key) || f.complete(item))
    ).map((f) => f.key)
  )
  return PATIENT_FIELDS.filter(
    (f) => includedKeys.has(f.key) || (f.parentKey && includedKeys.has(f.parentKey))
  )
}

// Preparation cards for a single activity: the aggregate "Données patient" card
// (when any field is requested), then one card per requested test, then one per
// requested document. Returns [] when the activity requests nothing.
function buildPreparationTasks(activity) {
  const item = selfStore.item || {}
  const tasks = []
  const fields = requestedPatientFields(activity)
  if (fields.length) {
    tasks.push({
      key: 'patientData',
      title: 'Formulaire',
      icon: mdiCardAccountDetailsOutline,
      todo: 'Renseignez vos informations administratives et cliniques.',
      completed: fields.every((f) => f.complete(item)),
      action: () => openPatientDataDialog(activity)
    })
  }
  for (const key of activity?.requestedTests || []) {
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
  for (const key of activity?.requestedDocuments || []) {
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
}

// Preparation is attached to EVERY upcoming activity that requests something
// (not just the soonest), keyed by activity id. Each entry pre-splits
// the tasks into completed/todo and carries the progress counters the header shows.
const prepByActivity = computed(() => {
  const map = {}
  for (const activity of activities.value) {
    if (!isUpcoming(activity)) continue
    const tasks = buildPreparationTasks(activity)
    if (!tasks.length) continue
    const completed = tasks.filter((task) => task.completed)
    const todo = tasks.filter((task) => !task.completed)
    map[activity.id] = {
      tasks,
      completed,
      todo,
      completedCount: completed.length,
      total: tasks.length,
      allCompleted: completed.length === tasks.length
    }
  }
  return map
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
  return isPast(activity) && !isCancelled(activity)
}

// The Annuler / Confirmer pair is offered while the consultation is upcoming
// and the patient hasn't confirmed yet.
function canConfirmOrCancel(activity) {
  return (
    isUpcoming(activity) &&
    !isCancelled(activity) &&
    !confirmedIds.value.has(activity.id)
  )
}

// On mobile the header buttons only show while collapsed (they move to the
// panel bottom once expanded). On desktop they stay pinned in the header.
function showHeaderActions(activity) {
  return canConfirmOrCancel(activity) && !openPanels.value.includes(activity.id)
}

function confirmAttendance(activity) {
  // Block confirmation until every requested preparation task is done.
  const prep = prepByActivity.value[activity.id]
  if (prep && !prep.allCompleted) {
    // Open the panel so the remaining tasks are visible to the patient.
    if (!openPanels.value.includes(activity.id)) {
      openPanels.value = [...openPanels.value, activity.id]
    }
    messagesStore.add({
      type: 'info',
      text: 'Veuillez compléter toutes les informations demandées avant de confirmer votre rendez-vous.'
    })
    return
  }
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
    const target = cancelTarget.value
    if (target) {
      cancelledIds.value = new Set([...cancelledIds.value, target.id])
      const next = new Set(confirmedIds.value)
      next.delete(target.id)
      confirmedIds.value = next
    }
    messagesStore.add({ type: 'success', text: activityMeta(target).cancelToast })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'annulation" })
  } finally {
    cancelling.value = false
    showCancelDialog.value = false
    cancelTarget.value = null
  }
}

function getEventTimes(activity) {
  const start = dayjs(activity.startAt)
  return { start, end: activity.endAt ? dayjs(activity.endAt) : start.add(30, 'minute') }
}

// Long French date/time shown in the open panel, e.g. "Mercredi 10 juin à 9h00".
function fullDateTime(activity) {
  return ISOToLongDateTime(activity.startAt)
}

function calendarTitle(activity) {
  return `${activity.title} — ${activity.doctor}`
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
  link.download = `${activity.title}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

// =================== DONNÉES PATIENT FORM GENERATOR ===================
const patientDialogOpen = ref(false)
const patientDialogFields = ref([])
const patientDialogInitial = ref({})
const savingPatientData = ref(false)

function openPatientDataDialog(activity) {
  const item = selfStore.item || {}
  const fields = patientDataFields(activity)
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
    // Snapshot before applying so the change is logged to the "Historique des
    // modifications" of both Données générales and Données cliniques, just as
    // editing from the Mon dossier tab does.
    const beforeItem = { ...selfStore.item }
    Object.assign(selfStore.item, update)
    recordProfileChanges(beforeItem)
    patientDialogOpen.value = false
    messagesStore.add({ type: 'success', text: 'Mes données mises à jour' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour' })
  } finally {
    savingPatientData.value = false
  }
}

// =================== TEST (QUESTIONNAIRE) DIALOG ===================
const testDialogOpen = ref(false)
const activeTestKey = ref(null)
const activeQuestionnaire = computed(() =>
  activeTestKey.value ? questionnaireByKey[activeTestKey.value] : null
)

function openTestDialog(test) {
  activeTestKey.value = test.key
  testDialogOpen.value = true
}

// Save commits the completed questionnaire to its history (mirroring the latest
// score), clears the form, closes the dialog and reveals the result.
function handleTestSave() {
  const q = activeQuestionnaire.value
  if (!q) return
  q.instance.save()
  q.instance.reset()
  testDialogOpen.value = false
  openTestResults(q.test.key)
}

// =================== TEST RESULTS DIALOG ===================
// Shared results/history view, identical to the Questionnaires tab.
const resultsKey = ref(null)
const resultsOpen = computed({
  get: () => resultsKey.value !== null,
  set: (val) => {
    if (!val) resultsKey.value = null
  }
})
const resultsQuestionnaire = computed(() =>
  resultsKey.value ? questionnaireByKey[resultsKey.value] : null
)
const resultsTitle = computed(() => resultsQuestionnaire.value?.test.title || '')
const resultsMaxScore = computed(() => resultsQuestionnaire.value?.test.maxScore || 0)
const resultsHistory = computed(() => resultsQuestionnaire.value?.instance.history || [])
const resultsColorFor = computed(() =>
  resultsQuestionnaire.value ? resultsQuestionnaire.value.instance.colorFor : () => 'primary'
)
const resultsLabelFor = computed(() =>
  resultsQuestionnaire.value ? resultsQuestionnaire.value.instance.labelFor : () => ''
)

function openTestResults(key) {
  resultsKey.value = key
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

// =================== COMPTE RENDU (free-text report) ===================
// The activity's free-text compte rendu: the card shows a one-line teaser,
// "Voir" opens the full text in a dialog.
const compteRenduDialogOpen = ref(false)
const activeCompteRendu = ref(null)

function openCompteRendu(activity) {
  if (!activity.report) return
  activeCompteRendu.value = activity
  compteRenduDialogOpen.value = true
}

// =================== RAPPORT (medical report document) ===================
// A past activity's rapport is the downloadable counterpart of its "Compte
// rendu"; it is also retrievable from the Documents tab "Rapports" panel.
const rapportDialogOpen = ref(false)
const activeRapport = ref(null)

function rapportFor(activity) {
  return RAPPORTS_BY_ACTIVITY[activity.id] || null
}

function openRapport(activity) {
  const rapport = rapportFor(activity)
  if (!rapport) return
  activeRapport.value = rapport
  rapportDialogOpen.value = true
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
                    {{ activity.title }}
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
                  {{ ISOToDDMMYYYY(activity.startAt) }}
                  <v-icon :icon="mdiClockOutline" size="14" />
                  {{ ISOToHHmm(activity.startAt) }}
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
              <div v-else class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-center flex-wrap ga-2">
                  <span class="panel-title"
                    :class="{ 'text-decoration-line-through text-medium-emphasis': isCancelled(activity) }">
                    {{ activity.title }}
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
                </div>
                <span v-if="!openPanels.includes(activity.id)"
                  class="d-flex align-center flex-wrap ga-1 text-body-medium text-medium-emphasis mt-1">
                  <v-avatar size="20" color="primary" class="mr-1">
                    <v-img v-if="getDoctor(activity)?.avatarUrl" :src="getDoctor(activity).avatarUrl"
                      :alt="activity.doctor" />
                    <v-icon v-else :icon="mdiDoctor" size="14" />
                  </v-avatar>
                  {{ activity.doctor }} •
                  <v-icon :icon="mdiCalendarBlankOutline" size="16" />
                  {{ ISOToDDMMYYYY(activity.startAt) }}
                  <v-icon :icon="mdiClockOutline" size="16" />
                  {{ ISOToHHmm(activity.startAt) }}
                </span>
              </div>
              <div v-if="!mobile && canConfirmOrCancel(activity)" class="d-flex align-center ga-1 mr-2" @click.stop>
                <v-btn color="error" variant="tonal" rounded="lg" size="small" class="text-none"
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

              <!-- =================== DOCTOR / LOCATION / DATE CARDS ===================
                   Desktop: doctor spans the full width, location and date share
                   the row below (6/6). Mobile: each card stacks full width. -->
              <v-row density="compact" class="mb-3">
                <v-col v-if="getDoctor(activity)" cols="12">
                  <DoctorCard :doctor="getDoctor(activity)" :name="activity.doctor" />
                </v-col>
                <v-col cols="12" md="6">
                  <LocationCard :location-name="activity.locationName" class="h-100" />
                </v-col>
                <v-col cols="12" md="6">
                  <DateCard :start-at="activity.startAt" :upcoming="isUpcoming(activity)" class="h-100"
                    @google="addToGoogle(activity)" @outlook="addToOutlook(activity)" @ical="downloadIcs(activity)" />
                </v-col>
              </v-row>

              <!-- =================== COMPTE RENDU + RAPPORT (not shown while upcoming) ===================
                   Two warning cards side by side (6/6 on desktop, stacked on
                   mobile): the free-text compte rendu, and the rapport document
                   (also retrievable from the Documents tab "Rapports" panel). -->
              <v-row v-if="isPast(activity)" density="compact">
                <v-col cols="12" md="6">
                  <v-card variant="tonal" color="warning" rounded="lg"
                    class="h-100 pa-3 d-flex flex-column justify-center">
                    <div class="d-flex align-center ga-3">
                      <v-icon v-if="!mobile" :icon="mdiFileDocumentEditOutline" color="warning" size="24"
                        class="flex-shrink-0" />
                      <div class="flex-grow-1" style="min-width: 0">
                        <div class="text-body-medium font-weight-bold">Compte rendu</div>
                        <div v-if="activity.report" class="text-body-small text-medium-emphasis text-truncate">
                          {{ activity.report }}
                        </div>
                        <div v-else class="text-body-small text-medium-emphasis">
                          Aucun compte rendu renseigné pour ce rendez-vous.
                        </div>
                      </div>
                      <v-btn v-if="activity.report" color="warning" :icon="mobile" flat rounded="lg" size="small"
                        class="text-none flex-shrink-0" @click="openCompteRendu(activity)">
                        <v-icon v-if="mobile" :icon="mdiOpenInNew" />
                        <template v-if="!mobile">Voir</template>
                      </v-btn>
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="tonal" color="warning" rounded="lg"
                    class="h-100 pa-3 d-flex flex-column justify-center">
                    <div class="d-flex align-center ga-3">
                      <v-icon v-if="!mobile" :icon="mdiFileChartOutline" color="warning" size="24"
                        class="flex-shrink-0" />
                      <div class="flex-grow-1" style="min-width: 0">
                        <div class="text-body-medium font-weight-bold">Rapport</div>
                        <div v-if="rapportFor(activity)"
                          class="d-flex align-center ga-1 text-body-small text-medium-emphasis">
                          <v-icon :icon="mdiPaperclip" size="14" class="flex-shrink-0" />
                          <span class="text-truncate">{{ rapportFor(activity).name }}</span>
                        </div>
                        <div v-else class="text-body-small text-medium-emphasis">
                          Aucun rapport disponible pour le moment.
                        </div>
                      </div>
                      <v-btn v-if="rapportFor(activity)" color="warning" :icon="mobile" flat rounded="lg" size="small"
                        class="text-none flex-shrink-0" @click="openRapport(activity)">
                        <v-icon v-if="mobile" :icon="mdiOpenInNew" />
                        <template v-if="!mobile">Ouvrir</template>
                      </v-btn>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- =================== TÂCHES À COMPLÉTER AVANT LE RENDEZ-VOUS =================== -->
              <div v-if="prepByActivity[activity.id]" class="prep-tasks mt-6 mb-6">
                <div class="d-flex align-center justify-space-between ga-2 mb-3">
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-medium font-weight-bold">
                      {{ prepByActivity[activity.id].allCompleted
                        ? 'Tout est prêt pour votre rendez-vous'
                        : 'À compléter avant de pouvoir confirmer votre rendez-vous' }}
                    </span>
                  </div>
                  <v-chip size="small" :color="prepByActivity[activity.id].allCompleted ? 'success' : 'primary'"
                    variant="tonal" label>
                    {{ prepByActivity[activity.id].completedCount }}/{{ prepByActivity[activity.id].total }}
                  </v-chip>
                </div>

                <p v-if="!prepByActivity[activity.id].allCompleted" class="text-body-small text-medium-emphasis mb-3">
                  Votre médecin vous demande de réaliser ces tâches avant le rendez-vous.
                </p>

                <!-- Completed tasks: compact inline chips -->
                <div v-if="prepByActivity[activity.id].completed.length" class="d-flex flex-wrap ga-2 mb-3">
                  <v-chip v-for="task in prepByActivity[activity.id].completed" :key="task.key" variant="text"
                    size="small" rounded="pill" class="border-light" @click="task.action()">
                    <template #append>
                      <v-icon :icon="mdiCheck" color="success" size="18" class="ml-1" />
                    </template>
                    {{ task.title }}
                  </v-chip>
                </div>

                <!-- Remaining tasks: full cards (same structure as the Lieu / Date cards) -->
                <v-card v-for="task in prepByActivity[activity.id].todo" :key="task.key" variant="tonal" color="primary"
                  rounded="lg" class="pa-3 mb-2 d-flex flex-column justify-center">
                  <div class="d-flex align-center ga-3">
                    <v-icon v-if="!mobile" :icon="task.icon" color="primary" size="24" class="flex-shrink-0" />
                    <div class="flex-grow-1" style="min-width: 0">
                      <div class="text-body-medium font-weight-bold">{{ task.title }}</div>
                      <div class="text-body-small text-medium-emphasis">{{ task.todo }}</div>
                    </div>
                    <v-btn color="primary" :icon="mobile" flat rounded="lg" size="small" class="text-none flex-shrink-0"
                      @click.stop="task.action()">
                      <v-icon v-if="mobile" :icon="task.icon" />
                      <template v-if="!mobile">Compléter</template>
                    </v-btn>
                  </div>
                </v-card>
              </div>

              <!-- =================== DÉROULÉ DE L'ACTE ===================
                   Step-by-step progress of a medical procedure, attached to the
                   acte via its `protocol` payload (only an acte carries it). -->
              <ActeProtocolCard v-if="activity.protocol" :protocol="activity.protocol" class="mt-3" />

              <!-- =================== CANCELLED STATUS =================== -->
              <v-alert v-if="isCancelled(activity)" type="error" variant="tonal" :icon="mdiCancel" density="comfortable"
                rounded="lg" class="mt-3">
                <div class="text-body-medium font-weight-bold">{{ activityMeta(activity).cancelledTitle }}</div>
                <div class="text-body-small text-medium-emphasis">
                  Ce rendez-vous a été annulé. Pensez à reprendre rendez-vous si nécessaire.
                </div>
              </v-alert>

              <!-- =================== CANCEL / CONFIRM CONSULTATION ===================
                   Desktop keeps these in the header (see canConfirmOrCancel); they
                   only live at the bottom on mobile, or on desktop once confirmed
                   so the patient can still cancel after confirming. -->
              <!-- Once confirmed, only a discreet centered Annuler remains. -->
              <div v-if="confirmedIds.has(activity.id) && isUpcoming(activity) && !isCancelled(activity)"
                class="d-flex justify-center">
                <v-btn color="error" variant="text" rounded="lg" size="small" class="text-none"
                  @click="askCancel(activity)">
                  Annuler
                </v-btn>
              </div>
              <!-- Mobile, not yet confirmed: full-width half/half Annuler + Confirmer. -->
              <v-row v-else-if="mobile && isUpcoming(activity) && !isCancelled(activity)" no-gutters class="mt-4">
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

            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>

    <!-- Cancel confirm dialog -->
    <v-dialog v-model="showCancelDialog" max-width="380">
      <v-card class="card-shadow rounded-15">
        <v-card-title class="pa-4">{{ activityMeta(cancelTarget).cancelTitle }}</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <template v-if="cancelTarget">
            Êtes-vous sûr de vouloir annuler le rendez-vous
            <strong>{{ cancelTarget.title }}</strong>
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
            {{ activityMeta(cancelTarget).cancelTitle }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Données patient form generator -->
    <FormGeneratorDialog v-model="patientDialogOpen" title="Formulaire"
      subtitle="Complétez les informations demandées par votre médecin avant la consultation."
      :fields="patientDialogFields" :initial-values="patientDialogInitial" :loading="savingPatientData"
      @submit="handlePatientDataSubmit" />

    <!-- Test (questionnaire) dialog -->
    <TestDialog v-model="testDialogOpen" :test="activeQuestionnaire?.test || null"
      :instance="activeQuestionnaire?.instance || null" @save="handleTestSave"
      @results="openTestResults(activeTestKey)" />

    <!-- Test results / history dialog -->
    <QuestionnaireResultsDialog v-model="resultsOpen" :title="resultsTitle" :max-score="resultsMaxScore"
      :history="resultsHistory" :color-for="resultsColorFor" :label-for="resultsLabelFor" />

    <!-- Document upload dialog -->
    <DocumentDialog v-model="documentDialogOpen" :document="activeDocument" :existing="activeDocumentFile"
      :loading="savingDocument" @submit="handleDocumentSubmit" @remove="handleDocumentRemove" />

    <!-- Compte rendu (free-text) dialog -->
    <v-dialog v-model="compteRenduDialogOpen" :fullscreen="mobile" :max-width="mobile ? undefined : 640" scrollable>
      <v-card v-if="activeCompteRendu" class="card-shadow" :class="{ 'rounded-15': !mobile }">
        <v-card-item class="pa-4">
          <template #prepend>
            <div class="cr-icon" aria-hidden="true">
              <v-icon :icon="mdiFileDocumentEditOutline" size="24" />
            </div>
          </template>
          <v-card-title class="text-headline-small font-weight-bold text-wrap">Compte rendu</v-card-title>
          <v-card-subtitle class="text-body-medium text-medium-emphasis text-wrap mt-1">
            {{ activeCompteRendu.doctor }} — {{ fullDateTime(activeCompteRendu) }}
          </v-card-subtitle>
          <template #append>
            <v-btn :icon="mdiClose" variant="text" density="comfortable" aria-label="Fermer"
              @click="compteRenduDialogOpen = false" />
          </template>
        </v-card-item>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="text-body-medium cr-body">{{ activeCompteRendu.report }}</div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="compteRenduDialogOpen = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rapport preview / download dialog -->
    <RapportDialog v-model="rapportDialogOpen" :rapport="activeRapport" />
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

.cr-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

.cr-body {
  white-space: pre-line;
  line-height: 1.6;
}
</style>
