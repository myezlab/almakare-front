<script setup>
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES from "@/data/activities.json"
import { useSelfStore } from "@/stores/self"
import {
  mdiCalendarBlankOutline,
  mdiCheckCircleOutline,
  mdiClipboardPulseOutline,
  mdiClockOutline,
  mdiFileDocumentEditOutline,
  mdiMapMarkerOutline,
  mdiMoonWaningCrescent,
} from "@mdi/js"
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()
const router = useRouter()
const selfStore = useSelfStore()

const openPanels = useUrlPanels("actPanels")

const lastActivityId = computed(() => ACTIVITIES[0]?.id || null)
const secondActivityId = computed(() => ACTIVITIES[1]?.id || null)

const epworthCompleted = computed(() => selfStore.item?.epworthScore != null)
const sleepDiaryStarted = computed(() => (selfStore.item?.sleepDiaryEntries || []).length > 0)

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

          <v-expansion-panel v-for="activity in ACTIVITIES" :key="activity.id" :value="activity.id">
            <v-expansion-panel-title>
              <div v-if="mobile" class="d-flex flex-column flex-grow-1">
                <span class="panel-title">{{ activity.type }}</span>
                <span class="text-body-small text-medium-emphasis mt-1">
                  {{ activity.doctor }} - {{ ISOToDDMMYYYY(activity.date) }}
                </span>
              </div>
              <div v-else class="d-flex align-center flex-wrap ga-2 flex-grow-1">
                <span class="panel-title">{{ activity.type }}</span>
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

            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>
</template>
