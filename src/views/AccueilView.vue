<script setup>
import logoText from '@/assets/img/logo-text-white.svg'
import { useProfileCompletion } from '@/composables/useProfileCompletion'
import { useSelfStore } from '@/stores/self'
import { mdiAccountOutline, mdiCalendarPlusOutline, mdiChartBar, mdiClipboardPulseOutline, mdiHospitalBuilding, mdiMoonWaningCrescent } from '@mdi/js'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selfStore = useSelfStore()

const loading = ref(true)
const usersCount = ref(0)
const projectsCount = ref(0)

const currentUser = computed(() => selfStore.item || {})
const { completionPercent } = useProfileCompletion(currentUser)

const HOSPITALIZATION_TOTAL_STEPS = 8
const hospitalizationStep = computed(() => selfStore.item?.hospitalizationStep || 1)
const hospitalizationProgress = computed(
  () => Math.round((hospitalizationStep.value / HOSPITALIZATION_TOTAL_STEPS) * 100),
)

const epworthScoreColor = computed(() => {
  const score = selfStore.item?.epworthScore
  if (score == null) return 'primary'
  if (score <= 10) return 'success'
  if (score <= 15) return 'warning'
  return 'error'
})

const epworthScoreLabel = computed(() => {
  const score = selfStore.item?.epworthScore
  if (score == null) return ''
  if (score <= 10) return 'Somnolence normale'
  if (score <= 15) return 'Somnolence modérée'
  return 'Somnolence sévère'
})

</script>

<template>
  <div>
    <div v-if="selfStore.item.id" class="home-banner">
      <div class="home-banner-sparkles" aria-hidden="true">
        <span class="sparkle sparkle-1"></span>
        <span class="sparkle sparkle-2"></span>
        <span class="sparkle sparkle-3"></span>
        <span class="sparkle sparkle-4"></span>
        <span class="sparkle sparkle-5"></span>
        <span class="sparkle sparkle-6"></span>
        <span class="sparkle sparkle-7"></span>
        <span class="sparkle sparkle-8"></span>
      </div>
      <img :src="logoText" alt="almakare" class="home-banner-logo" />
      <svg class="home-banner-blob" viewBox="0 0 1440 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true">
        <path fill="#fafbfd" d="M0,80 C480,160 960,0 1440,80 L1440,160 L0,160 Z" />
      </svg>
    </div>
    <v-row v-if="selfStore.item.id" justify="center" class="mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- Book appointment card -->
        <v-card class="mt-6 pa-6 card-shadow rounded-15 cursor-pointer book-appt-card"
          @click="router.push({ name: 'BookAppointment' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Rendez-vous
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                Prenez rendez-vous avec l'un de vos médecins
              </div>
              <v-btn :prepend-icon="mdiCalendarPlusOutline" color="primary" rounded="lg" flat
                @click.stop="router.push({ name: 'BookAppointment' })" class="text-none">
                Prendre rendez-vous
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-img src="@/assets/illustrations/doctor.svg" width="100" height="90" contain
                transition="fade-transition" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Hospitalization journey card -->
        <v-card class="mt-6 pa-6 card-shadow rounded-15 cursor-pointer"
          @click="router.push({ name: 'HospitalizationJourney' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Mon hospitalisation
              </div>
              <div class="text-body-medium text-medium-emphasis mb-2">
                Comprenez les étapes de votre évaluation pour l'apnée du sommeil
              </div>
              <v-chip color="primary" variant="tonal" size="small" class="mb-4">
                Étape {{ hospitalizationStep }} sur {{ HOSPITALIZATION_TOTAL_STEPS }}
              </v-chip>
              <div>
                <v-btn :prepend-icon="mdiHospitalBuilding" variant="tonal" color="primary" rounded="lg"
                  @click.stop="router.push({ name: 'HospitalizationJourney' })" class="text-none">
                  Suivre mon parcours
                </v-btn>
              </div>
            </v-col>
            <v-col cols="auto">
              <v-progress-circular :model-value="hospitalizationProgress" color="primary" size="80" width="6">
                <span class="text-body-medium font-weight-bold">{{ hospitalizationStep }}/{{ HOSPITALIZATION_TOTAL_STEPS
                  }}</span>
              </v-progress-circular>
            </v-col>
          </v-row>
        </v-card>

        <!-- Complete your profile card -->
        <v-card v-if="completionPercent < 100" class="mt-4 pa-6 card-shadow rounded-15 cursor-pointer"
          @click="router.push({ name: 'Profile' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Complétez votre profil
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                Renseignez vos informations pour accéder à toutes les fonctionnalités
              </div>
              <v-btn :prepend-icon="mdiAccountOutline" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'Profile' })" class="text-none">
                Profil
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-progress-circular :model-value="completionPercent" color="primary" size="80" width="6">
                <span class="text-body-medium font-weight-bold">{{ completionPercent }}%</span>
              </v-progress-circular>
            </v-col>
          </v-row>
        </v-card>

        <!-- Sleep diary card -->
        <v-card class="mt-4 pa-6 card-shadow rounded-15 cursor-pointer" @click="router.push({ name: 'SleepDiary' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Agenda du sommeil
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                Suivez votre sommeil nuit après nuit avec un agenda visuel
              </div>
              <v-btn :prepend-icon="mdiMoonWaningCrescent" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'SleepDiary' })" class="text-none">
                Ouvrir l'agenda
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-img src="@/assets/illustrations/report.svg" width="100" height="90" contain
                transition="fade-transition" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Sleep stats France card -->
        <v-card class="mt-4 pa-6 card-shadow rounded-15 cursor-pointer"
          @click="router.push({ name: 'SleepStatsFrance' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                En savoir plus
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                Chiffres clés sur les troubles du sommeil en France
              </div>
              <v-btn :prepend-icon="mdiChartBar" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'SleepStatsFrance' })" class="text-none">
                Découvrir
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-img src="@/assets/illustrations/information.svg" width="100" height="90" contain
                transition="fade-transition" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Epworth test card -->
        <v-card class="mt-4 pa-6 card-shadow rounded-15 cursor-pointer" @click="router.push({ name: 'EpworthTest' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Test d'Epworth
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                Évaluez votre somnolence diurne en répondant à 8 questions
              </div>
              <div class="d-flex flex-column align-start gap-2">
                <v-chip v-if="selfStore.item?.epworthScore != null" class="mb-4" :color="epworthScoreColor"
                  variant="tonal" size="small">
                  {{ epworthScoreLabel }}
                </v-chip>
                <v-btn :prepend-icon="mdiClipboardPulseOutline" variant="tonal" color="primary" rounded="lg"
                  @click.stop="router.push({ name: 'EpworthTest' })" class="text-none">
                  {{ selfStore.item?.epworthScore != null ? 'Refaire le test' : 'Passer le test' }}
                </v-btn>
              </div>
            </v-col>
            <v-col cols="auto">
              <v-img src="@/assets/illustrations/tasks.svg" width="100" height="90" contain
                transition="fade-transition" />
            </v-col>
          </v-row>
        </v-card>


      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-skeleton-loader type="heading" class="mb-6" width="200" />

        <!-- Profile completion card skeleton -->
        <v-card class="mt-6 pa-6 card-shadow rounded-15">
          <v-row align="center">
            <v-col>
              <v-skeleton-loader type="heading" class="mb-2" />
              <v-skeleton-loader type="text" class="mb-4" />
              <v-skeleton-loader type="button" />
            </v-col>
            <v-col cols="auto">
              <v-skeleton-loader type="avatar" width="80" height="80" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Sleep diary card skeleton -->
        <v-card class="mt-4 pa-6 card-shadow rounded-15">
          <v-row align="center">
            <v-col>
              <v-skeleton-loader type="heading" class="mb-2" />
              <v-skeleton-loader type="text" class="mb-4" />
              <v-skeleton-loader type="button" />
            </v-col>
            <v-col cols="auto">
              <v-skeleton-loader type="image" width="100" height="90" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Epworth test card skeleton -->
        <v-card class="mt-4 pa-6 card-shadow rounded-15">
          <v-row align="center">
            <v-col>
              <v-skeleton-loader type="heading" class="mb-2" />
              <v-skeleton-loader type="text" class="mb-4" />
              <v-skeleton-loader type="button" />
            </v-col>
            <v-col cols="auto">
              <v-skeleton-loader type="image" width="100" height="90" />
            </v-col>
          </v-row>
        </v-card>

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.home-banner {
  position: relative;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  background: linear-gradient(135deg, #123B6D, #1c5089);
  padding: 48px 16px 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 24px;
}

.home-banner-logo {
  position: relative;
  z-index: 1;
  width: 33vw;
  max-width: 360px;
  min-width: 180px;
  height: auto;
  object-fit: contain;
  display: block;
}

.home-banner-blob {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  width: 100%;
  height: 120px;
  z-index: 0;
  display: block;
}

.home-banner-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sparkle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #ffffff;
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
  animation: sparkle-twinkle 4s ease-in-out infinite;
}

.sparkle-1 {
  top: 18%;
  left: 12%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 32%;
  left: 78%;
  animation-delay: 0.7s;
  width: 3px;
  height: 3px;
}

.sparkle-3 {
  top: 55%;
  left: 22%;
  animation-delay: 1.4s;
}

.sparkle-4 {
  top: 25%;
  left: 45%;
  animation-delay: 2.1s;
}

.sparkle-5 {
  top: 65%;
  left: 88%;
  animation-delay: 0.4s;
}

.sparkle-6 {
  top: 42%;
  left: 65%;
  animation-delay: 2.8s;
  width: 3px;
  height: 3px;
}

.sparkle-7 {
  top: 72%;
  left: 35%;
  animation-delay: 1.1s;
}

.sparkle-8 {
  top: 15%;
  left: 90%;
  animation-delay: 3.2s;
}

@keyframes sparkle-twinkle {

  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }

  50% {
    opacity: 0.7;
    transform: scale(1);
  }
}
</style>
