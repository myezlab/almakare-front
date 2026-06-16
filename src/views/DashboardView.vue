<script setup>
import PpcNightlyCard from '@/components/PpcNightlyCard.vue'
import { useParamsStore } from '@/stores/params'
import { useSelfStore } from '@/stores/self'
import { sleepStreak } from '@/utils/sleepTimeline'
import { mdiAccountQuestion, mdiClipboardPulse, mdiFolderOutline, mdiLungs } from '@mdi/js'
import { computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

const InstallAppCard = defineAsyncComponent(() =>
  import('@/components/InstallAppCard.vue')
)

const router = useRouter()
const selfStore = useSelfStore()
const paramsStore = useParamsStore()

const sleepStreakDays = computed(() =>
  sleepStreak(selfStore.item?.sleepDiaryEntries ?? []),
)

// Compact night-quality prompt on the card, using the full Réseau Morphée
// 5-level scale (TB / B / Moy / M / TM) shared with the agenda form
// (QualityRating), so a quick tap here prefills the entry the user then
// refines on the SleepDiary page.
const nightQualityOptions = [
  { value: 'TM', emoji: '😣', label: 'Très mauvais' },
  { value: 'M', emoji: '😕', label: 'Mauvais' },
  { value: 'Moy', emoji: '😐', label: 'Moyen' },
  { value: 'B', emoji: '🙂', label: 'Bien' },
  { value: 'TB', emoji: '😄', label: 'Très bien' },
]

function pickNightQuality(value) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const day = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
  router.push({ name: 'SleepDiary', query: { day, quality: value } })
}

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
    <v-row v-if="selfStore.item.id" justify="center" class="mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10" style="max-width: 900px">

        <div class="text-headline-medium font-weight-bold mt-6 mb-2">Tableau de bord</div>

        <!-- Two-column grid of cards (desktop) / stacked (mobile) -->
        <v-row>
          <!-- Install app card -->
          <v-col v-if="paramsStore.beforeinstallprompt" cols="12" md="6">
            <InstallAppCard class="h-100" />
          </v-col>

          <!-- Mon dossier card -->
          <v-col cols="12">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100 d-flex flex-column"
              @click="router.push({ name: 'MonDossier' })">
              <v-row align="stretch" class="flex-grow-1">
                <v-col class="d-flex flex-column">
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Mon dossier
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Retrouvez vos informations, documents et questionnaires
                  </div>
                  <v-btn :prepend-icon="mdiFolderOutline" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ name: 'MonDossier' })" class="text-none mt-auto align-self-start">
                    Ouvrir mon dossier
                  </v-btn>
                </v-col>
                <v-col v-if="!$vuetify.display.mobile" cols="auto" class="d-flex align-center">
                  <v-img src="@/assets/illustrations/folder.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Sleep diary card -->
          <v-col cols="12">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100 d-flex flex-column position-relative"
              @click="router.push({ name: 'SleepDiary' })">
              <v-chip v-if="sleepStreakDays > 0" color="deep-orange" variant="tonal" size="small"
                class="font-weight-bold position-absolute" style="top: 16px; right: 16px">
                🔥 {{ sleepStreakDays }}
              </v-chip>
              <v-row align="stretch" class="flex-grow-1">
                <v-col class="d-flex flex-column">
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Agenda du sommeil
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Suivez votre sommeil nuit après nuit avec un agenda visuel
                  </div>
                  <div class="mt-auto">
                    <div class="text-body-medium font-weight-medium mb-2">Qualité de la nuit</div>
                    <div class="d-flex" style="gap: 8px;">
                      <button v-for="opt in nightQualityOptions" :key="opt.value" type="button" class="night-face-btn"
                        :aria-label="opt.label" @click.stop="pickNightQuality(opt.value)">
                        <span class="night-face-emoji">{{ opt.emoji }}</span>
                      </button>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Nightly PPC therapy data (auto-synced from the device) -->
          <v-col cols="12">
            <PpcNightlyCard />
          </v-col>

          <!-- Epworth test card -->
          <v-col v-if="selfStore.item?.epworthScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100 d-flex flex-column"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })">
              <v-row align="stretch" class="flex-grow-1">
                <v-col class="d-flex flex-column">
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Test d'Epworth
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Évaluez votre somnolence diurne en répondant à 8 questions
                  </div>
                  <div class="d-flex flex-column align-start gap-2 mt-auto">
                    <v-chip v-if="selfStore.item?.epworthScore != null" class="mb-4" :color="epworthScoreColor"
                      variant="tonal" size="small">
                      {{ epworthScoreLabel }}
                    </v-chip>
                    <v-btn v-if="selfStore.item?.epworthScore == null" :prepend-icon="mdiClipboardPulse" variant="tonal"
                      color="primary" rounded="lg"
                      @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })"
                      class="text-none">
                      Passer le test
                    </v-btn>
                  </div>
                </v-col>
                <v-col v-if="!$vuetify.display.mobile" cols="auto" class="d-flex align-center">
                  <v-img src="@/assets/illustrations/patient.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- STOP-BANG test card -->
          <v-col v-if="selfStore.item?.stopBangScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100 d-flex flex-column"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'stopBang' } })">
              <v-row align="stretch" class="flex-grow-1">
                <v-col class="d-flex flex-column">
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Test STOP-BANG
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Dépistez l'apnée du sommeil en répondant à 8 questions par Oui ou Non
                  </div>
                  <v-btn :prepend-icon="mdiLungs" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'stopBang' } })"
                    class="text-none mt-auto align-self-start">
                    Passer le test
                  </v-btn>
                </v-col>
                <v-col v-if="!$vuetify.display.mobile" cols="auto" class="d-flex align-center">
                  <v-img src="@/assets/illustrations/congratulations.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Hamilton test card -->
          <v-col v-if="selfStore.item?.hamiltonScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100 d-flex flex-column"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'hamilton' } })">
              <v-row align="stretch" class="flex-grow-1">
                <v-col class="d-flex flex-column">
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Échelle de Hamilton
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Évaluez la sévérité d'un état dépressif sur 17 items
                  </div>
                  <v-btn :prepend-icon="mdiAccountQuestion" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'hamilton' } })"
                    class="text-none mt-auto align-self-start">
                    Passer le test
                  </v-btn>
                </v-col>
                <v-col v-if="!$vuetify.display.mobile" cols="auto" class="d-flex align-center">
                  <v-img src="@/assets/illustrations/report.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

        </v-row>

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10" style="max-width: 900px">

        <!-- <v-skeleton-loader type="heading" class="mb-6" width="200" /> -->

        <!-- Sleep diary card skeleton -->
        <!-- <v-card class="mt-4 pa-6 card-shadow rounded-15">
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
        </v-card> -->

        <!-- Epworth test card skeleton -->
        <!-- <v-card class="mt-4 pa-6 card-shadow rounded-15">
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
        </v-card> -->

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Compact night-quality faces on the sleep-diary card — mirrors QualityRating's
   look so the prompt feels continuous with the full agenda form. */
.night-face-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

/* Full-colour and tappable by default — no hover dependence, so the faces never
   read as disabled on touch devices. */
.night-face-emoji {
  font-size: 24px;
  line-height: 1;
}

@media (hover: hover) {
  .night-face-btn:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background: rgba(var(--v-theme-primary), 0.04);
  }
}

.night-face-btn:active {
  transform: scale(0.92);
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
