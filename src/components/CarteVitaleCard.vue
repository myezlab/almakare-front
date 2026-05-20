<script setup>
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from "@/stores/self"
import { mdiPencil } from "@mdi/js"
import { computed, ref, watch } from "vue"

const messagesStore = useMessagesStore()
const selfStore = useSelfStore()

const formRef = ref(null)
const saving = ref(false)
const editing = ref(false)
const currentUser = computed(() => selfStore.item || {})

const hasCarteVitale = computed(() => !!currentUser.value.carteVitaleNir)
const showView = computed(() => hasCarteVitale.value && !editing.value)

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
  v => !v || /^\d{15}$/.test(v) || 'Le numéro doit contenir 15 chiffres',
]

const issueDateRules = [
  v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || 'Format attendu : JJ/MM/AAAA',
]

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
    confirmSave()
    Object.assign(selfStore.item, updateData)
    editing.value = false
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    saving.value = false
  }
}

function cancelEdit(cancel) {
  cancel()
  editing.value = false
}
</script>

<template>
  <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
    <!-- VIEW MODE -->
    <template v-if="showView">
      <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
        <span class="text-headline-small font-weight-bold text-truncate">Carte Vitale</span>
        <v-spacer />
        <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable" @click="editing = true" />
      </v-card-title>
      <v-card-text class="px-4 pt-4">
        <div class="cv-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" class="cv-svg" role="img"
            aria-label="Carte Vitale">
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
            <rect width="1000" height="620" rx="36" fill="url(#cardGreen)" />
            <path d="M0 0H20L250 620H0V0Z" fill="url(#leftBand)" clip-path="url(#cardClip)" />
            <g transform="translate(120 210)">
              <rect x="0" y="0" width="110" height="78" rx="14" fill="#C99963" stroke="#7A5737" stroke-width="2" />
              <path d="M0 26H110M0 52H110M37 0V78M73 0V78" stroke="#7A5737" stroke-width="2" />
              <path d="M0 13H37M73 13H110M0 65H37M73 65H110" stroke="#7A5737" stroke-width="2" />
            </g>
            <rect x="690" y="95" width="190" height="240" rx="8" fill="white" filter="url(#softGlow)" />
            <text x="120" y="145" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="700"
              fill="#F3B32A">Vitale</text>
            <text x="260" y="190" font-family="Georgia, serif" font-size="28" font-weight="600" fill="#F4F1E8">carte
              d'assurance maladie</text>
            <text x="280" y="310" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">émise le
              {{ currentUser.carteVitaleIssueDate || '--/--/----' }}</text>
            <text x="260" y="420" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">{{
              currentUser.firstName?.toUpperCase() || '— — —' }}</text>
            <text x="260" y="465" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">{{
              currentUser.lastName?.toUpperCase() || '— — —' }}</text>
            <text x="260" y="540" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#111111"
              letter-spacing="1">{{ formatNir(currentUser.carteVitaleNir) || '_ __ __ __ ___ ___ __' }}</text>
            <g fill="#C98C1A" opacity="0.9">
              <circle cx="118" cy="470" r="7" />
              <circle cx="118" cy="497" r="7" />
              <circle cx="118" cy="524" r="7" />
              <circle cx="145" cy="538" r="7" />
            </g>
            <path d="M52 558L92 538V550L64 565L92 582V594L52 572V553Z" fill="white" opacity="0.9" />
          </svg>
        </div>
      </v-card-text>
    </template>

    <!-- EDIT MODE -->
    <v-confirm-edit v-else v-model="model" hide-actions>
      <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
        <v-form ref="formRef">
          <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
            <span class="text-headline-small font-weight-bold text-truncate">Carte Vitale</span>
            <v-spacer />
            <template v-if="(editing || !isPristine) && !$vuetify.display.mobile">
              <v-btn variant="text" rounded="lg" size="small" @click="cancelEdit(cancel)" class="text-none">
                Annuler
              </v-btn>
              <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="saving"
                @click="handleSave(proxyModel, confirmSave)" flat>
                Enregistrer
              </v-btn>
            </template>
          </v-card-title>

          <v-card-text class="px-4 pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.carteVitaleNir" label="Numéro de sécurité sociale"
                  variant="outlined" rounded="lg" inputmode="numeric" :rules="nirRules"
                  hint="15 chiffres sans espaces" persistent-hint />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="proxyModel.value.carteVitaleIssueDate" label="Date d'émission"
                  variant="outlined" rounded="lg" placeholder="JJ/MM/AAAA" :rules="issueDateRules" />
              </v-col>
            </v-row>
          </v-card-text>

          <div v-if="(editing || !isPristine) && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
            <v-btn variant="text" rounded="lg" size="small" @click="cancelEdit(cancel)" class="text-none">
              Annuler
            </v-btn>
            <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="saving"
              @click="handleSave(proxyModel, confirmSave)" flat>
              Enregistrer
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
  animation: cv-fade-in 500ms ease-out;
}

@keyframes cv-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
