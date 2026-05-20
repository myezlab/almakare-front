<script setup>
import CarteVitaleCard from "@/components/CarteVitaleCard.vue"
import Picture from "@/components/Picture.vue"
import ProfileCompletion from "@/components/ProfileCompletion.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useProfileCompletion } from "@/composables/useProfileCompletion"
import { useRules } from "@/composables/useRules"
import personalDataAuthorizationContent from "@/data/personalDataAuthorization.json"
import gendersEnum from "@/enums/genders.json"
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountCircleOutline,
  mdiAccountOutline,
  mdiArrowLeft,
  mdiCalendar,
  mdiCalendarClockOutline,
  mdiCalendarOutline,
  mdiCalendarPlusOutline,
  mdiCheck,
  mdiClipboardListOutline,
  mdiEmailOutline,
  mdiFolderOutline,
  mdiMessageTextOutline,
  mdiPencil,
  mdiPill,
  mdiPulse,
  mdiViewDashboardOutline,
} from "@mdi/js"
import { marked } from 'marked'
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }

const { phoneNumberValidation } = useRules()

const addressSelected = ref(false)

const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const router = useRouter()
const route = useRoute()

const generalFormRef = ref(null)
const medicalFormRef = ref(null)
const clinicalFormRef = ref(null)
const savingGeneral = ref(false)
const savingMedical = ref(false)
const savingClinical = ref(false)
const editingGeneral = ref(false)
const editingMedical = ref(false)
const editingClinical = ref(false)
const showAgreement = ref(false)

const parsedAgreement = computed(() => {
  const content = personalDataAuthorizationContent['fr-FR'] || ''
  return marked(content)
})

const currentUser = computed(() => selfStore.item || {})

const { completionPercent, profileSections } = useProfileCompletion(currentUser)

const TABS = [
  { value: 'synthese', label: 'Synthèse', icon: mdiViewDashboardOutline },
  { value: 'donnees-patient', label: 'Données patient', icon: mdiAccountOutline },
  { value: 'planifier', label: 'Planifier', icon: mdiCalendarClockOutline },
  { value: 'programmer', label: 'Programmer', icon: mdiCalendarPlusOutline },
  { value: 'activites', label: 'Activités', icon: mdiPulse },
  { value: 'traitements', label: 'Traitements', icon: mdiPill },
  { value: 'documents', label: 'Documents', icon: mdiFolderOutline },
  { value: 'questionnaires', label: 'Questionnaires', icon: mdiClipboardListOutline },
  { value: 'messagerie', label: 'Messagerie', icon: mdiMessageTextOutline },
]
const TAB_VALUES = TABS.map((t) => t.value)
const DEFAULT_TAB = 'synthese'

const activeTab = ref(TAB_VALUES.includes(route.query.tab) ? route.query.tab : DEFAULT_TAB)

watch(
  () => route.query.tab,
  (val) => {
    const next = TAB_VALUES.includes(val) ? val : DEFAULT_TAB
    if (next !== activeTab.value) activeTab.value = next
  },
)

watch(activeTab, (val) => {
  const target = TAB_VALUES.includes(val) ? val : DEFAULT_TAB
  if ((route.query.tab || DEFAULT_TAB) === target) return
  router.replace({ query: { ...route.query, tab: target } })
})

const tabPlaceholders = {
  'planifier': {
    title: 'Planifier',
    subtitle: 'Organisez vos prochains rendez-vous et examens.',
    icon: mdiCalendarClockOutline,
  },
  'programmer': {
    title: 'Programmer',
    subtitle: 'Programmez vos séances et soins à venir.',
    icon: mdiCalendarPlusOutline,
  },
  'activites': {
    title: 'Activités',
    subtitle: 'Suivez l\'historique de vos activités et soins.',
    icon: mdiPulse,
  },
  'traitements': {
    title: 'Traitements',
    subtitle: 'Consultez vos traitements en cours et passés.',
    icon: mdiPill,
  },
  'documents': {
    title: 'Documents',
    subtitle: 'Retrouvez vos ordonnances, comptes-rendus et résultats.',
    icon: mdiFolderOutline,
  },
  'questionnaires': {
    title: 'Questionnaires',
    subtitle: 'Répondez aux questionnaires de suivi médical.',
    icon: mdiClipboardListOutline,
  },
  'messagerie': {
    title: 'Messagerie',
    subtitle: 'Échangez avec votre équipe soignante.',
    icon: mdiMessageTextOutline,
  },
}

const hasGeneralData = computed(() => {
  const u = currentUser.value
  return !!(u.firstName || u.lastName || u.birthName || u.gender || u.dob || u.phoneNumber || u.postalAddress || u.city || u.postalCode)
})
const hasMedicalData = computed(() => {
  const u = currentUser.value
  return u.hasDietaryRestrictions != null || u.hasMedicalHistory != null || u.hasCurrentTreatments != null ||
    !!(u.dietaryRestrictions || u.medicalHistory || u.currentTreatments)
})
const hasClinicalData = computed(() => {
  const u = currentUser.value
  return u.weight != null || u.height != null || u.iah != null
})

const showGeneralView = computed(() => hasGeneralData.value && !editingGeneral.value)
const showMedicalView = computed(() => hasMedicalData.value && !editingMedical.value)
const showClinicalView = computed(() => hasClinicalData.value && !editingClinical.value)

const EMPTY = '-'

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

const fullName = computed(() => {
  const u = currentUser.value || {}
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Mon profil'
})

const fullAddress = computed(() => {
  const u = currentUser.value || {}
  return [u.postalAddress, [u.postalCode, u.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
})

const genderOptions = computed(() => gendersEnum.map(g => ({
  title: GENDER_LABELS[g] || g,
  value: g,
})))

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
})

const medicalModel = ref({
  hasDietaryRestrictions: null,
  dietaryRestrictions: '',
  hasMedicalHistory: null,
  medicalHistory: '',
  hasCurrentTreatments: null,
  currentTreatments: '',
})

const clinicalModel = ref({
  weight: null,
  height: null,
  iah: null,
})

const agreementDate = computed(() => {
  const d = currentUser.value?.agreementPersonalDate
  return d?.toDate?.() || d || null
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
  }
  addressSelected.value = !!(item.postalAddress || item.city || item.postalCode)
  medicalModel.value = {
    hasDietaryRestrictions: item.hasDietaryRestrictions ?? (item.dietaryRestrictions ? true : null),
    dietaryRestrictions: item.dietaryRestrictions || '',
    hasMedicalHistory: item.hasMedicalHistory ?? (item.medicalHistory ? true : null),
    medicalHistory: item.medicalHistory || '',
    hasCurrentTreatments: item.hasCurrentTreatments ?? (item.currentTreatments ? true : null),
    currentTreatments: item.currentTreatments || '',
  }
  clinicalModel.value = {
    weight: item.weight ?? null,
    height: item.height ?? null,
    iah: item.iah ?? null,
  }
}, { immediate: true })


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

async function handleSaveMedical(proxyModel, confirmSave) {
  const { valid } = await medicalFormRef.value.validate()
  if (!valid) return
  savingMedical.value = true
  try {
    const value = proxyModel.value
    const updateData = {
      hasDietaryRestrictions: value.hasDietaryRestrictions,
      dietaryRestrictions: value.hasDietaryRestrictions ? value.dietaryRestrictions : '',
      hasMedicalHistory: value.hasMedicalHistory,
      medicalHistory: value.hasMedicalHistory ? value.medicalHistory : '',
      hasCurrentTreatments: value.hasCurrentTreatments,
      currentTreatments: value.hasCurrentTreatments ? value.currentTreatments : '',
    }
    confirmSave()
    Object.assign(selfStore.item, updateData)
    editingMedical.value = false
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    savingMedical.value = false
  }
}

function cancelMedical(cancel) {
  cancel()
  editingMedical.value = false
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

async function logOut() {
  try {
    selfStore.item = {}
    router.push({ name: "Home" })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la déconnexion' })
  }
}
</script>

<template>
  <div>
    <!-- =================== AGREEMENT FULL VIEW =================== -->
    <v-row v-if="showAgreement" justify="center" class="mt-4 mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">
        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mb-4" @click="showAgreement = false">
          Retour
        </v-btn>
        <v-card class="card-shadow px-6 pb-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="markdown-content" v-html="parsedAgreement" />

          <div class="d-flex align-center mt-6 justify-center">
            <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
            <span class="text-body-small text-medium-emphasis">
              Accepté{{ agreementDate ? ` le ${ISOToShortenedDate(agreementDate)}` : '' }}
            </span>
          </div>
        </v-card>

        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mt-4" @click="showAgreement = false">
          Retour
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-else-if="selfStore.item.id" justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Mon profil</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiAccountCircleOutline" size="18" class="mr-1" />
              Gérez vos informations personnelles et médicales
            </div>
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class="card-shadow pt-6 px-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex flex-column align-center text-center">
            <Picture :docPath="`users/${selfStore.item.id}`" :storagePath="`users/${selfStore.item.id}`"
              v-model:source="selfStore.item.avatarUrl" pictureName="avatar" :size="96" for="avatar" :cover="true" />
            <div class="text-headline-small font-weight-bold mt-3">{{ fullName }}</div>

            <div class="d-flex flex-wrap justify-center ga-2 mt-4">
              <v-chip v-if="genderLabel" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiAccountOutline">
                {{ genderLabel }}
              </v-chip>
              <v-chip v-if="dobDisplay" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiCalendarOutline">
                Né(e) le {{ dobDisplay }}
              </v-chip>
              <v-chip v-if="currentUser.email" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiEmailOutline">
                {{ currentUser.email }}
              </v-chip>
            </div>
          </div>

          <v-tabs v-model="activeTab" color="primary" align-tabs="center" show-arrows
            class="mt-6 profile-tabs">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" class="text-none">
              {{ t.label }}
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- =================== SYNTHÈSE TAB =================== -->
        <v-row v-if="activeTab === 'synthese'">
          <v-col v-if="completionPercent < 100" cols="12">
            <ProfileCompletion :class="{ 'mx-6': $vuetify.display.mobile }" :completionPercent="completionPercent"
              completionTitle="Complétez votre profil" completeTitle="Profil complet"
              completionSubtitle="Renseignez vos informations pour accéder à toutes les fonctionnalités"
              completeSubtitle="Toutes vos informations sont renseignées" :sections="profileSections" />
          </v-col>

          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="text-headline-small font-weight-bold mb-1">Synthèse</div>
              <div class="text-body-small text-medium-emphasis mb-4">
                Vue d'ensemble de votre dossier patient.
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <div class="field-label">Nom complet</div>
                  <div class="field-value">{{ fullName }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Date de naissance</div>
                  <div class="field-value">{{ dobDisplay || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Genre</div>
                  <div class="field-value">{{ genderLabel || EMPTY }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Téléphone</div>
                  <div class="field-value">{{ currentUser.phoneNumber || EMPTY }}</div>
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
            </v-card>
          </v-col>
        </v-row>

        <!-- =================== DONNÉES PATIENT TAB =================== -->
        <v-row v-if="activeTab === 'donnees-patient'">
          <v-col cols="12">

            <!-- Données Générales -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <!-- VIEW MODE -->
              <template v-if="showGeneralView">
                <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                  <span class="text-headline-small font-weight-bold text-truncate">Données générales</span>
                  <v-spacer />
                  <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable"
                    @click="editingGeneral = true" />
                </v-card-title>
                <v-card-text class="px-4 pt-4">
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
                  </v-row>
                </v-card-text>
              </template>

              <!-- EDIT MODE -->
              <v-confirm-edit v-else v-model="generalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="generalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">Données générales</span>
                      <v-spacer />
                      <template v-if="(editingGeneral || !isPristine) && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancelGeneral(cancel)"
                          class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingGeneral"
                          @click="handleSaveGeneral(proxyModel, confirmSave)" flat>
                          Enregistrer
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- First Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.firstName" label="Prénom" variant="outlined"
                            rounded="lg" :rules="[v => !!v || 'Ce champ est requis']" />
                        </v-col>

                        <!-- Last Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.lastName" label="Nom" variant="outlined"
                            rounded="lg" :rules="[v => !!v || 'Ce champ est requis']" />
                        </v-col>

                        <!-- Email (read-only) -->
                        <v-col cols="12" md="6">
                          <v-text-field :model-value="currentUser.email" label="Email" variant="outlined" rounded="lg"
                            disabled />
                        </v-col>

                        <!-- Birth Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.birthName" label="Nom de naissance"
                            variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Gender -->
                        <v-col cols="12" md="6">
                          <v-select v-model="proxyModel.value.gender" label="Genre" :items="genderOptions"
                            variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Date of Birth -->
                        <v-col cols="12" md="6">
                          <v-date-input v-model="proxyModel.value.dob" input-format="dd/MM/yyyy"
                            label="Date de naissance" variant="outlined" rounded="lg" :prepend-inner-icon="mdiCalendar"
                            prepend-icon="" />
                        </v-col>

                        <!-- Phone Number -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.phoneNumber" label="Téléphone" variant="outlined"
                            rounded="lg" inputmode="tel" :rules="[phoneNumberValidation]" />
                        </v-col>

                        <!-- Postal Address -->
                        <v-col cols="12">
                          <v-text-field v-model.trim="proxyModel.value.postalAddress" label="Adresse"
                            variant="outlined" rounded="lg"
                            @update:model-value="addressSelected = !!$event" />
                        </v-col>

                        <!-- City -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.city" label="Ville" variant="outlined"
                            rounded="lg" />
                        </v-col>

                        <!-- Postal Code -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.postalCode" label="Code postal"
                            variant="outlined" rounded="lg" inputmode="numeric" />
                        </v-col>

                      </v-row>
                    </v-card-text>

                    <div v-if="(editingGeneral || !isPristine) && $vuetify.display.mobile"
                      class="d-flex justify-end mx-4 mb-4">
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
            </v-card>
          </v-col>

          <v-col cols="12">
            <!-- Données Médicales -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <!-- VIEW MODE -->
              <template v-if="showMedicalView">
                <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                  <span class="text-headline-small font-weight-bold text-truncate">Données médicales</span>
                  <v-spacer />
                  <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable"
                    @click="editingMedical = true" />
                </v-card-title>
                <v-card-text class="px-4 pt-4">
                  <v-row>
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
                      <div class="field-label">Traitements en cours</div>
                      <div class="field-value field-value-multiline">
                        {{ currentUser.hasCurrentTreatments === false
                          ? 'Aucun'
                          : (currentUser.currentTreatments || EMPTY) }}
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </template>

              <!-- EDIT MODE -->
              <v-confirm-edit v-else v-model="medicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="medicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">Données médicales</span>
                      <v-spacer />
                      <template v-if="(editingMedical || !isPristine) && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancelMedical(cancel)"
                          class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingMedical"
                          @click="handleSaveMedical(proxyModel, confirmSave)" flat>
                          Enregistrer
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Dietary Restrictions -->
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

                        <!-- Medical History -->
                        <v-col cols="12" md="6">
                          <div class="field-label mb-2">Avez-vous des antécédents médicaux&nbsp;?</div>
                          <v-btn-toggle v-model="proxyModel.value.hasMedicalHistory" mandatory="force"
                            color="primary" rounded="lg" density="comfortable" variant="outlined" class="mb-3">
                            <v-btn :value="true" class="text-none">Oui</v-btn>
                            <v-btn :value="false" class="text-none">Non</v-btn>
                          </v-btn-toggle>
                          <v-textarea v-if="proxyModel.value.hasMedicalHistory === true"
                            v-model.trim="proxyModel.value.medicalHistory" label="Précisez vos antécédents"
                            variant="outlined" rounded="lg" rows="2" auto-grow
                            :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
                        </v-col>

                        <!-- Current Treatments -->
                        <v-col cols="12" md="6">
                          <div class="field-label mb-2">Suivez-vous un traitement en cours&nbsp;?</div>
                          <v-btn-toggle v-model="proxyModel.value.hasCurrentTreatments" mandatory="force"
                            color="primary" rounded="lg" density="comfortable" variant="outlined" class="mb-3">
                            <v-btn :value="true" class="text-none">Oui</v-btn>
                            <v-btn :value="false" class="text-none">Non</v-btn>
                          </v-btn-toggle>
                          <v-textarea v-if="proxyModel.value.hasCurrentTreatments === true"
                            v-model.trim="proxyModel.value.currentTreatments" label="Précisez vos traitements"
                            variant="outlined" rounded="lg" rows="2" auto-grow
                            :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <div v-if="(editingMedical || !isPristine) && $vuetify.display.mobile"
                      class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancelMedical(cancel)" class="text-none">
                        Annuler
                      </v-btn>
                      <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingMedical"
                        @click="handleSaveMedical(proxyModel, confirmSave)" flat>
                        Enregistrer
                      </v-btn>
                    </div>
                  </v-form>
                </template>
              </v-confirm-edit>
            </v-card>
          </v-col>

          <v-col cols="12">
            <CarteVitaleCard />
          </v-col>

          <v-col cols="12">
            <!-- Données Cliniques -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <!-- VIEW MODE -->
              <template v-if="showClinicalView">
                <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                  <span class="text-headline-small font-weight-bold text-truncate">Données cliniques</span>
                  <v-spacer />
                  <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable"
                    @click="editingClinical = true" />
                </v-card-title>
                <v-card-text class="px-4 pt-4">
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
                </v-card-text>
              </template>

              <!-- EDIT MODE -->
              <v-confirm-edit v-else v-model="clinicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="clinicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">Données cliniques</span>
                      <v-spacer />
                      <template v-if="(editingClinical || !isPristine) && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancelClinical(cancel)"
                          class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn v-if="!isPristine" color="primary" rounded="lg" size="small" :loading="savingClinical"
                          @click="handleSaveClinical(proxyModel, confirmSave)" flat>
                          Enregistrer
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Weight -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.weight" label="Poids (kg)" variant="outlined"
                            rounded="lg" inputmode="decimal" type="number" step="0.1" />
                        </v-col>

                        <!-- Height -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.height" label="Taille (m)" variant="outlined"
                            rounded="lg" inputmode="decimal" type="number" step="0.01" />
                        </v-col>

                        <!-- BMI -->
                        <v-col cols="12" md="6">
                          <v-text-field
                            :model-value="proxyModel.value.weight && proxyModel.value.height ? Math.round(proxyModel.value.weight / (proxyModel.value.height * proxyModel.value.height) * 10) / 10 : ''"
                            label="IMC (calculé)" variant="outlined" rounded="lg" readonly />
                        </v-col>

                        <!-- IAH -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.iah" label="IAH" variant="outlined"
                            rounded="lg" inputmode="decimal" type="number" step="0.1" />
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <div v-if="(editingClinical || !isPristine) && $vuetify.display.mobile"
                      class="d-flex justify-end mx-4 mb-4">
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
            </v-card>
          </v-col>

          <!-- Autorisation données personnelles -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold text-truncate">Données personnelles</span>
              </v-card-title>
              <v-card-text class="px-4 pt-4">
                <div class="d-flex align-center">
                  <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
                  <span class="text-body-small text-medium-emphasis">
                    Accepté{{ agreementDate ? ` le ${ISOToShortenedDate(agreementDate)}` : '' }}
                  </span>
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" rounded="lg" size="small" class="border-light text-none"
                  @click="showAgreement = true">
                  Consulter
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- =================== PLACEHOLDER TABS =================== -->
        <v-row v-if="tabPlaceholders[activeTab]">
          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex flex-column align-center text-center pa-8 tab-empty">
                <div class="tab-empty-icon mb-3">
                  <v-icon :icon="tabPlaceholders[activeTab].icon" size="40" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">
                  {{ tabPlaceholders[activeTab].title }}
                </div>
                <div class="text-body-small text-medium-emphasis">
                  {{ tabPlaceholders[activeTab].subtitle }}
                </div>
                <div class="text-body-small text-medium-emphasis mt-2">
                  Bientôt disponible.
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Log Out -->
        <v-row justify="center">
          <v-btn color="error" variant="outlined" class="text-none mt-6 mb-16" @click="logOut" rounded="lg">
            Se déconnecter
          </v-btn>
        </v-row>

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">
        <!-- Profile completion skeleton -->
        <v-card class="mb-4 card-shadow pa-4 rounded-15" :class="{ 'mx-6': $vuetify.display.xs }">
          <v-skeleton-loader type="heading" class="mb-2" />
          <v-skeleton-loader type="text@2" />
        </v-card>

        <!-- General section skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <div class="d-flex justify-center mb-4">
            <v-skeleton-loader type="avatar" />
          </div>
          <v-row>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
          </v-row>
        </v-card>

        <!-- Medical section skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-row>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12"><v-skeleton-loader type="text@2" /></v-col>
          </v-row>
        </v-card>

        <!-- Settings skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-skeleton-loader type="list-item@3" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>


<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.gap-2 {
  gap: 8px;
}

.gap-1 {
  gap: 4px;
}

.profile-avatar-wrapper {
  position: relative;
}

.profile-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

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

.tab-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
}

.tab-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
