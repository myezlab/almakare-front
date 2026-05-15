<script setup>
import patientIllustration from '@/assets/illustrations/patient.svg'
import { getCompletionPercent } from '@/composables/useProfileCompletion'
import { useMessagesStore } from '@/stores/messages'
import { usePatientsStore } from '@/stores/patients'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountSearchOutline,
  mdiAlertCircleOutline,
  mdiCheckCircle,
  mdiChevronRight,
  mdiClockOutline,
  mdiMagnify,
  mdiPlus,
  mdiSendOutline,
  mdiStethoscope,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

dayjs.locale('fr')

const router = useRouter()
const selfStore = useSelfStore()
const patientsStore = usePatientsStore()
const messagesStore = useMessagesStore()

const HOSPITALIZATION_TOTAL_STEPS = 8
const search = ref('')

const enrichedPatients = computed(() =>
  patientsStore.items.map((p) => ({
    ...p,
    profileCompletion: getCompletionPercent(p),
  })),
)

const filteredPatients = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return enrichedPatients.value
  return enrichedPatients.value.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q),
  )
})

function age(dob) {
  return dayjs().diff(dayjs(dob), 'year')
}

function genderInitial(gender) {
  return gender === 'female' ? 'Mme' : 'M.'
}

function journeyStatus(patient) {
  if (patient.hospitalizationStep === 0) {
    if (patient.profileCompletion >= 100) {
      return {
        label: 'Parcours non lancé',
        color: 'primary',
        icon: mdiClockOutline,
      }
    }
    return {
      label: 'Profil incomplet',
      color: 'warning',
      icon: mdiAlertCircleOutline,
    }
  }
  if (patient.hospitalizationStep >= HOSPITALIZATION_TOTAL_STEPS) {
    return {
      label: 'Parcours terminé',
      color: 'success',
      icon: mdiCheckCircle,
    }
  }
  return {
    label: `Étape ${patient.hospitalizationStep} / ${HOSPITALIZATION_TOTAL_STEPS}`,
    color: 'primary',
    icon: null,
  }
}

function completionColor(percent) {
  if (percent >= 100) return 'success'
  if (percent >= 50) return 'primary'
  return 'warning'
}

function openPatient(patient) {
  router.push({ name: 'DoctorPatientJourney', params: { id: patient.id } })
}

const dialog = ref(false)
const previewDialog = ref(false)
const sending = ref(false)
const formRef = ref(null)
const firstName = ref('')
const lastName = ref('')
const email = ref('')

const required = (v) => !!v?.trim() || 'Ce champ est requis'
const emailRule = (v) => /.+@.+\..+/.test(v) || 'Email invalide'

function resetForm() {
  firstName.value = ''
  lastName.value = ''
  email.value = ''
}

function openDialog() {
  resetForm()
  dialog.value = true
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  previewDialog.value = true
}

async function sendInvitation() {
  sending.value = true
  try {
    patientsStore.add({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      invitedAt: new Date().toISOString(),
      invitationStatus: 'pending',
    })
    messagesStore.add({ type: 'success', text: 'Invitation envoyée' })
    previewDialog.value = false
    dialog.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de l\'envoi de l\'invitation' })
  } finally {
    sending.value = false
  }
}

const inviterName = computed(() => {
  const name = selfStore.item.fullName?.trim()
  return name || 'Votre médecin'
})

const inviterFirstName = computed(() => {
  return selfStore.item.firstName?.trim() || inviterName.value
})

const inviterEmail = computed(() => selfStore.item.email || 'no-reply@almakare.app')

const invitationSubject = computed(() =>
  `${inviterFirstName.value} vous invite à rejoindre Almakare pour votre suivi`,
)
</script>

<template>
  <div>
    <v-row v-if="selfStore.item.id" justify="center" class="mt-8  mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6 " align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Mes patients</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiStethoscope" size="18" class="mr-1" />
              Espace médecin
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiPlus" class="text-none" @click="openDialog">
              {{ $vuetify.display.mobile ? 'Inviter' : 'Inviter un patient' }}
            </v-btn>
          </v-col>
        </v-row>

        <v-card class="pa-6 card-shadow " :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-row align="center" class="mb-2">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Mes patients
              </div>
              <div class="text-body-medium text-medium-emphasis">
                {{ filteredPatients.length }} patient{{ filteredPatients.length > 1 ? 's' : '' }}
                en cours de suivi
              </div>
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field v-model="search" :prepend-inner-icon="mdiMagnify" placeholder="Rechercher un patient"
                variant="outlined" rounded="lg" density="comfortable" hide-details clearable />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-list lines="three" class="pa-0">
            <template v-for="(patient, idx) in filteredPatients" :key="patient.id">
              <v-list-item class="px-2 py-3 rounded-lg patient-item" @click="openPatient(patient)">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                    <span class="text-title-small font-weight-bold">
                      {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">
                  {{ genderInitial(patient.gender) }} {{ patient.firstName }} {{ patient.lastName }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-body-small text-medium-emphasis mt-1">
                  {{ age(patient.dob) }} ans · Dernière visite
                  {{ dayjs(patient.lastVisit).format('DD MMM YYYY') }}
                </v-list-item-subtitle>

                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip size="x-small" variant="tonal" :color="journeyStatus(patient).color"
                    :prepend-icon="journeyStatus(patient).icon || undefined">
                    {{ journeyStatus(patient).label }}
                  </v-chip>
                </div>

                <template #append>
                  <div class="d-flex align-center ga-3">
                    <v-tooltip location="top" open-delay="200">
                      <template #activator="{ props }">
                        <v-progress-circular v-bind="props" :model-value="patient.profileCompletion"
                          :color="completionColor(patient.profileCompletion)" size="42" width="4">
                          <span class="text-body-small font-weight-bold">
                            {{ patient.profileCompletion }}
                          </span>
                        </v-progress-circular>
                      </template>
                      Complétion du profil patient : {{ patient.profileCompletion }}%
                    </v-tooltip>
                    <v-icon :icon="mdiChevronRight" color="medium-emphasis" />
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="idx < filteredPatients.length - 1" />
            </template>

            <v-list-item v-if="filteredPatients.length === 0" class="py-8 text-center">
              <v-icon :icon="mdiAccountSearchOutline" size="48" color="medium-emphasis" class="mb-3" />
              <div class="text-body-medium text-medium-emphasis">
                Aucun patient ne correspond à votre recherche.
              </div>
            </v-list-item>
          </v-list>
        </v-card>

      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500" :fullscreen="$vuetify.display.mobile">
      <v-card class="pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-text class="px-6 pt-6 pb-6">
          <div class="text-headline-small font-weight-bold mb-2 text-center">Inviter un patient</div>
          <div class="text-body-medium text-medium-emphasis mb-5 text-center">
            Renseignez les informations du patient pour lui envoyer une invitation.
          </div>

          <div class="invite-illustration-wrap mb-4">
            <img :src="patientIllustration" alt="Patient" class="invite-illustration" />
          </div>

          <v-form ref="formRef" @submit.prevent="handleSubmit">
            <v-text-field v-model.trim="firstName" label="Prénom" variant="outlined" rounded="lg" density="comfortable"
              autofocus :rules="[required]" class="mb-2" />
            <v-text-field v-model.trim="lastName" label="Nom" variant="outlined" rounded="lg" density="comfortable"
              :rules="[required]" class="mb-2" />
            <v-text-field v-model.trim="email" label="Email" type="email" variant="outlined" rounded="lg"
              density="comfortable" :rules="[required, emailRule]" class="mb-4" />

            <v-row class="ga-2" no-gutters>
              <v-col>
                <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="dialog = false"
                  :disabled="sending">
                  Annuler
                </v-btn>
              </v-col>
              <v-col>
                <v-btn color="primary" rounded="lg" flat size="large" block class="text-none" type="submit">
                  Inviter
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="previewDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['preview-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <div class="text-headline-small font-weight-bold">Aperçu de l'invitation</div>
          <div class="text-body-small text-medium-emphasis mt-1">
            Voici l'email qui sera envoyé à {{ firstName }}.
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4">
          <div class="email-meta mb-4">
            <div class="email-meta-row">
              <span class="email-meta-key">De</span>
              <span class="email-meta-value">{{ inviterName }} &lt;{{ inviterEmail }}&gt;</span>
            </div>
            <div class="email-meta-row">
              <span class="email-meta-key">À</span>
              <span class="email-meta-value">{{ firstName }} {{ lastName }} &lt;{{ email }}&gt;</span>
            </div>
            <div class="email-meta-row">
              <span class="email-meta-key">Sujet</span>
              <span class="email-meta-value font-weight-bold">{{ invitationSubject }}</span>
            </div>
          </div>

          <div class="email-body">
            <div class="email-body-header">
              <img :src="patientIllustration" alt="Patient" class="email-body-illustration" />
              <div class="email-body-title">Bienvenue sur Almakare</div>
            </div>

            <p>Bonjour <strong>{{ firstName }}</strong>,</p>

            <p>
              <strong>{{ inviterFirstName }}</strong> vous invite à rejoindre <strong>Almakare</strong>
              pour suivre votre parcours de soin et préparer sereinement votre prise en charge.
            </p>

            <p>
              Cliquez sur le bouton ci-dessous pour activer votre compte, compléter votre profil et accéder
              à votre espace personnel.
            </p>

            <div class="email-cta-wrap">
              <span class="email-cta">Activer mon compte</span>
            </div>

            <p class="text-body-small text-medium-emphasis">
              Votre espace vous permettra de remplir vos informations médicales, de suivre les étapes de
              votre hospitalisation et de communiquer avec votre équipe soignante.
            </p>

            <p class="text-body-small text-medium-emphasis mb-0">
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message en toute sécurité.
            </p>

            <div class="email-footer">
              À très vite,<br />
              L'équipe Almakare
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-btn variant="text" rounded="lg" class="text-none" @click="previewDialog = false" :disabled="sending">
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiSendOutline" class="text-none" :loading="sending"
            @click="sendInvitation">
            Envoyer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.patient-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.patient-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.invite-illustration-wrap {
  display: flex;
  justify-content: center;
}

.invite-illustration {
  height: 90px;
  width: auto;
}

.preview-card {
  display: flex;
  flex-direction: column;
}

.email-meta {
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
}

.email-meta-row {
  display: flex;
  font-size: 13px;
  line-height: 1.6;
}

.email-meta-key {
  width: 64px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding-top: 2px;
}

.email-meta-value {
  color: rgba(0, 0, 0, 0.85);
  word-break: break-word;
}

.email-body {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.65;
}

.email-body p {
  margin: 0 0 14px 0;
}

.email-body-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.email-body-illustration {
  height: 90px;
  width: auto;
  margin-bottom: 10px;
}

.email-body-title {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.email-cta-wrap {
  display: flex;
  justify-content: center;
  margin: 22px 0;
}

.email-cta {
  display: inline-block;
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.email-footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}
</style>
