<script setup>
import { useProfileCompletion } from '@/composables/useProfileCompletion'
import { useSelfStore } from '@/stores/self'
import { mdiAccountOutline, mdiChartBar, mdiClipboardPulseOutline, mdiMoonWaningCrescent } from '@mdi/js'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selfStore = useSelfStore()

const loading = ref(true)
const usersCount = ref(0)
const projectsCount = ref(0)

const currentUser = computed(() => selfStore.item || {})
const { completionPercent } = useProfileCompletion(currentUser)

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
    <v-row v-if="selfStore.item.id" justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6">
          <v-col align-self="center" class="text-headline-medium font-weight-bold">
            <v-row>
              Tableau de bord
            </v-row>
          </v-col>
        </v-row>

        <!-- Complete your profile card -->
        <v-card v-if="completionPercent < 100" class="mt-6 pa-6 card-shadow rounded-15 cursor-pointer"
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
