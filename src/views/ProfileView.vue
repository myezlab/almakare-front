<script setup>
import Picture from "@/components/Picture.vue"
import ProfileCompletion from "@/components/ProfileCompletion.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useProfileCompletion } from "@/composables/useProfileCompletion"
import personalDataAuthorizationContent from "@/data/personalDataAuthorization.json"
import gendersEnum from "@/enums/genders.json"
import { useMessagesStore } from '@/stores/messages'
import { useParamsStore } from '@/stores/params'
import { useSelfStore } from "@/stores/self"
import { mdiArrowLeft, mdiCalendar, mdiCheck } from "@mdi/js"
import { marked } from 'marked'
import { computed, defineAsyncComponent, ref, watch } from "vue"
import { useRouter } from "vue-router"

const InstallAppCard = defineAsyncComponent(() =>
  import('@/components/InstallAppCard.vue')
)

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }



const addressSelected = ref(false)

const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const router = useRouter()
const paramsStore = useParamsStore()

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
  const content = personalDataAuthorizationContent['fr-FR'] || ''
  return marked(content)
})

const currentUser = computed(() => selfStore.item || {})

const { completionPercent, profileSections } = useProfileCompletion(currentUser)

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
    const updateData = {
      agreementPersonal: true,
      agreementPersonalDate: new Date().toISOString(),
    }
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: 'Autorisation enregistrée avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement de l'autorisation" })
  } finally {
    savingAgreement.value = false
  }
}

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
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
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
    confirmSave()
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
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
    confirmSave()
    Object.assign(selfStore.item, updateData)
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    savingClinical.value = false
  }
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
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mb-4" @click="showAgreement = false">
          Retour
        </v-btn>
        <v-card class="card-shadow px-6 pb-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="markdown-content" v-html="parsedAgreement" />

          <div v-if="agreementAccepted" class="d-flex align-center mt-6 justify-center">
            <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
            <span class="text-body-small text-medium-emphasis">
              Accepté le {{ ISOToShortenedDate(agreementDate) }}
            </span>
          </div>
          <div v-else class="mt-6">
            <div>
              <v-checkbox v-model="agreementCheckbox"
                label="J'ai lu et j'accepte les conditions de traitement de mes données personnelles" color="primary"
                hide-details class="mb-4" />
            </div>
            <div class="text-center">
              <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :disabled="!agreementCheckbox"
                :loading="savingAgreement" @click="acceptAgreement">
                Accepter
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-btn :prepend-icon="mdiArrowLeft" :class="{ 'ml-4': $vuetify.display.mobile }" variant="text"
          color="medium-emphasis" rounded="lg" size="small" class="mt-4" @click="showAgreement = false">
          Retour
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-else-if="selfStore.item.id" justify="center" class=" mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">

        <!-- Install App Section -->

        <v-row>
          <v-col cols="12" v-if="paramsStore.beforeinstallprompt">
            <InstallAppCard :class="{ 'mx-6': $vuetify.display.mobile }" />
          </v-col>
          <!-- =================== PROFILE COMPLETION =================== -->
          <v-col cols="12">
            <ProfileCompletion :class="{ 'mx-6': $vuetify.display.mobile }" :completionPercent="completionPercent"
              completionTitle="Complétez votre profil" completeTitle="Profil complet"
              completionSubtitle="Renseignez vos informations pour accéder à toutes les fonctionnalités"
              completeSubtitle="Toutes vos informations sont renseignées" :sections="profileSections" />
          </v-col>

          <!-- Autorisation données personnelles -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold text-truncate">Données personnelles</span>
              </v-card-title>
              <v-card-text class="px-4 pt-4">
                <div v-if="agreementAccepted" class="d-flex align-center">
                  <v-icon color="success" class="mr-2">{{ mdiCheck }}</v-icon>
                  <span class="text-body-small text-medium-emphasis">
                    Accepté le {{ ISOToShortenedDate(agreementDate) }}
                  </span>
                </div>
                <div v-else class="text-body-small text-medium-emphasis">
                  Vous n'avez pas encore accepté l'autorisation de traitement des données personnelles.
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" rounded="lg" size="small" class="border-light text-none"
                  @click="showAgreement = true">
                  {{ agreementAccepted ? 'Consulter' : 'Lire et accepter' }}
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
                      <span class="text-headline-small font-weight-bold text-truncate">Données générales</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingGeneral"
                          @click="handleSaveGeneral(proxyModel, confirmSave)" flat>
                          Enregistrer
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
                          <div class="text-body-small text-medium-emphasis mt-2">Photo de profil</div>
                        </v-col>

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
                            rounded="lg" inputmode="tel" />
                        </v-col>

                        <!-- City (shown after address selected) -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.city" label="Ville" variant="outlined"
                            rounded="lg" />
                        </v-col>

                        <!-- Postal Code (shown after address selected) -->
                        <v-col v-if="addressSelected" cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.postalCode" label="Code postal"
                            variant="outlined" rounded="lg" inputmode="numeric" />
                        </v-col>

                      </v-row>
                    </v-card-text>

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
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
            </v-card>
          </v-col>

          <v-col cols="12">
            <!-- Données Médicales -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-confirm-edit v-model="medicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="medicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">Données médicales</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingMedical"
                          @click="handleSaveMedical(proxyModel, confirmSave)" flat>
                          Enregistrer
                        </v-btn>
                      </template>
                    </v-card-title>

                    <v-card-text class="px-4 pt-4">
                      <v-row>
                        <!-- Social Security Number -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.socialSecurityNumber"
                            label="Numéro de sécurité sociale" variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Dietary Restrictions -->
                        <v-col cols="12" md="6">
                          <v-text-field v-model.trim="proxyModel.value.dietaryRestrictions" label="Régime alimentaire"
                            variant="outlined" rounded="lg" />
                        </v-col>

                        <!-- Medical History -->
                        <v-col cols="12" md="6">
                          <v-textarea v-model.trim="proxyModel.value.medicalHistory" label="Antécédents médicaux"
                            variant="outlined" rounded="lg" rows="2" auto-grow />
                        </v-col>

                        <!-- Current Treatments -->
                        <v-col cols="12" md="6">
                          <v-textarea v-model.trim="proxyModel.value.currentTreatments" label="Traitements en cours"
                            variant="outlined" rounded="lg" rows="2" auto-grow />
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                        Annuler
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingMedical"
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
            <!-- Données Cliniques -->
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-confirm-edit v-model="clinicalModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="clinicalFormRef">
                    <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                      <span class="text-headline-small font-weight-bold text-truncate">Données cliniques</span>
                      <v-spacer />
                      <template v-if="!isPristine && !$vuetify.display.mobile">
                        <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                          Annuler
                        </v-btn>
                        <v-btn color="primary" rounded="lg" size="small" :loading="savingClinical"
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

                        <!-- BMI (derived) -->
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

                    <div v-if="!isPristine && $vuetify.display.mobile" class="d-flex justify-end mx-4 mb-4">
                      <v-btn variant="text" rounded="lg" size="small" @click="cancel" class="text-none">
                        Annuler
                      </v-btn>
                      <v-btn color="primary" rounded="lg" size="small" :loading="savingClinical"
                        @click="handleSaveClinical(proxyModel, confirmSave)" flat>
                        Enregistrer
                      </v-btn>
                    </div>
                  </v-form>
                </template>
              </v-confirm-edit>
            </v-card>
          </v-col>

          <v-col cols="12">
            <!-- Carte Vitale -->
          </v-col>

          <v-col cols="12">
            <!-- Attestation de Sécurité Sociale -->
          </v-col>

          <!-- Log Out Section -->
          <v-col cols="12">
            <v-row justify="center">
              <v-btn color="error" variant="outlined" class="text-none mt-6 mb-16" @click="logOut" rounded="lg">
                Se déconnecter
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
