<script setup>
import logoText from '@/assets/img/logo-text-white.svg'
import { useRules } from '@/composables/useRules'
import { useMessagesStore } from '@/stores/messages'
import { useParamsStore } from '@/stores/params'
import { useSelfStore } from '@/stores/self'
import { mdiAccountOutline, mdiClipboardPulse, mdiClose, mdiHelpCircleOutline, mdiMoonWaningCrescent } from '@mdi/js'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const InstallAppCard = defineAsyncComponent(() =>
  import('@/components/InstallAppCard.vue')
)

const router = useRouter()
const selfStore = useSelfStore()
const paramsStore = useParamsStore()
const messagesStore = useMessagesStore()
const { emailValidation, required } = useRules()

const supportDialog = ref(false)
const supportFormRef = ref(null)
const supportSubmitting = ref(false)
const supportForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
})

watch(supportDialog, (open) => {
  if (!open) return
  supportForm.value = {
    firstName: selfStore.item?.firstName || '',
    lastName: selfStore.item?.lastName || '',
    email: selfStore.item?.email || '',
    subject: '',
    message: '',
  }
})

async function submitSupport() {
  const { valid } = await supportFormRef.value.validate()
  if (!valid) return
  supportSubmitting.value = true
  try {
    messagesStore.add({ type: 'success', text: "Demande d'assistance envoyée" })
    supportDialog.value = false
  } finally {
    supportSubmitting.value = false
  }
}

const accountLabel = computed(() => {
  const first = selfStore.item?.firstName?.trim() || ''
  const last = selfStore.item?.lastName?.trim() || ''
  const full = `${first} ${last}`.trim()
  return full || 'Utilisateur'
})

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
      <div class="home-banner-actions">
        <v-btn :icon="mdiHelpCircleOutline" variant="text" color="white" aria-label="Aide"
          @click="supportDialog = true" />
        <v-btn :prepend-icon="mdiAccountOutline" variant="text" color="white" class="text-none"
          @click="router.push({ name: 'DonneesPatient' })">
          {{ accountLabel }}
        </v-btn>
      </div>
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
        <path fill="#fafbfd" d="M0,80 C480,160 960,0 1540,80 L1440,160 L0,160 Z" />
      </svg>
    </div>
    <v-row v-if="selfStore.item.id" justify="center" class="mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- Two-column grid of cards (desktop) / stacked (mobile) -->
        <v-row :class="{ 'mt-6': !$vuetify.display.mobile }">
          <!-- Install app card -->
          <v-col v-if="paramsStore.beforeinstallprompt" cols="12" md="6">
            <InstallAppCard class="h-100" />
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
              @click="router.push({ name: 'EpworthTest' })">
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
                      color="primary" rounded="lg" @click.stop="router.push({ name: 'EpworthTest' })" class="text-none">
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

        </v-row>

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mt-8 mx-6 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-skeleton-loader type="heading" class="mb-6" width="200" />

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

    <!-- Support dialog -->
    <v-dialog v-model="supportDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :rounded="$vuetify.display.mobile ? 0 : 'lg'">
        <v-card-title class="d-flex align-center ga-2 pa-4 support-dialog-title">
          <span class="text-headline-small font-weight-bold flex-grow-1">Envoyer une demande d'assistance</span>
          <v-btn :icon="mdiClose" variant="text" size="small" aria-label="Fermer" @click="supportDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-form ref="supportFormRef" @submit.prevent="submitSupport">
            <v-text-field v-model.trim="supportForm.firstName" label="Prénom*" variant="outlined" rounded="lg"
              :rules="[required]" />
            <v-text-field v-model.trim="supportForm.lastName" label="Nom*" variant="outlined" rounded="lg"
              :rules="[required]" />
            <v-text-field v-model.trim="supportForm.email" label="Email*" type="email" variant="outlined" rounded="lg"
              :rules="[required, emailValidation]" />
            <v-text-field v-model.trim="supportForm.subject" label="Objet*" variant="outlined" rounded="lg"
              :rules="[required]" />
            <v-textarea v-model.trim="supportForm.message" label="Problème rencontré*" variant="outlined" rounded="lg"
              rows="4" auto-grow :rules="[required]" />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="supportDialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="supportSubmitting"
            @click="submitSupport">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.support-dialog-title :deep(span),
.support-dialog-title span {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.25;
  min-width: 0;
}

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

.home-banner-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
}

.home-banner-logo {
  position: relative;
  z-index: 1;
  width: 33vw;
  max-width: 360px;
  min-width: 180px;
  aspect-ratio: 827.2 / 158.6;
  height: auto;
  object-fit: contain;
  display: block;
  animation: logo-fade-in 0.6s ease-out both;
}

@keyframes logo-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
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
