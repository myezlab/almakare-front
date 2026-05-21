<script setup>
import { usePatientActesStore } from '@/stores/patientActes'
import { useTeamStore } from '@/stores/team'
import {
  mdiAlertOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiCalendar,
  mdiCalendarQuestion,
  mdiCashMultiple,
  mdiCheck,
  mdiCheckCircleOutline,
  mdiChevronLeft,
  mdiClockOutline,
  mdiCreditCardOutline,
  mdiDoctor,
  mdiFileDocumentOutline,
  mdiHospitalBuilding,
  mdiInformationOutline,
  mdiMapMarkerOutline,
  mdiPlaylistCheck,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

dayjs.extend(relativeTime)
dayjs.locale('fr')

const route = useRoute()
const router = useRouter()
const patientActesStore = usePatientActesStore()
const teamStore = useTeamStore()

const acteId = computed(() => route.params.id)
const acte = computed(() => patientActesStore.getActe(acteId.value))
const doctor = computed(() => {
  if (!acte.value) return null
  return teamStore.items.find((m) => m.id === acte.value.doctorId) || null
})

const totalSteps = computed(() => acte.value?.steps?.length || 0)
const currentStep = computed({
  get: () => acte.value?.currentStep || 1,
  set: (val) => {
    if (!acte.value) return
    patientActesStore.setCurrentStep(acte.value.id, val)
  },
})

const progressPercent = computed(() => {
  if (!totalSteps.value) return 0
  return Math.round((currentStep.value / totalSteps.value) * 100)
})

const statusLabel = computed(() => {
  if (!acte.value) return ''
  if (acte.value.status === 'in-progress') return 'En cours'
  if (acte.value.status === 'completed') return 'Terminé'
  if (acte.value.status === 'planned') return 'Planifié'
  return acte.value.status
})

const statusColor = computed(() => {
  if (!acte.value) return 'grey'
  if (acte.value.status === 'in-progress') return 'primary'
  if (acte.value.status === 'completed') return 'success'
  return 'grey'
})

const TABS = [
  { value: 'details', label: 'Détails', icon: mdiInformationOutline },
  { value: 'etapes', label: 'Étapes', icon: mdiPlaylistCheck },
  { value: 'paiement', label: 'Paiement', icon: mdiCreditCardOutline },
]
const activeTab = ref(route.query.tab && TABS.some((t) => t.value === route.query.tab) ? route.query.tab : 'details')

watch(activeTab, (val) => {
  if (route.query.tab === val) return
  router.replace({ query: { ...route.query, tab: val } })
})

watch(
  () => route.query.tab,
  (val) => {
    if (TABS.some((t) => t.value === val) && val !== activeTab.value) {
      activeTab.value = val
    }
  },
)

const selectedStepIndex = ref(currentStep.value)
watch(currentStep, (val) => { selectedStepIndex.value = val })

const selectedStepData = computed(() => acte.value?.steps?.[selectedStepIndex.value - 1] || null)

const illustrationUrl = computed(() => {
  const file = selectedStepData.value?.illustration
  if (!file) return ''
  return new URL(`../assets/illustrations/${file}`, import.meta.url).href
})

function goPrev() {
  if (currentStep.value > 1) currentStep.value = currentStep.value - 1
}

function goNext() {
  if (currentStep.value < totalSteps.value) currentStep.value = currentStep.value + 1
}

function goToStep(n) {
  selectedStepIndex.value = n
}

function stepDateInfo(step) {
  if (step.dayOffset === null || step.dayOffset === undefined) {
    return { label: 'Pas encore planifiée', date: null, relative: null }
  }
  const base = acte.value?.startedAt ? dayjs(acte.value.startedAt) : dayjs()
  const d = base.add(step.dayOffset + 18, 'day')
  return {
    label: null,
    date: d.format('DD MMM YYYY'),
    relative: d.fromNow(),
  }
}

function initials(person) {
  return `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase()
}

const startedLabel = computed(() => {
  if (!acte.value?.startedAt) return ''
  return dayjs(acte.value.startedAt).format('DD MMM YYYY')
})

const startedRelative = computed(() => {
  if (!acte.value?.startedAt) return ''
  return dayjs(acte.value.startedAt).fromNow()
})

const paymentStatus = computed(() => {
  if (!acte.value) return 'pending'
  return acte.value.paymentStatus || 'pending'
})
</script>

<template>
  <div>
    <v-row v-if="acte" justify="center" class="mt-8 mb-16 pb-10">
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
              <v-icon :icon="mdiHospitalBuilding" size="28" color="primary" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-headline-small font-weight-bold">{{ acte.label }}</div>
              <div v-if="doctor" class="text-body-medium text-medium-emphasis mt-1">
                Suivi par Dr {{ doctor.firstName }} {{ doctor.lastName }}
              </div>
            </div>
            <v-chip :color="statusColor" variant="tonal" size="small" class="flex-shrink-0 ml-2">
              {{ statusLabel }}
            </v-chip>
          </div>

          <div class="progress-banner">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing">
                Étape {{ currentStep }} sur {{ totalSteps }}
              </div>
              <div class="text-body-small font-weight-bold text-primary">{{ progressPercent }}%</div>
            </div>
            <v-progress-linear :model-value="progressPercent" color="primary" height="8" rounded />
          </div>

          <v-tabs v-if="!$vuetify.display.mobile" v-model="activeTab" color="primary" align-tabs="center"
            :show-arrows="false" class="mt-6 acte-tabs">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" class="text-none">
              <v-icon :icon="t.icon" size="18" class="mr-1" />
              {{ t.label }}
            </v-tab>
          </v-tabs>
          <v-chip-group v-else v-model="activeTab" mandatory class="mt-4 acte-chips" column>
            <v-chip v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" variant="flat"
              :class="{ 'bg-primary': activeTab === t.value, 'bg-white border-light': activeTab !== t.value }"
              class="text-none">
              {{ t.label }}
            </v-chip>
          </v-chip-group>
        </v-card>

        <!-- ============ TAB: DETAILS ============ -->
        <template v-if="activeTab === 'details'">
          <v-card v-if="acte.description" class="card-shadow pa-5 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiInformationOutline" size="14" class="mr-1" color="primary" />
              À propos
            </div>
            <div class="text-body-medium mt-2">{{ acte.description }}</div>
          </v-card>

          <v-card v-if="doctor" class="card-shadow pa-5 mb-4"
            :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiDoctor" size="14" class="mr-1" color="primary" />
              Médecin référent
            </div>
            <div class="d-flex align-center mt-3">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                <v-img v-if="doctor.avatarUrl" :src="doctor.avatarUrl" cover />
                <span v-else class="text-body-medium font-weight-bold">{{ initials(doctor) }}</span>
              </v-avatar>
              <div>
                <div class="text-title-medium font-weight-bold">
                  Dr {{ doctor.firstName }} {{ doctor.lastName }}
                </div>
                <div v-if="doctor.specialty" class="text-body-small text-medium-emphasis">
                  {{ doctor.specialty }}
                </div>
              </div>
            </div>
          </v-card>

          <v-card v-if="acte.locationName || acte.locationAddress"
            class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="card-label">
              <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" color="primary" />
              Lieu
            </div>
            <div v-if="acte.locationName" class="text-title-medium font-weight-bold mt-2">
              {{ acte.locationName }}
            </div>
            <div v-if="acte.locationAddress" class="text-body-medium text-medium-emphasis mt-1">
              {{ acte.locationAddress }}
            </div>
          </v-card>

          <v-card class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-if="startedLabel" :prepend-icon="mdiCalendar" variant="tonal" size="small" color="grey">
                Débuté le {{ startedLabel }}
                <span class="ml-1 text-medium-emphasis">· {{ startedRelative }}</span>
              </v-chip>
              <v-chip v-if="acte.price" :prepend-icon="mdiCashMultiple" variant="tonal" size="small" color="grey">
                {{ acte.price }} €
              </v-chip>
              <v-chip :prepend-icon="mdiPlaylistCheck" variant="tonal" size="small" color="grey">
                {{ totalSteps }} étapes
              </v-chip>
            </div>
          </v-card>
        </template>

        <!-- ============ TAB: ETAPES ============ -->
        <template v-else-if="activeTab === 'etapes'">
          <!-- Step navigator -->
          <v-card class="card-shadow pa-5 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="d-flex align-start justify-space-between ga-3 mb-4">
              <div>
                <div class="text-title-medium font-weight-bold mb-1">
                  Suivi des étapes
                </div>
                <div class="text-body-small text-medium-emphasis">
                  Avancement détaillé de votre parcours
                </div>
              </div>
              <div class="d-flex ga-1 flex-shrink-0">
                <v-btn :icon="mdiArrowLeft" variant="tonal" color="primary" size="small" density="comfortable"
                  :disabled="currentStep <= 1" @click="goPrev" />
                <v-btn :icon="mdiArrowRight" variant="flat" color="primary" size="small" density="comfortable"
                  :disabled="currentStep >= totalSteps" @click="goNext" />
              </div>
            </div>

            <v-row v-if="selectedStepData" align="center">
              <v-col cols="12" sm="7">
                <v-chip :color="selectedStepIndex === currentStep ? 'primary' : 'grey'" variant="tonal" size="small"
                  class="mb-3">
                  Étape {{ selectedStepIndex }}
                  <span v-if="selectedStepIndex === currentStep" class="ml-1">· en cours</span>
                </v-chip>
                <div class="text-headline-small font-weight-bold mb-3">{{ selectedStepData.title }}</div>
                <div class="text-body-medium text-medium-emphasis mb-3">{{ selectedStepData.desc }}</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-if="stepDateInfo(selectedStepData).label" :prepend-icon="mdiCalendarQuestion"
                    variant="tonal" size="small" color="grey">
                    <span class="font-italic">{{ stepDateInfo(selectedStepData).label }}</span>
                  </v-chip>
                  <v-chip v-else :prepend-icon="mdiCalendar" variant="tonal" size="small" color="grey">
                    <span class="font-weight-medium">{{ stepDateInfo(selectedStepData).date }}</span>
                    <span class="ml-1">· {{ stepDateInfo(selectedStepData).relative }}</span>
                  </v-chip>
                  <v-chip v-if="selectedStepData.duration" :prepend-icon="mdiClockOutline" variant="tonal" size="small"
                    color="grey">
                    {{ selectedStepData.duration }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" sm="5" class="text-center">
                <v-img v-if="illustrationUrl" :src="illustrationUrl" :width="180" :height="160" contain
                  class="mx-auto" />
              </v-col>
            </v-row>
          </v-card>

          <!-- Timeline -->
          <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
              <span class="text-headline-small font-weight-bold">Toutes les étapes</span>
            </v-card-title>
            <v-card-text class="px-4 pt-3">
              <v-timeline side="end" density="compact" align="start" truncate-line="both">
                <v-timeline-item v-for="(step, i) in acte.steps" :key="i"
                  :dot-color="i + 1 < currentStep ? 'success' : i + 1 === currentStep ? 'primary' : 'grey-lighten-1'"
                  :icon="i + 1 < currentStep ? mdiCheck : undefined" size="small" fill-dot>
                  <div class="cursor-pointer" @click="goToStep(i + 1)">
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
              <div v-if="acte.price" class="ml-auto text-headline-small font-weight-bold">
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
              <span>{{ acte.label }}</span>
              <span class="font-weight-bold">{{ acte.price ? `${acte.price} €` : '—' }}</span>
            </div>
            <v-divider class="my-3" />
            <div class="payment-row">
              <span class="font-weight-bold">Total</span>
              <span class="text-headline-small font-weight-bold">
                {{ acte.price ? `${acte.price} €` : '—' }}
              </span>
            </div>
            <div class="text-body-small text-medium-emphasis mt-3">
              Une partie est habituellement prise en charge par l'Assurance Maladie et votre mutuelle.
            </div>
          </v-card>

          <v-card v-if="paymentStatus !== 'paid'"
            class="card-shadow pa-5" :class="{ 'rounded-15': !$vuetify.display.mobile }">
            <div class="text-body-medium text-medium-emphasis mb-3">
              Le règlement se fait directement auprès de l'établissement. Le paiement en ligne sera bientôt
              disponible.
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
        <div class="text-headline-small font-weight-bold mt-3">Acte introuvable</div>
        <div class="text-body-medium text-medium-emphasis mt-1 mb-4">
          Cet acte n'existe pas ou a été supprimé.
        </div>
        <v-btn color="primary" rounded="lg" class="text-none"
          @click="router.push({ name: 'Rendezvous' })">
          Retour aux rendez-vous
        </v-btn>
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

.cursor-pointer {
  cursor: pointer;
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

.progress-banner {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.acte-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.acte-chips :deep(.v-slide-group__container) {
  overflow: visible;
  contain: none;
}

.acte-chips :deep(.v-slide-group__content) {
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
</style>
