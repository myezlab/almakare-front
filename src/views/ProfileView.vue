<script setup>
import Picture from "@/components/Picture.vue"
import ProfileCompletion from "@/components/ProfileCompletion.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { loadPlacesLibrary } from "@/composables/useGoogleMaps"
import { useLanguages } from "@/composables/useLanguages"
import { useProfileCompletion } from "@/composables/useProfileCompletion"
import personalDataAuthorizationContent from "@/data/personalDataAuthorization.json"
import gendersEnum from "@/enums/genders.json"
import { functions } from "@/firebase"
import { useMessagesStore } from '@/stores/messages'
import { useParamsStore } from '@/stores/params'
import { useSelfStore } from "@/stores/self"
import { mdiArrowLeft, mdiCalendar, mdiCheck, mdiMapMarker } from "@mdi/js"
import { useDebounceFn } from "@vueuse/core"
import { getAuth, signOut } from "firebase/auth"
import { Timestamp, doc, getFirestore, updateDoc } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { marked } from 'marked'
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"

const InstallAppCard = defineAsyncComponent(() =>
  import('@/components/InstallAppCard.vue')
)

const CarteVitaleCard = defineAsyncComponent(() =>
  import('@/components/CarteVitaleCard.vue')
)

const AttestationSecuriteSociale = defineAsyncComponent(() =>
  import('@/components/AttestationSecuriteSociale.vue')
)

let Place = null

function useAddressSearch() {
  const menu = ref(false)
  const loading = ref(false)
  const items = ref([])

  async function search(query) {
    const q = query?.trim()
    if (!q) {
      items.value = []
      loading.value = false
      return
    }
    loading.value = true
    try {
      const { places: predictions } = await Place.searchByText({
        fields: ['displayName', 'formattedAddress', 'addressComponents'],
        textQuery: q,
        maxResultCount: 5,
      })
      if (predictions.length) {
        items.value = predictions
        menu.value = true
      } else {
        items.value = []
      }
    } catch (error) {
      console.error('Error searching for address:', error)
      messagesStore.add({ type: 'error', text: t('MAPS_LOAD_ERROR') })
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const debouncedSearch = useDebounceFn(search, 900)

  function select(place, model) {
    model.postalAddress = place.formattedAddress || place.displayName || ''
    if (place.addressComponents) {
      for (const component of place.addressComponents) {
        if (component.types.includes('locality')) model.city = component.longText || ''
        if (component.types.includes('postal_code')) model.postalCode = component.longText || ''
      }
    }
    items.value = []
    menu.value = false
    addressSelected.value = true
  }

  return { menu, loading, items, debouncedSearch, select }
}

const addressSelected = ref(false)
const postalAddressSearch = useAddressSearch()

const { t, locale } = useI18n()
const db = getFirestore()
const auth = getAuth()

const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const router = useRouter()
const paramsStore = useParamsStore()

const {
  allLanguages,
  updateUserLanguage,
  loadingLanguage,
  getBestMatchingLanguage
} = useLanguages()

const selectedLanguage = ref("")

const generalFormRef = ref(null)
const medicalFormRef = ref(null)
const clinicalFormRef = ref(null)
const savingGeneral = ref(false)
const savingMedical = ref(false)
const savingClinical = ref(false)
const savingAgreement = ref(false)
const showAgreement = ref(false)
const agreementCheckbox = ref(false)

const parsedAgreement = computed(() => {
  const content = personalDataAuthorizationContent[locale.value] || personalDataAuthorizationContent['fr-FR'] || ''
  return marked(content)
})

const currentUser = computed(() => selfStore.item || {})

const { completionPercent, profileSections } = useProfileCompletion(currentUser)

const genderOptions = computed(() => gendersEnum.map(g => ({
  title: t(g.toUpperCase()),
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
  socialSecurityNumber: '',
  dietaryRestrictions: '',
  medicalHistory: '',
  currentTreatments: '',
})

const clinicalModel = ref({
  weight: null,
  height: null,
  iah: null,
})

const agreementAccepted = computed(() => !!currentUser.value?.agreementPersonal && !!currentUser.value?.agreementPersonalDate)

const agreementDate = computed(() => {
  const d = currentUser.value?.agreementPersonalDate
  return d?.toDate?.() || d || null
})

async function acceptAgreement() {
  savingAgreement.value = true
  try {
    const now = Timestamp.now()
    const updateData = {
      agreementPersonal: true,
      agreementPersonalDate: now,
    }
    await updateDoc(doc(db, `users/${currentUser.value.id}`), updateData)
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: t('AGREEMENT_SAVED') })
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('AGREEMENT_SAVE_ERROR') })
  } finally {
    savingAgreement.value = false
  }
}

onMounted(async () => {
  const userLanguage = currentUser.value.language || navigator.language
  selectedLanguage.value = getBestMatchingLanguage(userLanguage)

  httpsCallable(functions, 'ocr-extractCarteVitaleNir')({ awake: true }).catch(() => { })
  httpsCallable(functions, 'ocr-extractAttestationSecuriteSociale')({ awake: true }).catch(() => { })

  try {
    const { Place: PlaceClass } = await loadPlacesLibrary()
    Place = PlaceClass
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('MAPS_LOAD_ERROR') })
  }
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
    socialSecurityNumber: item.socialSecurityNumber || '',
    dietaryRestrictions: item.dietaryRestrictions || '',
    medicalHistory: item.medicalHistory || '',
    currentTreatments: item.currentTreatments || '',
  }
  clinicalModel.value = {
    weight: item.weight ?? null,
    height: item.height ?? null,
    iah: item.iah ?? null,
  }
}, { immediate: true })

watch(() => currentUser.value.language, (newLanguage) => {
  if (newLanguage) {
    selectedLanguage.value = getBestMatchingLanguage(newLanguage)
  }
})

async function handleUpdateUserLanguage(language) {
  selectedLanguage.value = language
  await updateUserLanguage(language)
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
      dob: value.dob ? Timestamp.fromDate(new Date(value.dob)) : null,
      postalAddress: value.postalAddress,
      city: value.city,
      postalCode: value.postalCode,
      phoneNumber: value.phoneNumber,
    }
    await updateDoc(doc(db, `users/${currentUser.value.id}`), updateData)
    confirmSave()
    Object.assign(selfStore.item, { ...updateData, dob: value.dob })
    messagesStore.add({ type: 'success', text: t('PROFILE_SAVED') })
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('PROFILE_SAVE_ERROR') })
  } finally {
    savingGeneral.value = false
  }
}

async function handleSaveMedical(proxyModel, confirmSave) {
  const { valid } = await medicalFormRef.value.validate()
  if (!valid) return
  savingMedical.value = true
  try {
    const value = proxyModel.value
    const updateData = {
      socialSecurityNumber: value.socialSecurityNumber,
      dietaryRestrictions: value.dietaryRestrictions,
      medicalHistory: value.medicalHistory,
      currentTreatments: value.currentTreatments,
    }
    await updateDoc(doc(db, `users/${currentUser.value.id}`), updateData)
    confirmSave()
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: t('PROFILE_SAVED') })
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('PROFILE_SAVE_ERROR') })
  } finally {
    savingMedical.value = false
  }
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
    await updateDoc(doc(db, `users/${currentUser.value.id}`), updateData)
    confirmSave()
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: t('PROFILE_SAVED') })
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('PROFILE_SAVE_ERROR') })
  } finally {
    savingClinical.value = false
  }
}

async function logOut() {
  try {
    if (selfStore.unsubscribe) selfStore.unsubscribe()
    await signOut(auth)
    selfStore.item = {}
    router.push({ name: "Home" })
  } catch (error) {
    messagesStore.add({ type: 'error', text: t('LOGOUT_ERROR') })
  }
}
</script>

<template>
  <div>
    <!-- =================== AGREEMENT FULL VIEW =================== -->
    <v-row v-if="showAgreement" justify="center" class="mt-4 mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mb-4" @click="showAgreement = false">
          {{ $t('GO_BACK') }}
        </v-btn>
        <v-card class="card-shadow px-6 pb-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="markdown-content" v-html="parsedAgreement" />

          <div v-if="agreementAccepted" class="d-flex align-center mt-6 justify-center">
            <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
            <span class="text-body-small text-medium-emphasis">
              {{ $t('AGREEMENT_ACCEPTED_ON', { date: ISOToShortenedDate(agreementDate) }) }}
            </span>
          </div>
          <div v-else class="mt-6">
            <div>
              <v-checkbox v-model="agreementCheckbox" :label="$t('AGREEMENT_CHECKBOX_LABEL')" color="primary"
                hide-details class="mb-4" />
            </div>
            <div class="text-center">
              <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :disabled="!agreementCheckbox"
                :loading="savingAgreement" @click="acceptAgreement">
                {{ $t('AGREEMENT_ACCEPT') }}
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mt-4" @click="showAgreement = false">
          {{ $t('GO_BACK') }}
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-else-if="selfStore.item.createdAt" justify="center" class=" mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">

        <!-- Install App Section -->

        <v-row>
          <v-col cols="12" v-if="paramsStore.beforeinstallprompt">
            <InstallAppCard :class="{ 'mx-6': $vuetify.display.mobile }" />
          </v-col>
          <!-- =================== PROFILE COMPLETION =================== -->
          <v-col cols="12">
            <ProfileCompletion :class="{ 'mx-6': $vuetify.display.mobile }" :completionPercent="completionPercent"
              :completionTitle="$t('PROFILE_COMPLETION_TITLE')" :completeTitle="$t('PROFILE_COMPLETE_TITLE')"
              :completionSubtitle="$t('PROFILE_COMPLETION_SUBTITLE')"
              :completeSubtitle="$t('PROFILE_COMPLETE_SUBTITLE')" :sections="profileSections" />
          </v-col>

          <!-- Autorisation données personnelles -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold text-truncate">{{
                  $t('SECTION_PERSONAL_DATA_AUTHORIZATION') }}</span>
              </v-card-title>
              <v-card-text class="px-4 pt-4">
                <div v-if="agreementAccepted" class="d-flex align-center">
                  <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
                  <span class="text-body-small text-medium-emphasis">
                    {{ $t('AGREEMENT_ACCEPTED_ON', { date: ISOToShortenedDate(agreementDate) }) }}
                  </span>
                </div>
                <div v-else class="text-body-small text-medium-emphasis">
                  {{ $t('AGREEMENT_NOT_YET_ACCEPTED') }}
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" rounded="lg" size="small" class="border-light text-none"
                  @click="showAgreement = true">
                  {{ agreementAccepted ? $t('AGREEMENT_VIEW') : $t('AGREEMENT_READ_AND_ACCEPT') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col cols="12">

            <!-- Données Générales -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-confirm-edit v-model="generalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="generalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">{{ $t('SECTION_GENERAL')
                        }}</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          {{ $t('CANCEL') }}
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingGeneral"
                          @click="handleSaveGeneral(proxyModel, confirmSave)" flat>
                          {{ $t('SAVE') }}
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Avatar -->
                        <v-col cols="12" class="d-flex flex-column align-center">
                          <Picture :docPath="`users/${selfStore.item.id}`" :storagePath="`users/${selfStore.item.id}`"
                            v-model:source="selfStore.item.avatarUrl" pictureName="avatar" :size="100" for="avatar"
                            :cover="true" />
                          <div class="text-body-small text-medium-emphasis mt-2">{{ $t('PHOTO_AVATAR') }}</div>
                        </v-col>

                        <!-- First Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.firstName" :label="$t('FIRST_NAME')"
                            variant="outlined" rounded="lg"
                            :rules="[v => !!v || $t('AUTH_VALIDATION_FIELD_REQUIRED')]" />
                        </v-col>

                        <!-- Last Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.lastName" :label="$t('LAST_NAME')"
                            variant="outlined" rounded="lg"
                            :rules="[v => !!v || $t('AUTH_VALIDATION_FIELD_REQUIRED')]" />
                        </v-col>

                        <!-- Email (read-only) -->
                        <v-col cols="12" md="6">
                          <v-text-field :model-value="currentUser.email" :label="$t('EMAIL')" variant="outlined"
                            rounded="lg" disabled />
                        </v-col>

                        <!-- Birth Name -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.birthName" :label="$t('BIRTH_NAME')"
                            variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Gender -->
                        <v-col cols="12" md="6">
                          <v-select v-model="proxyModel.value.gender" :label="$t('GENDER')" :items="genderOptions"
                            variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Date of Birth -->
                        <v-col cols="12" md="6">
                          <v-date-input v-model="proxyModel.value.dob" input-format="dd/MM/yyyy"
                            :label="$t('DATE_OF_BIRTH')" variant="outlined" rounded="lg"
                            :prepend-inner-icon="mdiCalendar" prepend-icon="" />
                        </v-col>

                        <!-- Phone Number -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.phoneNumber" :label="$t('PHONE_NUMBER')"
                            variant="outlined" rounded="lg" inputmode="tel" />
                        </v-col>

                        <!-- Postal Address (Google Maps Search) -->
                        <v-col cols="12" md="6">
                          <v-menu v-model="postalAddressSearch.menu.value" :close-on-content-click="false"
                            location="bottom" max-height="300">
                            <template #activator="{ props: menuProps }">
                              <v-text-field v-model.trim="proxyModel.value.postalAddress" v-bind="menuProps"
                                :label="$t('POSTAL_ADDRESS')" variant="outlined" rounded="lg"
                                :loading="postalAddressSearch.loading.value" :prepend-inner-icon="mdiMapMarker"
                                @update:model-value="postalAddressSearch.debouncedSearch" autocomplete="off" />
                            </template>
                            <v-list v-if="postalAddressSearch.items.value.length" density="compact" class="card-shadow">
                              <v-list-item v-for="(place, i) in postalAddressSearch.items.value" :key="i"
                                @click="postalAddressSearch.select(place, proxyModel.value)">
                                <v-list-item-title>{{ place.displayName }}</v-list-item-title>
                                <v-list-item-subtitle>{{ place.formattedAddress }}</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-menu>
                        </v-col>

                        <!-- City (shown after address selected) -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.city" :label="$t('CITY')" variant="outlined"
                            rounded="lg" />
                        </v-col>

                        <!-- Postal Code (shown after address selected) -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.postalCode" :label="$t('POSTAL_CODE')"
                            variant="outlined" rounded="lg" inputmode="numeric" />
                        </v-col>

                      </v-row>
                    </v-card-text>

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                        {{ $t('CANCEL') }}
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingGeneral"
                        @click="handleSaveGeneral(proxyModel, confirmSave)" flat>
                        {{ $t('SAVE') }}
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
              <v-confirm-edit v-model="medicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="medicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">{{ $t('SECTION_MEDICAL')
                      }}</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          {{ $t('CANCEL') }}
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingMedical"
                          @click="handleSaveMedical(proxyModel, confirmSave)" flat>
                          {{ $t('SAVE') }}
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Social Security Number -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.socialSecurityNumber"
                            :label="$t('SOCIAL_SECURITY_NUMBER')" variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Dietary Restrictions -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.dietaryRestrictions"
                            :label="$t('DIETARY_RESTRICTIONS')" variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Medical History -->
                        <v-col cols="12" md="6">
                          <v-textarea v-model.trim="proxyModel.value.medicalHistory" :label="$t('MEDICAL_HISTORY')"
                            variant="outlined" rounded="lg" rows="2" auto-grow />
                        </v-col>

                        <!-- Current Treatments -->
                        <v-col cols="12" md="6">
                          <v-textarea v-model.trim="proxyModel.value.currentTreatments"
                            :label="$t('CURRENT_TREATMENTS')" variant="outlined" rounded="lg" rows="2" auto-grow />
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                        {{ $t('CANCEL') }}
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingMedical"
                        @click="handleSaveMedical(proxyModel, confirmSave)" flat>
                        {{ $t('SAVE') }}
                      </v-btn>
                    </div>
                  </v-form>
                </template>
              </v-confirm-edit>
            </v-card>
          </v-col>

          <v-col cols="12">
            <!-- Données Cliniques -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-confirm-edit v-model="clinicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="clinicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">{{ $t('SECTION_CLINICAL')
                      }}</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          {{ $t('CANCEL') }}
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingClinical"
                          @click="handleSaveClinical(proxyModel, confirmSave)" flat>
                          {{ $t('SAVE') }}
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Weight -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.weight" :label="$t('WEIGHT')"
                            variant="outlined" rounded="lg" inputmode="decimal" type="number" step="0.1" />
                        </v-col>

                        <!-- Height -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.height" :label="$t('HEIGHT')"
                            variant="outlined" rounded="lg" inputmode="decimal" type="number" step="0.01" />
                        </v-col>

                        <!-- BMI (derived) -->
                        <v-col cols="12" md="6">
                          <v-text-field
                            :model-value="proxyModel.value.weight && proxyModel.value.height ? Math.round(proxyModel.value.weight / (proxyModel.value.height * proxyModel.value.height) * 10) / 10 : ''"
                            :label="$t('BMI')" variant="outlined" rounded="lg" readonly />
                        </v-col>

                        <!-- IAH -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.number="proxyModel.value.iah" :label="$t('IAH')" variant="outlined"
                            rounded="lg" inputmode="decimal" type="number" step="0.1" />
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                        {{ $t('CANCEL') }}
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingClinical"
                        @click="handleSaveClinical(proxyModel, confirmSave)" flat>
                        {{ $t('SAVE') }}
                      </v-btn>
                    </div>
                  </v-form>
                </template>
              </v-confirm-edit>
            </v-card>
          </v-col>

          <v-col cols="12">
            <!-- Carte Vitale -->
            <CarteVitaleCard />
          </v-col>

          <v-col cols="12">
            <!-- Attestation de Sécurité Sociale -->
            <AttestationSecuriteSociale />
          </v-col>

          <v-col cols="12">
            <!-- Language Section -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-4">
                  <div class="text-headline-small font-weight-bold text-truncate">{{ $t('LANGUAGE') }}</div>
                </div>

                <v-list class="pa-0" bg-color="transparent">
                  <v-list-item v-for="language in allLanguages" :key="language.value"
                    @click="handleUpdateUserLanguage(language.value)"
                    class="language-item rounded-lg mb-2 cursor-pointer"
                    :class="{ 'selected-language': selectedLanguage === language.value }">
                    <template v-slot:prepend>
                      <span class="text-headline-small mr-3">{{ language.flag }}</span>
                    </template>
                    <v-list-item-title class="font-weight-medium text-truncate">{{ language.text }}</v-list-item-title>
                    <template v-slot:append>
                      <v-progress-circular v-if="loadingLanguage && selectedLanguage === language.value" size="20"
                        width="2" indeterminate color="primary"></v-progress-circular>
                      <v-icon v-else-if="selectedLanguage === language.value" :icon="mdiCheck" color="primary"></v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          <!-- Log Out Section -->
          <v-col cols="12">
            <v-row justify="center">
              <v-btn color="error" variant="outlined" class="text-none mt-6 mb-16" @click="logOut" rounded="lg">
                {{ $t('SETTINGS_LOG_OUT') }}
              </v-btn>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
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

.language-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.language-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.selected-language {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
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
</style>