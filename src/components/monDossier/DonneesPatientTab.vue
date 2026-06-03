<script setup>
import DoctorCard from "@/components/DoctorCard.vue"
import { ISOToDDMMYYYY, ISOToShortenedDate } from "@/composables/useDates"

import { diffSnapshots, formatNir, generalSnapshot, useProfileHistory } from "@/composables/useProfileHistory"
import { useRules } from "@/composables/useRules"
import { useUrlPanels } from "@/composables/useUrlPanels"
import ACTIVITIES_DATA from "@/data/activities.json"
import { DOCTORS_SEED } from "@/data/doctors"
import gendersEnum from "@/enums/genders.json"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { mdiCalendar, mdiClipboardTextOutline, mdiDoctor, mdiFileDocumentEditOutline, mdiHistory, mdiMagnify, mdiPencil, mdiTruckOutline } from "@mdi/js"
import dayjs from "dayjs"
import { computed, ref, watch } from "vue"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }
const SLEEP_LATENCY_LABELS = { rapide: 'Rapide', lente: 'Lente' }
const EMPTY = '-'

const { phoneNumberValidation } = useRules()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { ensureSeed, recordHistory } = useProfileHistory()

const currentUser = computed(() => selfStore.item || {})

const openPanels = useUrlPanels("dpPanels")
const addressSelected = ref(false)

const generalFormRef = ref(null)

const savingGeneral = ref(false)
const editingGeneral = ref(false)

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

const hasClinicalData = computed(() => {
  const u = currentUser.value || {}
  return u.weight != null || u.height != null || u.iah != null || u.sleepLatency != null
})

const lastConsultationReport = computed(() => {
  const today = dayjs().startOf('day')
  return [...ACTIVITIES_DATA]
    .filter(a => !a.cancelled && a.report && !dayjs(a.date).isAfter(today))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0] || null
})

const fullAddress = computed(() => {
  const u = currentUser.value || {}
  return [u.postalAddress, [u.postalCode, u.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
})

const genderOptions = computed(() => gendersEnum.map(g => ({
  title: GENDER_LABELS[g] || g,
  value: g,
})))

const nirRules = [
  v => !v || /^\d{15}$/.test(v) || 'Le numéro doit contenir 15 chiffres',
]

const issueDateRules = [
  v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v) || 'Format attendu : JJ/MM/AAAA',
]

// ----- Modification history --------------------------------------------------
const HISTORY_SECTION_LABELS = { general: 'Données générales', clinical: 'Données cliniques' }

const historyDialogOpen = ref(false)
const historySection = ref('general')

const history = computed(() => selfStore.item?.history || [])

const historyEntries = computed(() =>
  history.value
    .filter(e => e.section === historySection.value)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
)

function openHistory(section) {
  historySection.value = section
  historyDialogOpen.value = true
}

const showGeneralView = computed(() => !editingGeneral.value)

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

watch(() => currentUser.value, (item) => {
  if (!item?.id) return
  ensureSeed()
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
}, { immediate: true })

function ensureOpen(value) {
  if (!openPanels.value.includes(value)) openPanels.value.push(value)
}

function startEditGeneral() {
  editingGeneral.value = true
  ensureOpen('general')
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
    const before = generalSnapshot(currentUser.value)
    confirmSave()
    Object.assign(selfStore.item, { ...updateData, dob: value.dob })
    recordHistory('general', diffSnapshots(before, generalSnapshot(selfStore.item)))
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

const MEDECIN_TARGETS = {
  medecinTraitant: { field: 'medecinTraitant', panel: 'medecinTraitant', successText: 'Médecin traitant mis à jour' },
  medecinAdresseur: { field: 'medecinAdresseur', panel: 'medecinAdresseur', successText: 'Médecin adresseur mis à jour' },
}

const medecinDialogOpen = ref(false)
const medecinDialogTarget = ref(null)
const medecinSearchRpps = ref('')
const medecinSearchLastName = ref('')
const medecinSearchResults = ref([])
const medecinSearchPerformed = ref(false)

const medecinTraitant = computed(() => currentUser.value?.medecinTraitant || null)
const medecinAdresseur = computed(() => currentUser.value?.medecinAdresseur || null)

function medecinName(doctor) {
  if (!doctor) return ''
  return `Dr ${[doctor.firstName, doctor.lastName].filter(Boolean).join(' ')}`.trim()
}

function openMedecinDialog(targetKey) {
  medecinDialogTarget.value = MEDECIN_TARGETS[targetKey] || null
  medecinSearchRpps.value = ''
  medecinSearchLastName.value = ''
  medecinSearchResults.value = []
  medecinSearchPerformed.value = false
  medecinDialogOpen.value = true
}

function searchMedecins() {
  const rpps = medecinSearchRpps.value.trim()
  const name = medecinSearchLastName.value.trim().toLowerCase()
  medecinSearchResults.value = DOCTORS_SEED.filter(d => {
    const matchRpps = rpps ? d.rpps.includes(rpps) : true
    const matchName = name ? d.lastName.toLowerCase().includes(name) : true
    return matchRpps && matchName
  })
  medecinSearchPerformed.value = true
}

function selectMedecin(doctor) {
  const target = medecinDialogTarget.value
  if (!target) return
  selfStore.item[target.field] = { ...doctor }
  medecinDialogOpen.value = false
  ensureOpen(target.panel)
  messagesStore.add({ type: 'success', text: target.successText })
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow pa-2"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <!-- Données Générales -->
          <v-expansion-panel value="general">
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-grow-1">
                <span class="panel-title">Données générales</span>
                <v-spacer />
                <v-btn v-if="showGeneralView" :icon="mdiPencil" color="primary" variant="text" size="small"
                  density="comfortable" class="mr-2" @click.stop="startEditGeneral" />
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
                    <div class="field-value whitespace-pre-line">
                      {{ currentUser.hasDietaryRestrictions === false
                        ? 'Aucun'
                        : (currentUser.dietaryRestrictions || EMPTY) }}
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="field-label">Antécédents médicaux</div>
                    <div class="field-value whitespace-pre-line">
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
                    <div class="d-flex justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" class="cv-svg" role="img"
                        aria-label="Carte Vitale">
                        <defs>
                          <linearGradient id="cardGreen" x1="180" y1="80" x2="900" y2="540"
                            gradientUnits="userSpaceOnUse">
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
                        <text x="120" y="145" font-family="Arial, Helvetica, sans-serif" font-size="110"
                          font-weight="700" fill="#F3B32A">Vitale</text>
                        <text x="260" y="190" font-family="Georgia, serif" font-size="28" font-weight="600"
                          fill="#F4F1E8">carte d'assurance maladie</text>
                        <text x="280" y="310" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111111">
                          émise le {{ currentUser.carteVitaleIssueDate || '--/--/----' }}</text>
                        <text x="260" y="420" font-family="Arial, Helvetica, sans-serif" font-size="34"
                          fill="#111111">{{
                            currentUser.firstName?.toUpperCase() || '— — —' }}</text>
                        <text x="260" y="465" font-family="Arial, Helvetica, sans-serif" font-size="34"
                          fill="#111111">{{
                            currentUser.lastName?.toUpperCase() || '— — —' }}</text>
                        <text x="260" y="540" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#111111"
                          letter-spacing="1">{{ formatNir(currentUser.carteVitaleNir) || '_ __ __ __ ___ ___ __'
                          }}</text>
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
                <div class="d-flex justify-start mt-2">
                  <v-btn variant="text" rounded="lg" size="small" class="text-none" :prepend-icon="mdiHistory"
                    @click="openHistory('general')">
                    Historique
                  </v-btn>
                </div>
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
                        <v-text-field v-model.trim="proxyModel.value.lastName" label="Nom" variant="outlined"
                          rounded="lg" :rules="[v => !!v || 'Ce champ est requis']" />
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
                        <v-btn-toggle v-model="proxyModel.value.hasDietaryRestrictions" mandatory="force"
                          color="primary" rounded="lg" density="comfortable" variant="outlined" class="mb-3">
                          <v-btn :value="true" class="text-none">Oui</v-btn>
                          <v-btn :value="false" class="text-none">Non</v-btn>
                        </v-btn-toggle>
                        <v-textarea v-if="proxyModel.value.hasDietaryRestrictions === true"
                          v-model.trim="proxyModel.value.dietaryRestrictions" label="Précisez votre régime"
                          variant="outlined" rounded="lg" rows="2" auto-grow
                          :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
                      </v-col>

                      <v-col cols="12">
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
                        <v-text-field v-model.trim="proxyModel.value.carteVitaleNir" label="Numéro de sécurité sociale"
                          variant="outlined" rounded="lg" inputmode="numeric" :rules="nirRules"
                          hint="15 chiffres sans espaces" persistent-hint />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.carteVitaleIssueDate"
                          label="Date d'émission carte vitale" variant="outlined" rounded="lg" placeholder="JJ/MM/AAAA"
                          :rules="issueDateRules" />
                      </v-col>
                    </v-row>

                    <div v-if="!isPristine" class="d-flex justify-end">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancelGeneral(cancel)" class="text-none">
                        Annuler
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingGeneral"
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
          <v-expansion-panel v-if="hasClinicalData" value="clinical">
            <v-expansion-panel-title>
              <span class="panel-title">Données cliniques</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
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
                <v-col cols="12" md="6">
                  <div class="field-label">Latence d'endormissement</div>
                  <div class="field-value">{{ SLEEP_LATENCY_LABELS[currentUser.sleepLatency] || EMPTY }}</div>
                </v-col>
              </v-row>
              <div class="d-flex justify-start mt-2">
                <v-btn variant="text" rounded="lg" size="small" class="text-none" :prepend-icon="mdiHistory"
                  @click="openHistory('clinical')">
                  Historique
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Compte rendu de la dernière consultation -->
          <v-expansion-panel value="lastConsultation">
            <v-expansion-panel-title>
              <span class="panel-title">Compte rendu de la dernière consultation</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-alert v-if="lastConsultationReport" type="warning" variant="tonal"
                :icon="mdiFileDocumentEditOutline" density="comfortable" rounded="lg">
                <div class="text-body-small font-weight-bold mb-1">
                  Rapport médecin — {{ lastConsultationReport.doctor }} — {{ ISOToDDMMYYYY(lastConsultationReport.date) }}
                </div>
                <div class="text-body-medium">{{ lastConsultationReport.report }}</div>
              </v-alert>
              <div v-else class="d-flex flex-column align-center text-center pa-6 empty-state">
                <div class="empty-state-icon mb-3">
                  <v-icon :icon="mdiClipboardTextOutline" size="32" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucune consultation</div>
                <div class="text-body-small text-medium-emphasis">
                  La conclusion de votre dernière consultation apparaîtra ici.
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Médecin Traitant -->
          <v-expansion-panel value="medecinTraitant">
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-grow-1">
                <span class="panel-title">Médecin Traitant</span>
                <v-spacer />
                <v-btn :icon="mdiPencil" color="primary" variant="text" size="small" density="comfortable" class="mr-2"
                  @click.stop="openMedecinDialog('medecinTraitant')" />
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <template v-if="medecinTraitant">
                <DoctorCard :doctor="medecinTraitant" :name="medecinName(medecinTraitant)" />
              </template>
              <div v-else class="d-flex flex-column align-center text-center pa-6 empty-state">
                <div class="empty-state-icon mb-3">
                  <v-icon :icon="mdiDoctor" size="32" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun médecin traitant</div>
                <div class="text-body-small text-medium-emphasis mb-4">
                  Renseignez votre médecin traitant pour faciliter votre suivi.
                </div>
                <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :prepend-icon="mdiMagnify"
                  @click="openMedecinDialog('medecinTraitant')">
                  Rechercher un médecin
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Médecin Adresseur -->
          <v-expansion-panel value="medecinAdresseur">
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-grow-1">
                <span class="panel-title">Médecin Adresseur (si différent du médecin traitant)</span>
                <v-spacer />
                <v-btn :icon="mdiPencil" color="primary" variant="text" size="small" density="comfortable" class="mr-2"
                  @click.stop="openMedecinDialog('medecinAdresseur')" />
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <template v-if="medecinAdresseur">
                <DoctorCard :doctor="medecinAdresseur" :name="medecinName(medecinAdresseur)" />
              </template>
              <div v-else class="d-flex flex-column align-center text-center pa-6 empty-state">
                <div class="empty-state-icon mb-3">
                  <v-icon :icon="mdiDoctor" size="32" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun médecin adresseur</div>
                <div class="text-body-small text-medium-emphasis mb-4">
                  Renseignez le médecin qui vous a adressé, s'il diffère du médecin traitant.
                </div>
                <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :prepend-icon="mdiMagnify"
                  @click="openMedecinDialog('medecinAdresseur')">
                  Rechercher un médecin
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Prestataire -->
          <v-expansion-panel value="prestataire">
            <v-expansion-panel-title>
              <span class="panel-title">Prestataire</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-column align-center text-center pa-6 empty-state">
                <div class="empty-state-icon mb-3">
                  <v-icon :icon="mdiTruckOutline" size="32" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun prestataire</div>
                <div class="text-body-small text-medium-emphasis">
                  Votre prestataire de santé apparaîtra ici une fois renseigné.
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>

    <!-- =================== MÉDECIN TRAITANT DIALOG =================== -->
    <v-dialog v-model="medecinDialogOpen" max-width="700" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-title class="d-flex align-center pa-4">
          <span class="text-headline-small font-weight-bold">Médecin</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-form @submit.prevent="searchMedecins">
            <v-row density="comfortable">
              <v-col cols="12" md>
                <v-text-field v-model.trim="medecinSearchRpps" label="RPPS" variant="outlined" rounded="lg"
                  inputmode="numeric" hide-details />
              </v-col>
              <v-col cols="12" md>
                <v-text-field v-model.trim="medecinSearchLastName" label="Nom" variant="outlined" rounded="lg"
                  hide-details />
              </v-col>
              <v-col cols="12" md="auto" class="d-flex align-center">
                <v-btn color="primary" variant="flat" rounded="lg" class="text-none" height="56" block
                  :prepend-icon="mdiMagnify" @click="searchMedecins">
                  Rechercher
                </v-btn>
              </v-col>
            </v-row>
          </v-form>

          <template v-if="medecinSearchResults.length">
            <v-table v-if="!$vuetify.display.mobile" class="mt-4 medecin-table" density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">RPPS</th>
                  <th class="text-left">Nom</th>
                  <th class="text-left">Prénom</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in medecinSearchResults" :key="d.rpps" class="medecin-row" @click="selectMedecin(d)">
                  <td>{{ d.rpps }}</td>
                  <td>{{ d.lastName }}</td>
                  <td>{{ d.firstName }}</td>
                </tr>
              </tbody>
            </v-table>

            <div v-else class="mt-4 d-flex flex-column ga-2">
              <v-card v-for="d in medecinSearchResults" :key="d.rpps" flat variant="outlined" rounded="lg"
                class="medecin-card pa-3" @click="selectMedecin(d)">
                <div class="field-label">RPPS</div>
                <div class="field-value mb-2">{{ d.rpps }}</div>
                <div class="field-label">Nom / Prénom</div>
                <div class="field-value">{{ d.lastName }} {{ d.firstName }}</div>
              </v-card>
            </div>
          </template>

          <div v-else-if="medecinSearchPerformed" class="text-body-small text-medium-emphasis mt-4 text-center">
            Aucun médecin trouvé.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="medecinDialogOpen = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== HISTORIQUE DIALOG =================== -->
    <v-dialog v-model="historyDialogOpen" max-width="640" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="mdiHistory" class="mr-2" />
          <span class="text-headline-small font-weight-bold">Historique des modifications</span>
        </v-card-title>
        <div class="px-4 pb-2 text-body-small text-medium-emphasis">
          {{ HISTORY_SECTION_LABELS[historySection] }}
        </div>
        <v-divider />
        <v-card-text class="pa-4">
          <v-timeline v-if="historyEntries.length" side="end" align="start" density="comfortable" truncate-line="both">
            <v-timeline-item v-for="entry in historyEntries" :key="entry.id" dot-color="primary" size="x-small">
              <div class="d-flex align-center mb-1">
                <span class="text-body-small font-weight-bold">{{ ISOToDDMMYYYY(entry.date) }}</span>
                <span class="text-body-small text-medium-emphasis ml-2">— {{ entry.author }}</span>
              </div>
              <div v-for="(change, i) in entry.changes" :key="i" class="history-change">
                <span class="field-label">{{ change.label }}</span>
                <div class="d-flex align-center flex-wrap text-body-small">
                  <span class="history-from">{{ change.from }}</span>
                  <span class="mx-2">→</span>
                  <span class="history-to">{{ change.to }}</span>
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
          <div v-else class="d-flex flex-column align-center text-center pa-6 empty-state">
            <div class="empty-state-icon mb-3">
              <v-icon :icon="mdiHistory" size="32" />
            </div>
            <div class="text-title-medium font-weight-bold mb-1">Aucune modification</div>
            <div class="text-body-small text-medium-emphasis">
              Les modifications apportées à cette section apparaîtront ici.
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="historyDialogOpen = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style scoped>
.medecin-table :deep(thead th) {
  font-weight: 700 !important;
}

.medecin-table :deep(.medecin-row) {
  cursor: pointer;
}

.medecin-table :deep(.medecin-row:hover) {
  background: rgba(var(--v-theme-primary), 0.06);
}

.medecin-card {
  cursor: pointer;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.medecin-card:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.history-change {
  margin-bottom: 8px;
}

.history-change:last-child {
  margin-bottom: 0;
}

.history-from {
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: line-through;
}

.history-to {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.cv-svg {
  width: 100%;
  max-width: 480px;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  animation: cv-fade-in 500ms ease-out;
}

@keyframes cv-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
