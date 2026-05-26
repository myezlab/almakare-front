<script setup>
import { useParamsStore } from '@/stores/params'
import { useSelfStore } from '@/stores/self'
import { mdiClipboardPulse, mdiEmoticonSadOutline, mdiFolderOutline, mdiLungs, mdiMoonWaningCrescent } from '@mdi/js'
import { computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

const InstallAppCard = defineAsyncComponent(() =>
  import('@/components/InstallAppCard.vue')
)

const router = useRouter()
const selfStore = useSelfStore()
const paramsStore = useParamsStore()

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
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <div class="text-headline-medium font-weight-bold mt-6 mb-2">Tableau de bord</div>

        <!-- Two-column grid of cards (desktop) / stacked (mobile) -->
        <v-row>
          <!-- Install app card -->
          <v-col v-if="paramsStore.beforeinstallprompt" cols="12" md="6">
            <InstallAppCard class="h-100" />
          </v-col>

          <!-- Mon dossier card -->
          <v-col cols="12">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100"
              @click="router.push({ name: 'MonDossier' })">
              <v-row align="center">
                <v-col>
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Mon dossier
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Retrouvez vos informations, documents et questionnaires
                  </div>
                  <v-btn :prepend-icon="mdiFolderOutline" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ name: 'MonDossier' })" class="text-none">
                    Ouvrir mon dossier
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-img src="@/assets/illustrations/folder.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Sleep diary card -->
          <v-col cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100"
              @click="router.push({ name: 'SleepDiary' })">
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
          </v-col>

          <!-- Epworth test card -->
          <v-col v-if="selfStore.item?.epworthScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })">
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
                    <v-btn v-if="selfStore.item?.epworthScore == null" :prepend-icon="mdiClipboardPulse" variant="tonal"
                      color="primary" rounded="lg"
                      @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'epworth' } })"
                      class="text-none">
                      Passer le test
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

          <!-- STOP-BANG test card -->
          <v-col v-if="selfStore.item?.stopBangScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'stopBang' } })">
              <v-row align="center">
                <v-col>
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Test STOP-BANG
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Dépistez l'apnée du sommeil en répondant à 8 questions par Oui ou Non
                  </div>
                  <v-btn :prepend-icon="mdiLungs" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'stopBang' } })"
                    class="text-none">
                    Passer le test
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-img src="@/assets/illustrations/tasks.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Hamilton test card -->
          <v-col v-if="selfStore.item?.hamiltonScore == null" cols="12" md="6">
            <v-card class="pa-6 card-shadow rounded-15 cursor-pointer h-100"
              @click="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'hamilton' } })">
              <v-row align="center">
                <v-col>
                  <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                    Échelle de Hamilton
                  </div>
                  <div class="text-body-medium text-medium-emphasis mb-4">
                    Évaluez la sévérité d'un état dépressif sur 17 items
                  </div>
                  <v-btn :prepend-icon="mdiEmoticonSadOutline" variant="tonal" color="primary" rounded="lg"
                    @click.stop="router.push({ path: '/mon-dossier', query: { tab: 'questionnaires', qPanels: 'hamilton' } })"
                    class="text-none">
                    Passer le test
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-img src="@/assets/illustrations/tasks.svg" width="100" height="90" contain
                    transition="fade-transition" />
                </v-col>
              </v-row>
            </v-card>
          </v-col>

        </v-row>

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

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
