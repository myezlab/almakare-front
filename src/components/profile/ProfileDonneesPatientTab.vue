<script setup>
import CarteVitaleCard from "@/components/CarteVitaleCard.vue"
import ProfileCompletion from "@/components/ProfileCompletion.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useProfileCompletion } from "@/composables/useProfileCompletion"

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
const { completionPercent, profileSections } = useProfileCompletion(currentUser)

const addressSelected = ref(false)

const generalFormRef = ref(null)
const medicalFormRef = ref(null)
const clinicalFormRef = ref(null)

const generalCardRef = ref(null)
const medicalCardRef = ref(null)
const carteVitaleCardRef = ref(null)
const clinicalCardRef = ref(null)

const SECTION_REFS = {
  general: () => generalCardRef.value,
  medical: () => medicalCardRef.value,
  carteVitale: () => carteVitaleCardRef.value,
  clinical: () => clinicalCardRef.value,
}

function scrollToSection(section) {
  const target = SECTION_REFS[section?.key]?.()
  if (!target) return
  const el = target.$el || target
  if (typeof el.scrollIntoView !== 'function') return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const savingGeneral = ref(false)
const savingMedical = ref(false)
const savingClinical = ref(false)
const editingGeneral = ref(false)
const editingMedical = ref(false)
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

const hasGeneralData = computed(() => {
  const u = currentUser.value
  return !!(u.firstName || u.lastName || u.birthName || u.gender || u.dob || u.phoneNumber || u.postalAddress || u.city || u.postalCode)
})
const hasMedicalData = computed(() => {
  const u = currentUser.value
  return u.hasDietaryRestrictions != null || u.hasMedicalHistory != null ||
    !!(u.dietaryRestrictions || u.medicalHistory)
})
const hasClinicalData = computed(() => {
  const u = currentUser.value
  return u.weight != null || u.height != null || u.iah != null
})

const showGeneralView = computed(() => hasGeneralData.value && !editingGeneral.value)
const showMedicalView = computed(() => hasMedicalData.value && !editingMedical.value)
const showClinicalView = computed(() => hasClinicalData.value && !editingClinical.value)

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
  }
  addressSelected.value = !!(item.postalAddress || item.city || item.postalCode)
  medicalModel.value = {
    hasDietaryRestrictions: item.hasDietaryRestrictions ?? (item.dietaryRestrictions ? true : null),
    dietaryRestrictions: item.dietaryRestrictions || '',
    hasMedicalHistory: item.hasMedicalHistory ?? (item.medicalHistory ? true : null),
    medicalHistory: item.medicalHistory || '',
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
</script>

<template>
  <v-row>
    <v-col cols="12">
      <ProfileCompletion :class="{ 'mx-6': $vuetify.display.mobile }" :completionPercent="completionPercent"
        completionTitle="Complétez votre profil" completeTitle="Profil complet"
        completionSubtitle="Renseignez vos informations pour accéder à toutes les fonctionnalités"
        completeSubtitle="Toutes vos informations sont renseignées"
        :sections="profileSections.filter(s => SECTION_REFS[s.key])" @section-click="scrollToSection" />
    </v-col>

    <v-col cols="12">

      <!-- Données Générales -->
      <v-card ref="generalCardRef" class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <!-- VIEW MODE -->
        <template v-if="showGeneralView">
          <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
            <span class="text-headline-small font-weight-bold text-truncate">Données générales</span>
            <v-spacer />
            <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable" @click="editingGeneral = true" />
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
                  <v-btn variant="text" rounded="lg" size="small" @click="cancelGeneral(cancel)" class="text-none">
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
                    <v-text-field v-model.trim="proxyModel.value.birthName" label="Nom de naissance" variant="outlined"
                      rounded="lg" />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-select v-model="proxyModel.value.gender" label="Genre" :items="genderOptions" variant="outlined"
                      rounded="lg" />
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
                    <v-text-field v-model.trim="proxyModel.value.city" label="Ville" variant="outlined" rounded="lg" />
                  </v-col>

                  <v-col v-if="addressSelected" cols="12" md="6">
                    <v-text-field v-model.trim="proxyModel.value.postalCode" label="Code postal" variant="outlined"
                      rounded="lg" inputmode="numeric" />
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
      <v-card ref="medicalCardRef" class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <!-- VIEW MODE -->
        <template v-if="showMedicalView">
          <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
            <span class="text-headline-small font-weight-bold text-truncate">Données médicales</span>
            <v-spacer />
            <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable" @click="editingMedical = true" />
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
                  <v-btn variant="text" rounded="lg" size="small" @click="cancelMedical(cancel)" class="text-none">
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
                      v-model.trim="proxyModel.value.medicalHistory" label="Précisez vos antécédents" variant="outlined"
                      rounded="lg" rows="2" auto-grow :rules="[v => !!v || 'Veuillez préciser ou répondre Non']" />
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
      <div ref="carteVitaleCardRef">
        <CarteVitaleCard />
      </div>
    </v-col>

    <v-col cols="12">
      <!-- Données Cliniques -->
      <v-card ref="clinicalCardRef" class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
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
                  <v-btn variant="text" rounded="lg" size="small" @click="cancelClinical(cancel)" class="text-none">
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
</style>
