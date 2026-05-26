<script setup>
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES_DATA from "@/data/activities.json"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiCalendarBlankOutline,
  mdiCancel,
  mdiCheckCircleOutline,
  mdiClipboardPulseOutline,
  mdiClockOutline,
  mdiFileDocumentEditOutline,
  mdiMapMarkerOutline,
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

const lastActivityId = computed(() => activities.value[0]?.id || null)
const secondActivityId = computed(() => activities.value[1]?.id || null)

const epworthCompleted = computed(() => selfStore.item?.epworthScore != null)
const sleepDiaryStarted = computed(() => (selfStore.item?.sleepDiaryEntries || []).length > 0)

const today = dayjs().startOf('day')
function isUpcoming(activity) {
  return dayjs(activity.date).isSame(today) || dayjs(activity.date).isAfter(today)
}

const showCancelDialog = ref(false)
const cancelTarget = ref(null)
const cancelling = ref(false)
const confirmedIds = ref(new Set())
const cancelledIds = ref(new Set())

function isCancelled(activity) {
  return activity.cancelled === true || cancelledIds.value.has(activity.id)
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

function goToEpworth() {
  router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })
}

function goToSleepDiary() {
  router.push({ name: 'SleepDiary' })
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow pa-2"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <v-expansion-panel v-for="activity in activities" :key="activity.id" :value="activity.id">
            <v-expansion-panel-title>
              <div v-if="mobile" class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-center ga-2">
                  <span class="panel-title" :class="{ 'text-decoration-line-through text-medium-emphasis': isCancelled(activity) }">
                    {{ activity.type }}
                  </span>
                  <v-chip v-if="isCancelled(activity)" color="error" size="x-small" variant="tonal" label>
                    Annulée
                  </v-chip>
                  <v-chip v-else-if="!isUpcoming(activity)" color="primary" size="x-small" variant="tonal" label>
                    Effectuée
                  </v-chip>
                  <v-chip v-else-if="confirmedIds.has(activity.id)" color="success" size="x-small" variant="tonal" label>
                    Confirmée
                  </v-chip>
                </div>
                <span class="text-body-small text-medium-emphasis mt-1">
                  {{ activity.doctor }} - {{ ISOToDDMMYYYY(activity.date) }}
                </span>
              </div>
              <div v-else class="d-flex align-center flex-wrap ga-2 flex-grow-1">
                <span class="panel-title" :class="{ 'text-decoration-line-through text-medium-emphasis': isCancelled(activity) }">
                  {{ activity.type }}
                </span>
                <v-chip v-if="isCancelled(activity)" color="error" size="x-small" variant="tonal" label>
                  Annulée
                </v-chip>
                <v-chip v-else-if="!isUpcoming(activity)" color="primary" size="x-small" variant="tonal" label>
                  Effectuée
                </v-chip>
                <v-chip v-else-if="confirmedIds.has(activity.id)" color="success" size="x-small" variant="tonal" label>
                  Confirmée
                </v-chip>
                <span class="text-medium-emphasis">•</span>
                <span class="text-body-medium">{{ activity.doctor }}</span>
                <span class="text-medium-emphasis">•</span>
                <span class="text-body-medium text-medium-emphasis">{{ ISOToDDMMYYYY(activity.date) }}</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>

              <!-- =================== TYPE + DATE/TIME ROW =================== -->
              <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
                <div class="d-flex align-center ga-2">
                  <v-icon :icon="mdiCalendarBlankOutline" size="20" class="text-medium-emphasis" />
                  <span class="text-title-medium font-weight-bold">{{ activity.type }}</span>
                </div>
                <div class="d-flex align-center ga-2 text-medium-emphasis">
                  <span class="text-body-medium font-weight-medium">{{ ISOToDDMMYYYY(activity.date) }}</span>
                  <v-icon :icon="mdiClockOutline" size="16" />
                  <span class="text-body-medium font-weight-medium">{{ activity.time }}</span>
                </div>
              </div>

              <!-- =================== LOCATION =================== -->
              <v-alert type="info" variant="tonal" :icon="mdiMapMarkerOutline" density="comfortable" class="mb-3"
                rounded="lg">
                <div class="text-body-medium font-weight-medium">{{ activity.locationName }}</div>
                <div class="text-body-small text-medium-emphasis">Type consultation : Cabinet</div>
              </v-alert>

              <!-- =================== RAPPORT MÉDECIN =================== -->
              <v-alert v-if="activity.report" type="warning" variant="tonal" :icon="mdiFileDocumentEditOutline"
                density="comfortable" rounded="lg">
                <div class="text-body-small font-weight-bold mb-1">Rapport médecin</div>
                <div class="text-body-medium">{{ activity.report }}</div>
              </v-alert>

              <v-alert v-else type="warning" variant="tonal" :icon="mdiFileDocumentEditOutline" density="comfortable"
                rounded="lg">
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
              <v-alert v-if="isCancelled(activity)" type="error" variant="tonal" :icon="mdiCancel"
                density="comfortable" rounded="lg" class="mt-3">
                <div class="text-body-medium font-weight-bold">Consultation annulée</div>
                <div class="text-body-small text-medium-emphasis">
                  Cette consultation a été annulée. Pensez à reprendre rendez-vous si nécessaire.
                </div>
              </v-alert>

              <!-- =================== CANCEL / CONFIRM CONSULTATION =================== -->
              <div v-if="isUpcoming(activity) && !isCancelled(activity)" class="d-flex justify-end align-center ga-2 mt-4">
                <v-btn color="error" variant="text" rounded="lg" size="small" class="text-none"
                  @click="askCancel(activity)">
                  Annuler la consultation
                </v-btn>
                <v-btn color="success" variant="flat" rounded="lg" size="small" class="text-none"
                  :disabled="confirmedIds.has(activity.id)" @click="confirmAttendance(activity)">
                  {{ confirmedIds.has(activity.id) ? 'Présence confirmée' : 'Je confirme ma présence' }}
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
