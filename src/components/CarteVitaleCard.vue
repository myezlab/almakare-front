<script setup>
import { functions } from '@/firebase'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from "@/stores/self"
import { mdiAbacus, mdiCamera, mdiHandshake, mdiMagnify, mdiRobot, mdiSnail } from '@mdi/js'
import { doc, getFirestore, updateDoc } from "firebase/firestore"
import { httpsCallable } from 'firebase/functions'
import { computed, onUnmounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const db = getFirestore()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()

const formRef = ref(null)
const saving = ref(false)
const scanning = ref(false)
const scanIconIndex = ref(0)
let scanMessageInterval = null
const fileInputRef = ref(null)
const currentUser = computed(() => selfStore.item || {})

const model = ref({
  carteVitaleNir: '',
  carteVitaleIssueDate: '',
})

watch(
  () => currentUser.value,
  (item) => {
    if (!item?.id) return
    model.value = {
      carteVitaleNir: item.carteVitaleNir || '',
      carteVitaleIssueDate: item.carteVitaleIssueDate || '',
    }
  },
  { immediate: true }
)

function formatNir(nir) {
  if (!nir) return null
  const clean = nir.replace(/\D/g, '')
  if (clean.length !== 15) return nir
  return `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)} ${clean.slice(13, 15)}`
}

const nirRules = [
  v => !v || /^\d{15}$/.test(v) || t('CARTE_VITALE_NIR_FORMAT_ERROR'),
]

const issueDateRules = [
  v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || t('CARTE_VITALE_ISSUE_DATE_FORMAT_ERROR'),
]

function openCamera() {
  fileInputRef.value?.click()
}

const scanSteps = [
  { icon: mdiMagnify },
  { icon: mdiRobot },
  { icon: mdiHandshake },
  { icon: mdiAbacus },
  { icon: mdiSnail },
]

function startScanMessages() {
  scanIconIndex.value = 0
  scanMessageInterval = setInterval(() => {
    scanIconIndex.value = (scanIconIndex.value + 1) % scanSteps.length
  }, 3000)
}

function stopScanMessages() {
  clearInterval(scanMessageInterval)
  scanMessageInterval = null
}

onUnmounted(() => stopScanMessages())

async function handleCapture(event, proxyModel) {
  const file = event.target.files?.[0]
  if (!file) return
  event.target.value = ''

  scanning.value = true
  startScanMessages()
  try {
    const imageBase64 = await fileToBase64(file)
    const extractNir = httpsCallable(functions, 'ocr-extractCarteVitaleNir')
    const { data } = await extractNir({ imageBase64 })
    proxyModel.value.carteVitaleNir = data.nir
    if (data.issueDate) {
      proxyModel.value.carteVitaleIssueDate = data.issueDate
    }
    messagesStore.add({ type: 'success', text: t('CARTE_VITALE_SCAN_SUCCESS') })
  } catch (error) {
    const code = error?.code?.replace('functions/', '')
    const key = {
      unauthenticated: 'CARTE_VITALE_SCAN_ERROR_UNAUTHENTICATED',
      'not-found': 'CARTE_VITALE_SCAN_ERROR_NOT_FOUND',
      internal: 'CARTE_VITALE_SCAN_ERROR_INTERNAL',
    }[code] || 'CARTE_VITALE_SCAN_ERROR'
    messagesStore.add({ type: 'error', text: t(key) })
  } finally {
    stopScanMessages()
    scanning.value = false
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleSave(proxyModel, confirmSave) {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const value = proxyModel.value
    const updateData = {
      carteVitaleNir: value.carteVitaleNir.replace(/\D/g, ''),
      carteVitaleIssueDate: value.carteVitaleIssueDate || '',
    }
    await updateDoc(doc(db, `users/${currentUser.value.id}`), updateData)
    confirmSave()
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: t('PROFILE_SAVED') })
  } catch {
    messagesStore.add({ type: 'error', text: t('PROFILE_SAVE_ERROR') })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-card class="mb-4 card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
    <v-confirm-edit v-model="model" hide-actions>
      <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
        <v-form ref="formRef">
          <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
            <span class="text-headline-small font-weight-bold text-truncate">{{ $t('SECTION_CARTE_VITALE') }}</span>
            <v-spacer />
            <template v-if="!isPristine && !$vuetify.display.mobile">
              <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                {{ $t('CANCEL') }}
              </v-btn>
              <v-btn color="primary" rounded="lg" size="small" :loading="saving"
                @click="handleSave(proxyModel, confirmSave)" flat>
                {{ $t('SAVE') }}
              </v-btn>
            </template>
          </v-card-title>

          <v-card-text class="px-4 pt-4">
            <!-- Carte Vitale SVG preview -->
            <div class="cv-wrapper mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" class="cv-svg" role="img"
                :aria-label="$t('SECTION_CARTE_VITALE')">
                <defs>
                  <linearGradient id="cardGreen" x1="180" y1="80" x2="900" y2="540" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#2F9E44" />
                    <stop offset="100%" stop-color="#138A36" />
                  </linearGradient>
                  <linearGradient id="leftBand" x1="0" y1="0" x2="260" y2="620" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#E5A11D" />
                    <stop offset="100%" stop-color="#D89212" />
                  </linearGradient>
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <clipPath id="cardClip">
                    <rect width="1000" height="620" rx="36" />
                  </clipPath>
                </defs>

                <!-- Card background -->
                <rect width="1000" height="620" rx="36" fill="url(#cardGreen)" />

                <!-- Left yellow band -->
                <path d="M0 0H20L250 620H0V0Z" fill="url(#leftBand)" clip-path="url(#cardClip)" />

                <!-- Chip -->
                <g transform="translate(120 210)">
                  <rect x="0" y="0" width="110" height="78" rx="14" fill="#C99963" stroke="#7A5737" stroke-width="2" />
                  <path d="M0 26H110M0 52H110M37 0V78M73 0V78" stroke="#7A5737" stroke-width="2" />
                  <path d="M0 13H37M73 13H110M0 65H37M73 65H110" stroke="#7A5737" stroke-width="2" />
                </g>

                <!-- Photo placeholder -->
                <rect x="690" y="95" width="190" height="240" rx="8" fill="white" filter="url(#softGlow)" />

                <!-- Title -->
                <text x="120" y="145" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="700"
                  fill="#F3B32A">Vitale</text>
                <text x="260" y="190" font-family="Georgia, serif" font-size="28" font-weight="600" fill="#F4F1E8">carte
                  d'assurance maladie</text>

                <!-- Issue date -->
                <text x="280" y="310" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">émise le
                  {{ proxyModel.value.carteVitaleIssueDate || '--/--/----' }}</text>

                <!-- First name -->
                <text x="260" y="420" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">{{
                  currentUser.firstName?.toUpperCase() || '— — —' }}</text>

                <!-- Last name -->
                <text x="260" y="465" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">{{
                  currentUser.lastName?.toUpperCase() || '— — —' }}</text>

                <!-- Number -->
                <text x="260" y="540" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#111111"
                  letter-spacing="1">{{
                    formatNir(proxyModel.value.carteVitaleNir) || '_ __ __ __ ___ ___ __'
                  }}</text>

                <!-- Small tactile dots -->
                <g fill="#C98C1A" opacity="0.9">
                  <circle cx="118" cy="470" r="7" />
                  <circle cx="118" cy="497" r="7" />
                  <circle cx="118" cy="524" r="7" />
                  <circle cx="145" cy="538" r="7" />
                </g>

                <!-- Small white chevron -->
                <path d="M52 558L92 538V550L64 565L92 582V594L52 572V553Z" fill="white" opacity="0.9" />
              </svg>
            </div>

            <!-- Form fields -->
            <v-row>
              <v-col cols="12">
                <v-text-field v-model.trim="proxyModel.value.carteVitaleNir" :label="$t('CARTE_VITALE_NIR')"
                  variant="outlined" rounded="lg" inputmode="numeric" :rules="nirRules"
                  :hint="$t('CARTE_VITALE_NIR_HINT')" persistent-hint />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model.trim="proxyModel.value.carteVitaleIssueDate"
                  :label="$t('CARTE_VITALE_ISSUE_DATE')" variant="outlined" rounded="lg" placeholder="DD/MM/YYYY"
                  :rules="issueDateRules" />
              </v-col>
            </v-row>

            <div :class="$vuetify.display.mobile ? '' : 'd-flex justify-center'">
              <v-btn :block="$vuetify.display.mobile" variant="tonal" rounded="lg" :prepend-icon="mdiCamera"
                :loading="scanning" @click="openCamera" class="text-none mt-2">
                {{ $t('CARTE_VITALE_SCAN') }}
              </v-btn>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*" capture="environment" hidden
              @change="handleCapture($event, proxyModel)" />

            <!-- Scanning dialog -->
            <v-dialog :model-value="scanning" persistent max-width="360">
              <v-card rounded="xl" class="pa-6 text-center">
                <v-row justify="center">
                  <v-icon :icon="scanSteps[scanIconIndex].icon" size="64" color="green" class="my-4 scan-icon" />
                </v-row>
                <v-card-title class="text-h6">{{ $t('CARTE_VITALE_SCAN_TITLE') }}</v-card-title>
              </v-card>
            </v-dialog>
          </v-card-text>

          <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
            <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
              {{ $t('CANCEL') }}
            </v-btn>
            <v-btn color="primary" rounded="lg" size="small" :loading="saving"
              @click="handleSave(proxyModel, confirmSave)" flat>
              {{ $t('SAVE') }}
            </v-btn>
          </div>
        </v-form>
      </template>
    </v-confirm-edit>
  </v-card>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.cv-wrapper {
  display: flex;
  justify-content: center;
}

.cv-svg {
  width: 100%;
  max-width: 480px;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
}

.scan-icon {
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}
</style>
