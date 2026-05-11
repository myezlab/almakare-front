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
  attestationName: '',
  attestationSsn: '',
  attestationBirthDate: '',
  attestationCoverageValid: false,
  attestationOrganization: '',
  attestationAffectionLongueDuree: false,
})

watch(
  () => currentUser.value,
  (item) => {
    if (!item?.id) return
    model.value = {
      attestationName: item.attestationName || '',
      attestationSsn: item.attestationSsn || '',
      attestationBirthDate: item.attestationBirthDate || '',
      attestationCoverageValid: item.attestationCoverageValid || false,
      attestationOrganization: item.attestationOrganization || '',
      attestationAffectionLongueDuree: item.attestationAffectionLongueDuree || false,
    }
  },
  { immediate: true }
)

function formatSsn(ssn) {
  if (!ssn) return null
  const clean = ssn.replace(/\D/g, '')
  if (clean.length === 15) {
    return `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)} ${clean.slice(13, 15)}`
  }
  if (clean.length === 13) {
    return `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)}`
  }
  return ssn
}

const ssnRules = [
  v => !v || /^\d{13}$/.test(v) || /^\d{15}$/.test(v) || t('ATTESTATION_SSN_FORMAT_ERROR'),
]

const birthDateRules = [
  v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || t('ATTESTATION_BIRTH_DATE_FORMAT_ERROR'),
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
    const extractAttestation = httpsCallable(functions, 'ocr-extractAttestationSecuriteSociale')
    const { data } = await extractAttestation({ imageBase64 })
    if (data.ssn) proxyModel.value.attestationSsn = data.ssn
    if (data.name) proxyModel.value.attestationName = data.name
    if (data.birthDate) proxyModel.value.attestationBirthDate = data.birthDate
    if (data.organization) proxyModel.value.attestationOrganization = data.organization
    proxyModel.value.attestationCoverageValid = data.coverageValid === true
    proxyModel.value.attestationAffectionLongueDuree = data.affectionLongueDuree === true
    messagesStore.add({ type: 'success', text: t('ATTESTATION_SCAN_SUCCESS') })
  } catch (error) {
    const code = error?.code?.replace('functions/', '')
    const key = {
      unauthenticated: 'ATTESTATION_SCAN_ERROR_UNAUTHENTICATED',
      'not-found': 'ATTESTATION_SCAN_ERROR_NOT_FOUND',
      internal: 'ATTESTATION_SCAN_ERROR_INTERNAL',
    }[code] || 'ATTESTATION_SCAN_ERROR'
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
      attestationName: value.attestationName || '',
      attestationSsn: value.attestationSsn.replace(/\D/g, ''),
      attestationBirthDate: value.attestationBirthDate || '',
      attestationCoverageValid: value.attestationCoverageValid,
      attestationOrganization: value.attestationOrganization || '',
      attestationAffectionLongueDuree: value.attestationAffectionLongueDuree,
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
  <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
    <v-confirm-edit v-model="model" hide-actions>
      <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
        <v-form ref="formRef">
          <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
            <span class="text-headline-small font-weight-bold text-truncate">{{ $t('SECTION_ATTESTATION_SECURITE_SOCIALE') }}</span>
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
            <!-- Attestation document preview -->
            <div class="attestation-wrapper mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" class="attestation-svg" role="img"
                :aria-label="$t('SECTION_ATTESTATION_SECURITE_SOCIALE')">
                <defs>
                  <clipPath id="attestClip">
                    <rect width="800" height="520" rx="12" />
                  </clipPath>
                </defs>

                <!-- White background -->
                <rect width="800" height="520" rx="12" fill="#FFFFFF" clip-path="url(#attestClip)" />

                <!-- Blue header band -->
                <rect width="800" height="110" fill="#003189" clip-path="url(#attestClip)" />

                <!-- Orange accent stripe -->
                <rect y="110" width="800" height="6" fill="#E84E0F" />

                <!-- Header: Assurance Maladie -->
                <text x="40" y="58" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700"
                  fill="#FFFFFF">Assurance Maladie</text>
                <text x="40" y="88" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#A8C4F4">
                  Attestation de droits
                </text>

                <!-- Organization top-right -->
                <text x="760" y="58" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#A8C4F4"
                  text-anchor="end">
                  {{ proxyModel.value.attestationOrganization || 'CPAM —' }}
                </text>

                <!-- Name -->
                <text x="40" y="170" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#666666">NOM ET PRÉNOM</text>
                <text x="40" y="195" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600"
                  fill="#111111">{{ proxyModel.value.attestationName || '— — —' }}</text>

                <!-- Separator -->
                <line x1="40" y1="213" x2="760" y2="213" stroke="#E0E0E0" stroke-width="1" />

                <!-- SSN -->
                <text x="40" y="240" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#666666">N° DE SÉCURITÉ SOCIALE</text>
                <text x="40" y="265" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600"
                  fill="#111111" letter-spacing="1">{{
                    formatSsn(proxyModel.value.attestationSsn) || '_ __ __ __ ___ ___'
                  }}</text>

                <!-- Separator -->
                <line x1="40" y1="283" x2="760" y2="283" stroke="#E0E0E0" stroke-width="1" />

                <!-- Birth date + Coverage -->
                <text x="40" y="310" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#666666">DATE DE NAISSANCE</text>
                <text x="40" y="335" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#111111">{{
                  proxyModel.value.attestationBirthDate || '--/--/----'
                }}</text>

                <text x="420" y="310" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#666666">DROITS</text>
                <rect x="420" y="318" width="120" height="26" rx="6"
                  :fill="proxyModel.value.attestationCoverageValid ? '#E6F4EA' : '#FDE8E8'" />
                <text x="480" y="336" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600"
                  text-anchor="middle"
                  :fill="proxyModel.value.attestationCoverageValid ? '#1B7C3A' : '#C62828'">
                  {{ proxyModel.value.attestationCoverageValid ? 'OUVERTS' : 'FERMÉS' }}
                </text>

                <!-- Separator -->
                <line x1="40" y1="360" x2="760" y2="360" stroke="#E0E0E0" stroke-width="1" />

                <!-- ALD -->
                <text x="40" y="390" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#666666">AFFECTION DE LONGUE DURÉE (ALD)</text>
                <rect x="40" y="400" width="100" height="26" rx="6"
                  :fill="proxyModel.value.attestationAffectionLongueDuree ? '#FFF3E0' : '#F5F5F5'" />
                <text x="90" y="418" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600"
                  text-anchor="middle"
                  :fill="proxyModel.value.attestationAffectionLongueDuree ? '#E65100' : '#757575'">
                  {{ proxyModel.value.attestationAffectionLongueDuree ? 'OUI' : 'NON' }}
                </text>

                <!-- Footer -->
                <rect y="480" width="800" height="40" fill="#F5F7FF" clip-path="url(#attestClip)" />
                <text x="400" y="505" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#888888"
                  text-anchor="middle">ameli.fr — Assurance Maladie</text>
              </svg>
            </div>

            <!-- Form fields -->
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.attestationName" :label="$t('ATTESTATION_NAME')"
                  variant="outlined" rounded="lg" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.attestationSsn" :label="$t('ATTESTATION_SSN')"
                  variant="outlined" rounded="lg" inputmode="numeric" :rules="ssnRules"
                  :hint="$t('ATTESTATION_SSN_HINT')" persistent-hint />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.attestationBirthDate"
                  :label="$t('ATTESTATION_BIRTH_DATE')" variant="outlined" rounded="lg"
                  placeholder="DD/MM/YYYY" :rules="birthDateRules" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.attestationOrganization"
                  :label="$t('ATTESTATION_ORGANIZATION')" variant="outlined" rounded="lg" />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox v-model="proxyModel.value.attestationCoverageValid"
                  :label="$t('ATTESTATION_COVERAGE_VALID')" color="success" hide-details />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox v-model="proxyModel.value.attestationAffectionLongueDuree"
                  :label="$t('ATTESTATION_ALD')" color="warning" hide-details />
              </v-col>
            </v-row>

            <div :class="$vuetify.display.mobile ? '' : 'd-flex justify-center'">
              <v-btn :block="$vuetify.display.mobile" variant="tonal" rounded="lg" :prepend-icon="mdiCamera"
                :loading="scanning" @click="openCamera" class="text-none mt-4">
                {{ $t('ATTESTATION_SCAN') }}
              </v-btn>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*" capture="environment" hidden
              @change="handleCapture($event, proxyModel)" />

            <!-- Scanning dialog -->
            <v-dialog :model-value="scanning" persistent max-width="360">
              <v-card rounded="xl" class="pa-6 text-center">
                <v-row justify="center">
                  <v-icon :icon="scanSteps[scanIconIndex].icon" size="64" color="primary" class="my-4 scan-icon" />
                </v-row>
                <v-card-title class="text-h6">{{ $t('ATTESTATION_SCAN_TITLE') }}</v-card-title>
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

.attestation-wrapper {
  display: flex;
  justify-content: center;
}

.attestation-svg {
  width: 100%;
  max-width: 480px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
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
