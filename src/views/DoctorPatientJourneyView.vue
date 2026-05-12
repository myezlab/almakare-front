<script setup>
import patientsData from '@/data/patients.json'
import {
  mdiCalendar,
  mdiCalendarQuestion,
  mdiCheck,
  mdiChevronLeft,
  mdiClockOutline,
  mdiEmailOutline,
  mdiPhoneOutline,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

dayjs.locale('fr')
dayjs.extend(relativeTime)

const route = useRoute()
const router = useRouter()

const STEPS = [
  {
    title: 'Ordonnance du médecin adresseur',
    desc: "Un médecin adresseur complète les données du patient et émet une ordonnance, transmise au médecin spécialiste du sommeil.",
    illustration: 'doctors-orders.svg',
    dayOffset: -18,
    duration: '~ 30 min',
  },
  {
    title: 'Génération de l\'acte',
    desc: "Le médecin spécialiste prend connaissance du dossier et génère l'acte médical correspondant à l'examen.",
    illustration: 'doctor.svg',
    dayOffset: -14,
    duration: '~ 15 min',
  },
  {
    title: 'Planification',
    desc: "Le coordonnateur planifie l'acte dans l'agenda des hospitalisations et propose une date au patient.",
    illustration: 'tasks.svg',
    dayOffset: -10,
    duration: '~ 10 min',
  },
  {
    title: 'Pose des capteurs',
    desc: "Le jour de l'hospitalisation, le technicien accueille le patient et pose les capteurs pour la nuit d'enregistrement.",
    illustration: 'technician.svg',
    dayOffset: -5,
    duration: '~ 45 min',
  },
  {
    title: 'Remontée des données',
    desc: "Au matin, ce même technicien retire les capteurs et remonte les données brutes enregistrées pendant la nuit.",
    illustration: 'details.svg',
    dayOffset: -4,
    duration: '~ 30 min',
  },
  {
    title: 'Rapport technique',
    desc: "Un technicien de prélecture prend le relais. Il analyse les données et produit un rapport technique détaillé.",
    illustration: 'report.svg',
    dayOffset: -2,
    duration: '~ 2 h',
  },
  {
    title: 'Interprétation médicale',
    desc: "Le médecin spécialiste interprète le rapport et pose le diagnostic à partir des résultats de l'acte.",
    illustration: 'doctors.svg',
    dayOffset: 0,
    duration: '~ 30 min',
  },
  {
    title: 'Résultats transmis',
    desc: "Les résultats sont envoyés au médecin adresseur et au patient. Le traitement peut alors être discuté.",
    illustration: 'congratulations.svg',
    dayOffset: null,
    duration: '~ 15 min',
  },
]

const patient = computed(() =>
  patientsData.find((p) => p.id === route.params.id) || null,
)

const currentStep = computed(() => patient.value?.hospitalizationStep || 1)
const currentStepData = computed(() => STEPS[currentStep.value - 1])

const illustrationUrl = computed(() => {
  if (!currentStepData.value) return null
  return new URL(`../assets/illustrations/${currentStepData.value.illustration}`, import.meta.url).href
})

const progressPercent = computed(() => Math.round((currentStep.value / STEPS.length) * 100))

const patientAge = computed(() => {
  if (!patient.value?.birthDate) return null
  return dayjs().diff(dayjs(patient.value.birthDate), 'year')
})

const genderInitial = computed(() => (patient.value?.gender === 'female' ? 'Mme' : 'M.'))

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

        <!-- Header -->
        <div :class="{ 'px-6': $vuetify.display.mobile }" class="mb-6">
          <v-btn :prepend-icon="mdiChevronLeft" variant="text" class="text-none mb-3 ml-n2" @click="router.back()">
            Retour
          </v-btn>

          <template v-if="patient">
            <div class="d-flex align-center ga-4 mb-2">
              <v-avatar color="primary" variant="tonal" size="56">
                <span class="text-title-medium font-weight-bold">
                  {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                </span>
              </v-avatar>
              <div>
                <div class="text-headline-medium font-weight-bold">
                  {{ genderInitial }} {{ patient.firstName }} {{ patient.lastName }}
                </div>
                <div class="text-body-small text-medium-emphasis">
                  {{ patientAge }} ans · Né(e) le
                  {{ dayjs(patient.birthDate).format('DD MMM YYYY') }}
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip :prepend-icon="mdiEmailOutline" variant="tonal" size="small" color="grey">
                {{ patient.email }}
              </v-chip>
              <v-chip :prepend-icon="mdiPhoneOutline" variant="tonal" size="small" color="grey">
                {{ patient.phone }}
              </v-chip>
            </div>
          </template>

          <template v-else>
            <v-alert type="warning" variant="tonal" rounded="lg" class="mt-4">
              Patient introuvable.
            </v-alert>
          </template>
        </div>

        <template v-if="patient">
          <!-- Progress -->
          <v-card class="card-shadow pa-5 rounded-15 mb-4"
            :class="{ 'mx-6': $vuetify.display.mobile }">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing">
                Étape actuelle · {{ currentStep }} sur {{ STEPS.length }}
              </div>
              <div class="text-body-small font-weight-bold text-primary">{{ progressPercent }}%</div>
            </div>
            <v-progress-linear :model-value="progressPercent" color="primary" height="8" rounded />
          </v-card>

          <!-- Current step details -->
          <v-card class="card-shadow pa-6 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <v-row align="center">
              <v-col cols="12" sm="7">
                <v-chip color="primary" variant="tonal" size="small" class="mb-3">
                  Étape {{ currentStep }} · en cours
                </v-chip>
                <div class="text-headline-small font-weight-bold mb-3">{{ currentStepData.title }}</div>
                <div class="text-body-medium text-medium-emphasis mb-3">{{ currentStepData.desc }}</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-if="stepDateInfo(currentStepData).label" :prepend-icon="mdiCalendarQuestion" variant="tonal"
                    size="small" color="grey">
                    <span class="font-italic">{{ stepDateInfo(currentStepData).label }}</span>
                  </v-chip>
                  <v-chip v-else :prepend-icon="mdiCalendar" variant="tonal" size="small" color="grey">
                    <span class="font-weight-medium">{{ stepDateInfo(currentStepData).date }}</span>
                    <span class="ml-1">· {{ stepDateInfo(currentStepData).relative }}</span>
                  </v-chip>
                  <v-chip v-if="currentStepData.duration" :prepend-icon="mdiClockOutline" variant="tonal" size="small"
                    color="grey">
                    {{ currentStepData.duration }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" sm="5" class="text-center">
                <v-img :src="illustrationUrl" :width="180" :height="160" contain class="mx-auto" />
              </v-col>
            </v-row>
          </v-card>

          <!-- Timeline of all steps -->
          <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
              <span class="text-headline-small font-weight-bold">Toutes les étapes</span>
            </v-card-title>
            <v-card-text class="px-4 pt-3">
              <v-timeline side="end" density="compact" align="start" truncate-line="both">
                <v-timeline-item v-for="(step, i) in STEPS" :key="i"
                  :dot-color="i + 1 < currentStep ? 'success' : i + 1 === currentStep ? 'primary' : 'grey-lighten-1'"
                  :icon="i + 1 < currentStep ? mdiCheck : undefined" size="small" fill-dot>
                  <div>
                    <div class="text-body-small font-weight-bold mb-1"
                      :class="{ 'text-primary': i + 1 === currentStep, 'text-medium-emphasis': i + 1 > currentStep }">
                      {{ i + 1 }}. {{ step.title }}
                    </div>
                    <div class="text-body-small text-medium-emphasis mb-2">{{ step.desc }}</div>
                    <div class="d-flex flex-wrap ga-1">
                      <v-chip v-if="stepDateInfo(step).label" :prepend-icon="mdiCalendarQuestion" variant="tonal"
                        size="x-small" color="grey">
                        <span class="font-italic">{{ stepDateInfo(step).label }}</span>
                      </v-chip>
                      <v-chip v-else :prepend-icon="mdiCalendar" variant="tonal" size="x-small" color="grey">
                        <span class="font-weight-medium">{{ stepDateInfo(step).date }}</span>
                        <span class="ml-1">· {{ stepDateInfo(step).relative }}</span>
                      </v-chip>
                      <v-chip v-if="step.duration" :prepend-icon="mdiClockOutline" variant="tonal" size="x-small"
                        color="grey">
                        {{ step.duration }}
                      </v-chip>
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </template>

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
</style>
