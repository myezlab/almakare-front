<script setup>
import { useProfileCompletion } from '@/composables/useProfileCompletion'
import { useSelfStore } from '@/stores/self'
import { mdiAccountOutline, mdiChartBar, mdiClipboardPulseOutline, mdiMoonWaningCrescent } from '@mdi/js'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t } = useI18n()
const selfStore = useSelfStore()

const db = getFirestore()

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
  if (score <= 10) return t('EPWORTH_SCORE_NORMAL')
  if (score <= 15) return t('EPWORTH_SCORE_MODERATE')
  return t('EPWORTH_SCORE_SEVERE')
})

onMounted(async () => {
  try {
    const snapshot = await getDoc(doc(db, 'statistics', 'global'))
    if (snapshot.exists()) {
      usersCount.value = snapshot.data().usersCount || 0
      projectsCount.value = snapshot.data().projectsCount || 0
    }
  } catch (error) {
    console.error('Error fetching statistics:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <v-row v-if="selfStore.item.createdAt" justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6">
          <v-col align-self="center" class="text-headline-medium font-weight-bold">
            <v-row>
              {{ $t('DASHBOARD') }}
            </v-row>
          </v-col>
        </v-row>

        <!-- Complete your profile card -->
        <v-card v-if="completionPercent < 100" class="mt-6 pa-6 card-shadow rounded-15 cursor-pointer"
          @click="router.push({ name: 'Profile' })">
          <v-row align="center">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                {{ $t('PROFILE_COMPLETION_TITLE') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ $t('PROFILE_COMPLETION_SUBTITLE') }}
              </div>
              <v-btn :prepend-icon="mdiAccountOutline" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'Profile' })" class="text-none">
                {{ $t('PROFILE') }}
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
                {{ $t('SLEEP_DIARY_TITLE') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ $t('SLEEP_DIARY_DASHBOARD_SUBTITLE') }}
              </div>
              <v-btn :prepend-icon="mdiMoonWaningCrescent" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'SleepDiary' })" class="text-none">
                {{ $t('SLEEP_DIARY_OPEN') }}
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
                {{ $t('SLEEP_STATS_TITLE') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ $t('SLEEP_STATS_SUBTITLE') }}
              </div>
              <v-btn :prepend-icon="mdiChartBar" variant="tonal" color="primary" rounded="lg"
                @click.stop="router.push({ name: 'SleepStatsFrance' })" class="text-none">
                {{ $t('SLEEP_STATS_CTA') }}
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
                {{ $t('EPWORTH_TEST') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ $t('EPWORTH_DASHBOARD_SUBTITLE') }}
              </div>
              <div class="d-flex flex-column align-start gap-2">
                <v-chip v-if="selfStore.item?.epworthScore != null" class="mb-4" :color="epworthScoreColor"
                  variant="tonal" size="small">
                  {{ epworthScoreLabel }}
                </v-chip>
                <v-btn :prepend-icon="mdiClipboardPulseOutline" variant="tonal" color="primary" rounded="lg"
                  @click.stop="router.push({ name: 'EpworthTest' })" class="text-none">
                  {{ selfStore.item?.epworthScore != null ? $t('EPWORTH_RETAKE') : $t('EPWORTH_TAKE_TEST') }}
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
