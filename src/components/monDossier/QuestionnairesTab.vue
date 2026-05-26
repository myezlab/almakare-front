<script setup>
import { useUrlPanels } from "@/composables/useUrlPanels"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { computed, ref, watch } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const currentUser = computed(() => selfStore.item || {})

const openPanels = useUrlPanels("qPanels")

const QUESTIONS = [
  'Pendant que vous êtes occupé à lire un document',
  'Devant la télévision ou au cinéma',
  "Assis inactif dans un lieu public (salle d'attente, théâtre, …)",
  "Passager, depuis au moins une heure sans interruptions, d'une voiture ou d'un transport en commun (train, bus, avion, …)",
  'Allongé pour une sieste, lorsque les circonstances le permettent',
  'En position assise au cours d\'une conversation (ou au téléphone) avec un proche',
  'Tranquillement assis à table à la fin d\'un repas sans alcool',
  "Au volant d'une voiture immobilisée depuis quelques minutes dans un embouteillage",
]

const ANSWER_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Faible chance' },
  { value: 2, label: 'Modérée' },
  { value: 3, label: 'Forte chance' },
]

const answers = ref([null, null, null, null, null, null, null, null])

watch(
  () => selfStore.item?.epworthAnswers,
  (val) => {
    if (Array.isArray(val) && val.length === 8) {
      answers.value = [...val]
    }
  },
  { immediate: true },
)

const epworthScore = computed(() => {
  if (answers.value.some((v) => v === null)) return null
  return answers.value.reduce((sum, v) => sum + v, 0)
})

const scoreColor = computed(() => {
  if (epworthScore.value === null) return 'primary'
  if (epworthScore.value <= 10) return 'success'
  if (epworthScore.value <= 15) return 'warning'
  return 'error'
})

const scoreLabel = computed(() => {
  if (epworthScore.value === null) return ''
  if (epworthScore.value <= 10) return 'Somnolence normale'
  if (epworthScore.value <= 15) return 'Somnolence modérée'
  return 'Somnolence sévère'
})

const summaryChipColor = computed(() => {
  const score = currentUser.value?.epworthScore
  if (score == null) return 'primary'
  if (score <= 10) return 'success'
  if (score <= 15) return 'warning'
  return 'error'
})

const summaryChipLabel = computed(() => {
  const score = currentUser.value?.epworthScore
  if (score == null) return ''
  if (score <= 10) return 'Somnolence normale'
  if (score <= 15) return 'Somnolence modérée'
  return 'Somnolence sévère'
})

async function selectAnswer(questionIndex, value) {
  const newAnswers = [...answers.value]
  newAnswers[questionIndex] = value
  answers.value = newAnswers

  try {
    const score = newAnswers.every((v) => v !== null)
      ? newAnswers.reduce((sum, v) => sum + v, 0)
      : null
    if (score !== null) selfStore.item.epworthScore = score
    selfStore.item.epworthAnswers = newAnswers
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement du test" })
  }
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-expansion-panels v-model="openPanels" multiple variant="accordion" flat class="pa-2">
          <v-expansion-panel value="epworth" rounded="lg">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-grow-1">
                <span class="panel-title">Test d'Epworth</span>
                <v-chip v-if="currentUser.epworthScore != null && !$vuetify.display.mobile" :color="summaryChipColor"
                  variant="tonal" size="small" class="ml-2">
                  {{ summaryChipLabel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-medium text-medium-emphasis mb-4 pt-2">
                Évaluez votre tendance à vous endormir dans différentes situations de la vie quotidienne.
                Pour chaque question, indiquez la probabilité que vous vous endormiez.
              </div>

              <div v-if="selfStore.item.id">
                <v-card v-for="(question, i) in QUESTIONS" :key="i" class="mb-3 py-4" flat rounded="lg">
                  <div class="text-body-medium font-weight-medium mb-3">
                    <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
                    {{ question }}
                  </div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn v-for="option in ANSWER_OPTIONS" :key="option.value"
                      :color="answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
                      size="small" class="text-none" :class="{ 'border-light': answers[i] !== option.value }"
                      @click="selectAnswer(i, option.value)">
                      {{ option.label }}
                    </v-btn>
                  </div>
                </v-card>

                <v-card v-if="epworthScore !== null" flat color="success" class="mt-4 pa-6 rounded-lg text-center"
                  :style="`border-top: 4px solid rgb(var(--v-theme-${scoreColor}))`" variant="outlined">
                  <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing mb-3">
                    Score total
                  </div>
                  <div :class="`text-display-small font-weight-bold text-${scoreColor}`">{{ epworthScore }}<span
                      class="text-title-large text-medium-emphasis"> / 24</span></div>
                  <v-chip :color="scoreColor" variant="tonal" rounded="pill" size="small" class="mt-3">
                    {{ scoreLabel }}
                  </v-chip>
                </v-card>

                <div v-else class="text-center text-body-medium text-medium-emphasis mt-4">
                  {{answers.filter(v => v !== null).length}} / 8
                </div>
              </div>

              <div v-else>
                <v-card v-for="i in 8" :key="i" class="mb-3 pa-4" variant="outlined" rounded="lg">
                  <v-skeleton-loader type="text" class="mb-3" />
                  <div class="d-flex ga-2">
                    <v-skeleton-loader v-for="j in 4" :key="j" type="chip" />
                  </div>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}
</style>
