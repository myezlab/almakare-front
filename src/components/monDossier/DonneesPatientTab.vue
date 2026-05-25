<script setup>
import { ISOToShortenedDate } from "@/composables/useDates"

import { useRules } from "@/composables/useRules"
import gendersEnum from "@/enums/genders.json"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { mdiCalendar, mdiPencil } from "@mdi/js"
import { computed, ref, watch } from "vue"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }
const EMPTY = '-'

const { phoneNumberValidation } = useRules()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const currentUser = computed(() => selfStore.item || {})

const openPanels = ref([])
const addressSelected = ref(false)

const generalFormRef = ref(null)
const clinicalFormRef = ref(null)

const savingGeneral = ref(false)
const savingClinical = ref(false)
const editingGeneral = ref(false)
const editingClinical = ref(false)

const dobDisplay = computed(() => {
  const d = currentUser.value?.dob
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d
  return ISOToShortenedDate(date)
})

const bmiDisplay = computed(() => {
  const w = currentUser.value?.weight
  const h = currentUser.value?.height
  if (!w || !h) return null
  return Math.round(w / (h * h) * 10) / 10
})

const genderLabel = computed(() => GENDER_LABELS[currentUser.value?.gender] || '')

const fullAddress = computed(() => {
  const u = currentUser.value || {}
  return [u.postalAddress, [u.postalCode, u.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
})

const genderOptions = computed(() => gendersEnum.map(g => ({
  title: GENDER_LABELS[g] || g,
  value: g,
})))

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

const showGeneralView = computed(() => !editingGeneral.value)
const showClinicalView = computed(() => !editingClinical.value)

const generalModel = ref({
  firstName: '',
  lastName: '',
  birthName: '',
  gender: '',
  dob: null,
  postalAddress: '',
  city: '',
  postalCode: '',
  phoneNumber: '',
  hasDietaryRestrictions: null,
  dietaryRestrictions: '',
  hasMedicalHistory: null,
  medicalHistory: '',
  carteVitaleNir: '',
  carteVitaleIssueDate: '',
})

const clinicalModel = ref({
  weight: null,
  height: null,
  iah: null,
})

watch(() => currentUser.value, (item) => {
  if (!item?.id) return
  let dob = null
  if (item.dob?.toDate) {
    dob = item.dob.toDate()
  } else if (item.dob) {
    dob = new Date(item.dob)
  }
  generalModel.value = {
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    birthName: item.birthName || '',
    gender: item.gender || '',
    dob,
    postalAddress: item.postalAddress || '',
    city: item.city || '',
    postalCode: item.postalCode || '',
    phoneNumber: item.phoneNumber || '',
    hasDietaryRestrictions: item.hasDietaryRestrictions ?? (item.dietaryRestrictions ? true : null),
    dietaryRestrictions: item.dietaryRestrictions || '',
    hasMedicalHistory: item.hasMedicalHistory ?? (item.medicalHistory ? true : null),
    medicalHistory: item.medicalHistory || '',
    carteVitaleNir: item.carteVitaleNir || '',
    carteVitaleIssueDate: item.carteVitaleIssueDate || '',
  }
  addressSelected.value = !!(item.postalAddress || item.city || item.postalCode)
  clinicalModel.value = {
    weight: item.weight ?? null,
    height: item.height ?? null,
    iah: item.iah ?? null,
  }
}, { immediate: true })

function ensureOpen(value) {
  if (!openPanels.value.includes(value)) openPanels.value.push(value)
}

function startEditGeneral() {
  editingGeneral.value = true
  ensureOpen('general')
}

function startEditClinical() {
  editingClinical.value = true
  ensureOpen('clinical')
}

async function handleSaveGeneral(proxyModel, confirmSave) {
  const { valid } = await generalFormRef.value.validate()
  if (!valid) return
  savingGeneral.value = true
  try {
    const value = proxyModel.value
    const updateData = {
      firstName: value.firstName,
      lastName: value.lastName,
      fullName: `${value.firstName} ${value.lastName}`.trim(),
      birthName: value.birthName,
      gender: value.gender,
      dob: value.dob ? new Date(value.dob).toISOString() : null,
      postalAddress: value.postalAddress,
      city: value.city,
      postalCode: value.postalCode,
      phoneNumber: value.phoneNumber,
      hasDietaryRestrictions: value.hasDietaryRestrictions,
      dietaryRestrictions: value.hasDietaryRestrictions ? value.dietaryRestrictions : '',
      hasMedicalHistory: value.hasMedicalHistory,
      medicalHistory: value.hasMedicalHistory ? value.medicalHistory : '',
      carteVitaleNir: (value.carteVitaleNir || '').replace(/\D/g, ''),
      carteVitaleIssueDate: value.carteVitaleIssueDate || '',
    }
    confirmSave()
    Object.assign(selfStore.item, { ...updateData, dob: value.dob })
    editingGeneral.value = false
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    savingGeneral.value = false
  }
}

function cancelGeneral(cancel) {
  cancel()
  editingGeneral.value = false
}

async function handleSaveClinical(proxyModel, confirmSave) {
  savingClinical.value = true
  try {
    const value = proxyModel.value
    const updateData = {
      weight: value.weight != null ? Number(value.weight) : null,
      height: value.height != null ? Number(value.height) : null,
      iah: value.iah != null ? Number(value.iah) : null,
    }
    confirmSave()
    Object.assign(selfStore.item, updateData)
    editingClinical.value = false
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    savingClinical.value = false
  }
}

function cancelClinical(cancel) {
  cancel()
  editingClinical.value = false
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow"
        :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <!-- Données Générales -->
        <v-expansion-panel value="general">
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-grow-1">
              <span class="text-h6 font-weight-bold text-truncate">Données générales</span>
              <v-spacer />
              <v-btn v-if="showGeneralView" :icon="mdiPencil" variant="text" size="small" density="comfortable"
                class="mr-2" @click.stop="startEditGeneral" />
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- VIEW MODE -->
            <template v-if="showGeneralView">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="field-label">Prénom</div>
                  <div class="field-value">{{ currentUser.firstName || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Nom</div>
                  <div class="field-value">{{ currentUser.lastName || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Email</div>
                  <div class="field-value">{{ currentUser.email || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Nom de naissance</div>
                  <div class="field-value">{{ currentUser.birthName || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Genre</div>
                  <div class="field-value">{{ genderLabel || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Date de naissance</div>
                  <div class="field-value">{{ dobDisplay || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Téléphone</div>
                  <div class="field-value">{{ currentUser.phoneNumber || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Adresse</div>
                  <div class="field-value">{{ fullAddress || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Régime alimentaire</div>
                  <div class="field-value field-value-multiline">
                    {{ currentUser.hasDietaryRestrictions === false
                      ? 'Aucun'
                      : (currentUser.dietaryRestrictions || EMPTY) }}
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Antécédents médicaux</div>
                  <div class="field-value field-value-multiline">
                    {{ currentUser.hasMedicalHistory === false
                      ? 'Aucun'
                      : (currentUser.medicalHistory || EMPTY) }}
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Numéro de sécurité sociale</div>
                  <div class="field-value">{{ formatNir(currentUser.carteVitaleNir) || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Date d'émission carte vitale</div>
                  <div class="field-value">{{ currentUser.carteVitaleIssueDate || EMPTY }}</div>
                </v-col>
                <v-col v-if="currentUser.carteVitaleNir" cols="12">
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
                        <rect x="0" y="0" width="110" height="78" rx="14" fill="#C99963" stroke="#7A5737"
                          stroke-width="2" />
                        <path d="M0 26H110M0 52H110M37 0V78M73 0V78" stroke="#7A5737" stroke-width="2" />
                        <path d="M0 13H37M73 13H110M0 65H37M73 65H110" stroke="#7A5737" stroke-width="2" />
                      </g>
                      <rect x="690" y="95" width="190" height="240" rx="8" fill="white" filter="url(#softGlow)" />
                      <text x="120" y="145" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="700"
                        fill="#F3B32A">Vitale</text>
                      <text x="260" y="190" font-family="Georgia, serif" font-size="28" font-weight="600"
                        fill="#F4F1E8">carte d'assurance maladie</text>
                      <text x="280" y="310" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">
                        émise le {{ currentUser.carteVitaleIssueDate || '--/--/----' }}</text>
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
                </v-col>
              </v-row>
            </template>

            <!-- EDIT MODE -->
            <v-confirm-edit v-else v-model="generalModel" hide-actions>
              <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                <v-form ref="generalFormRef">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.firstName" label="Prénom" variant="outlined"
                        rounded="lg" :rules="[v => !!v || 'Ce champ est requis']" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.lastName" label="Nom" variant="outlined" rounded="lg"
                        :rules="[v => !!v || 'Ce champ est requis']" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field :model-value="currentUser.email" label="Email" variant="outlined" rounded="lg"
                        disabled />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.birthName" label="Nom de naissance"
                        variant="outlined" rounded="lg" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select v-model="proxyModel.value.gender" label="Genre" :items="genderOptions"
                        variant="outlined" rounded="lg" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-date-input v-model="proxyModel.value.dob" input-format="dd/MM/yyyy" label="Date de naissance"
                        variant="outlined" rounded="lg" :prepend-inner-icon="mdiCalendar" prepend-icon="" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.phoneNumber" label="Téléphone" variant="outlined"
                        rounded="lg" inputmode="tel" :rules="[phoneNumberValidation]" />
                    </v-col>

                    <v-col cols="12">
                      <v-text-field v-model.trim="proxyModel.value.postalAddress" label="Adresse" variant="outlined"
                        rounded="lg" @update:model-value="addressSelected = !!$event" />
                    </v-col>

                    <v-col v-if="addressSelected" cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.city" label="Ville" variant="outlined"
                        rounded="lg" />
                    </v-col>

                    <v-col v-if="addressSelected" cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.postalCode" label="Code postal" variant="outlined"
                        rounded="lg" inputmode="numeric" />
                    </v-col>

                    <v-col cols="12">
                      <div class="field-label mb-2">Suivez-vous un régime alimentaire&nbsp;?</div>
                      <v-btn-toggle v-model="proxyModel.value.hasDietaryRestrictions" mandatory="force" color="primary"
                        rounded="lg" density="comfortable" variant="outlined" class="mb-3">
                        <v-btn :value="true" class="text-none">Oui</v-btn>
                        <v-btn :value="false" class="text-none">Non</v-btn>
                      </v-btn-toggle>
                      <v-textarea v-if="proxyModel.value.hasDietaryRestrictions === true"
                        v-model.trim="proxyModel.value.dietaryRestrictions" label="Précisez votre régime"
                        variant="outlined" rounded="lg" rows="2" auto-grow
                        :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="field-label mb-2">Avez-vous des antécédents médicaux&nbsp;?</div>
                      <v-btn-toggle v-model="proxyModel.value.hasMedicalHistory" mandatory="force" color="primary"
                        rounded="lg" density="comfortable" variant="outlined" class="mb-3">
                        <v-btn :value="true" class="text-none">Oui</v-btn>
                        <v-btn :value="false" class="text-none">Non</v-btn>
                      </v-btn-toggle>
                      <v-textarea v-if="proxyModel.value.hasMedicalHistory === true"
                        v-model.trim="proxyModel.value.medicalHistory" label="Précisez vos antécédents"
                        variant="outlined" rounded="lg" rows="2" auto-grow
                        :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.carteVitaleNir"
                        label="Numéro de sécurité sociale" variant="outlined" rounded="lg" inputmode="numeric"
                        :rules="nirRules" hint="15 chiffres sans espaces" persistent-hint />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="proxyModel.value.carteVitaleIssueDate"
                        label="Date d'émission carte vitale" variant="outlined" rounded="lg" placeholder="JJ/MM/AAAA"
                        :rules="issueDateRules" />
                    </v-col>
                  </v-row>

                  <div class="d-flex justify-end">
                    <v-btn variant="text" rounded="lg" size="small" @click="cancelGeneral(cancel)" class="text-none">
                      Annuler
                    </v-btn>
                    <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingGeneral"
                      @click="handleSaveGeneral(proxyModel, confirmSave)" flat>
                      Enregistrer
                    </v-btn>
                  </div>
                </v-form>
              </template>
            </v-confirm-edit>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Données Cliniques -->
        <v-expansion-panel value="clinical">
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-grow-1">
              <span class="text-h6 font-weight-bold text-truncate">Données cliniques</span>
              <v-spacer />
              <v-btn v-if="showClinicalView" :icon="mdiPencil" variant="text" size="small" density="comfortable"
                class="mr-2" @click.stop="startEditClinical" />
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- VIEW MODE -->
            <template v-if="showClinicalView">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="field-label">Poids</div>
                  <div class="field-value">{{ currentUser.weight != null ? `${currentUser.weight} kg` : EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Taille</div>
                  <div class="field-value">{{ currentUser.height != null ? `${currentUser.height} m` : EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">IMC</div>
                  <div class="field-value">{{ bmiDisplay != null ? bmiDisplay : EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">IAH</div>
                  <div class="field-value">{{ currentUser.iah != null ? currentUser.iah : EMPTY }}</div>
                </v-col>
              </v-row>
            </template>

            <!-- EDIT MODE -->
            <v-confirm-edit v-else v-model="clinicalModel" hide-actions>
              <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                <v-form ref="clinicalFormRef">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model.number="proxyModel.value.weight" label="Poids (kg)" variant="outlined"
                        rounded="lg" inputmode="decimal" type="number" step="0.1" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.number="proxyModel.value.height" label="Taille (m)" variant="outlined"
                        rounded="lg" inputmode="decimal" type="number" step="0.01" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="proxyModel.value.weight && proxyModel.value.height ? Math.round(proxyModel.value.weight / (proxyModel.value.height * proxyModel.value.height) * 10) / 10 : ''"
                        label="IMC (calculé)" variant="outlined" rounded="lg" readonly />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.number="proxyModel.value.iah" label="IAH" variant="outlined" rounded="lg"
                        inputmode="decimal" type="number" step="0.1" />
                    </v-col>
                  </v-row>

                  <div class="d-flex justify-end">
                    <v-btn variant="text" rounded="lg" size="small" @click="cancelClinical(cancel)" class="text-none">
                      Annuler
                    </v-btn>
                    <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingClinical"
                      @click="handleSaveClinical(proxyModel, confirmSave)" flat>
                      Enregistrer
                    </v-btn>
                  </div>
                </v-form>
              </template>
            </v-confirm-edit>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Conclusion de la dernière consultation -->
        <v-expansion-panel value="lastConsultation">
          <v-expansion-panel-title>
            <span class="text-h6 font-weight-bold text-truncate">Conclusion de la dernière consultation</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text />
        </v-expansion-panel>

        <!-- Médecin Traitant -->
        <v-expansion-panel value="medecinTraitant">
          <v-expansion-panel-title>
            <span class="text-h6 font-weight-bold text-truncate">Médecin Traitant</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text />
        </v-expansion-panel>

        <!-- Médecin Adresseur -->
        <v-expansion-panel value="medecinAdresseur">
          <v-expansion-panel-title>
            <span class="text-h6 font-weight-bold text-truncate">Médecin Adresseur (si différent du médecin traitant)</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text />
        </v-expansion-panel>

        <!-- Prestataire -->
        <v-expansion-panel value="prestataire">
          <v-expansion-panel-title>
            <span class="text-h6 font-weight-bold text-truncate">Prestataire</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text />
        </v-expansion-panel>

      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<style scoped>
.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 4px;
}

.field-value {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.4;
  word-break: break-word;
}

.field-value-multiline {
  white-space: pre-wrap;
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
