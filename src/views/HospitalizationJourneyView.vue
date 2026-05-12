<script setup>
import { useSelfStore } from '@/stores/self'
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiCalendar,
  mdiCalendarQuestion,
  mdiCheck,
  mdiChevronLeft,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

dayjs.locale('fr')
dayjs.extend(relativeTime)

const router = useRouter()
const selfStore = useSelfStore()

const STEPS = [
  {
    title: 'Ordonnance du médecin adresseur',
    desc: "Un médecin adresseur complète vos données et émet une ordonnance, transmise directement à un médecin spécialiste du sommeil.",
    illustration: 'doctors-orders.svg',
    dayOffset: -18,
  },
  {
    title: 'Génération de l\'acte',
    desc: "Le médecin spécialiste prend connaissance de votre dossier et génère l'acte médical correspondant à votre examen.",
    illustration: 'doctor.svg',
    dayOffset: -14,
  },
  {
    title: 'Planification',
    desc: "Le coordonnateur planifie l'acte dans l'agenda des hospitalisations et vous propose une date.",
    illustration: 'tasks.svg',
    dayOffset: -10,
  },
  {
    title: 'Pose des capteurs',
    desc: "Le jour de l'hospitalisation, le technicien vous accueille et pose les capteurs sur votre corps pour la nuit d'enregistrement.",
    illustration: 'technician.svg',
    dayOffset: -5,
  },
  {
    title: 'Remontée des données',
    desc: "Au matin, ce même technicien retire les capteurs et remonte les données brutes enregistrées pendant la nuit.",
    illustration: 'details.svg',
    dayOffset: -4,
  },
  {
    title: 'Rapport technique',
    desc: "Un technicien de prélecture prend le relais. Il analyse les données et produit un rapport technique détaillé.",
    illustration: 'report.svg',
    dayOffset: -2,
  },
  {
    title: 'Interprétation médicale',
    desc: "Le médecin spécialiste interprète le rapport et pose le diagnostic à partir des résultats de l'acte.",
    illustration: 'doctors.svg',
    dayOffset: 0,
  },
  {
    title: 'Résultats transmis',
    desc: "Les résultats sont envoyés à votre médecin adresseur et à vous-même. Vous pouvez alors discuter du traitement.",
    illustration: 'congratulations.svg',
    dayOffset: null,
  },
]

const currentStep = computed({
  get: () => selfStore.item?.hospitalizationStep || 7,
  set: (val) => { selfStore.item.hospitalizationStep = val },
})

const selectedStep = ref(currentStep.value)
watch(currentStep, (val) => { selectedStep.value = val })

const selectedStepData = computed(() => STEPS[selectedStep.value - 1])

const illustrationUrl = computed(
  () => new URL(`../assets/illustrations/${selectedStepData.value.illustration}`, import.meta.url).href,
)

const progressPercent = computed(() => Math.round((currentStep.value / STEPS.length) * 100))

function goPrev() {
  if (currentStep.value > 1) currentStep.value = currentStep.value - 1
}

function goNext() {
  if (currentStep.value < STEPS.length) currentStep.value = currentStep.value + 1
}

function goToStep(n) {
  selectedStep.value = n
}

function stepDateInfo(step) {
  if (step.dayOffset === null || step.dayOffset === undefined) {
    return { label: 'Pas encore planifiée', date: null, relative: null }
  }
  const d = dayjs().add(step.dayOffset, 'day')
  return {
    label: null,
    date: d.format('DD MMM YYYY'),
    relative: d.fromNow(),
  }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mb-16 pb-16 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
        <v-row>

          <!-- Header -->
          <v-col cols="12">
            <div :class="{ 'px-6': $vuetify.display.mobile }">
              <v-btn :prepend-icon="mdiChevronLeft" variant="text" class="text-none mb-3 ml-n2" @click="router.back()">
                Retour
              </v-btn>
              <div class="d-flex align-start justify-space-between ga-3">
                <div>
                  <div class="text-headline-medium font-weight-bold mb-1">Mon parcours d'hospitalisation</div>
                  <div class="text-body-small text-medium-emphasis">
                    Les 8 étapes de votre évaluation pour l'apnée du sommeil
                  </div>
                </div>
                <div class="d-flex ga-1 flex-shrink-0">
                  <v-btn :icon="mdiArrowLeft" variant="tonal" color="primary" size="small" density="comfortable"
                    :disabled="currentStep <= 1" @click="goPrev" />
                  <v-btn :icon="mdiArrowRight" variant="flat" color="primary" size="small" density="comfortable"
                    :disabled="currentStep >= STEPS.length" @click="goNext" />
                </div>
              </div>
            </div>
          </v-col>

          <!-- Progress -->
          <v-col cols="12">
            <v-card class="card-shadow pa-5 rounded-15" :class="{ 'mx-6': $vuetify.display.mobile }">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing">
                  Étape {{ currentStep }} sur {{ STEPS.length }}
                </div>
                <div class="text-body-small font-weight-bold text-primary">{{ progressPercent }}%</div>
              </div>
              <v-progress-linear :model-value="progressPercent" color="primary" height="8" rounded />
            </v-card>
          </v-col>

          <!-- Step details card -->
          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-row align="center">
                <v-col cols="12" sm="7">
                  <v-chip :color="selectedStep === currentStep ? 'primary' : 'grey'" variant="tonal" size="small"
                    class="mb-3">
                    Étape {{ selectedStep }}
                    <span v-if="selectedStep === currentStep" class="ml-1">· en cours</span>
                  </v-chip>
                  <div class="text-headline-small font-weight-bold mb-3">{{ selectedStepData.title }}</div>
                  <div class="text-body-medium text-medium-emphasis">{{ selectedStepData.desc }}</div>
                </v-col>
                <v-col cols="12" sm="5" class="text-center">
                  <v-img :src="illustrationUrl" :width="180" :height="160" contain class="mx-auto" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Timeline of all steps -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold">Toutes les étapes</span>
              </v-card-title>
              <v-card-text class="px-4 pt-3">
                <v-timeline side="end" density="compact" align="start" truncate-line="both">
                  <v-timeline-item v-for="(step, i) in STEPS" :key="i"
                    :dot-color="i + 1 < currentStep ? 'success' : i + 1 === currentStep ? 'primary' : 'grey-lighten-1'"
                    :icon="i + 1 < currentStep ? mdiCheck : undefined" size="small" fill-dot>
                    <div class="cursor-pointer" @click="goToStep(i + 1)">
                      <div class="text-body-small font-weight-bold mb-1"
                        :class="{ 'text-primary': i + 1 === currentStep, 'text-medium-emphasis': i + 1 > currentStep }">
                        {{ i + 1 }}. {{ step.title }}
                      </div>
                      <div class="text-body-small text-medium-emphasis mb-1">{{ step.desc }}</div>
                      <div class="text-body-small text-medium-emphasis text-grey">
                        <template v-if="stepDateInfo(step).label">
                          <v-icon size="x-small" class="mr-1" :icon="mdiCalendarQuestion"></v-icon>
                          <span class="font-italic">{{ stepDateInfo(step).label }}</span>
                        </template>
                        <template v-else>
                          <v-icon size="x-small" class="mr-1" :icon="mdiCalendar"></v-icon>
                          <span class="font-weight-medium">{{ stepDateInfo(step).date }}</span>
                          <span class="ml-1">· {{ stepDateInfo(step).relative }}</span>
                        </template>
                      </div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>

        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.letter-spacing {
  letter-spacing: 0.08em;
}

.gap-2 {
  gap: 8px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
