<script setup>
import patientIllustration from '@/assets/illustrations/patient.svg'
import professionalIllustration from '@/assets/illustrations/doctors.svg'
import coordinatorIllustration from '@/assets/illustrations/team.svg'
import doctorIllustration from '@/assets/illustrations/doctor.svg'
import technicianIllustration from '@/assets/illustrations/settings.svg'
import logo from '@/assets/img/logo.svg'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountHeartOutline,
  mdiAccountTieOutline,
  mdiArrowLeft,
  mdiCalendarCheckOutline,
  mdiChartLineVariant,
  mdiClipboardPulseOutline,
  mdiCogOutline,
  mdiFileDocumentMultipleOutline,
  mdiFileSearchOutline,
  mdiLoginVariant,
  mdiMessageTextOutline,
  mdiMoonWaningCrescent,
  mdiStethoscope,
  mdiToolboxOutline,
  mdiAccountGroupOutline,
} from '@mdi/js'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selfStore = useSelfStore()

// Onboarding flow steps:
// 'role' -> choose patient or professional
// 'specialty' -> professional chooses specialty
// 'services' -> show services for chosen specialty
const step = ref('role')
const selectedSpecialty = ref(null)

const roleCards = [
  {
    key: 'patient',
    title: 'Je suis un patient',
    description: 'Suivez votre santé du sommeil, vos traitements et votre progression au quotidien',
    illustration: patientIllustration,
    icon: mdiAccountHeartOutline,
    color: '#4FC3F7',
  },
  {
    key: 'professional',
    title: 'Je suis un professionnel',
    description: 'Accédez à des outils dédiés pour accompagner vos patients atteints d\'apnée du sommeil',
    illustration: professionalIllustration,
    icon: mdiAccountTieOutline,
    color: '#58AD32',
  },
]

const specialties = [
  {
    key: 'coordinator',
    title: 'Coordinateur',
    description: 'Pilotez les parcours patients et coordonnez l\'équipe pluridisciplinaire',
    illustration: coordinatorIllustration,
    icon: mdiAccountGroupOutline,
  },
  {
    key: 'doctor',
    title: 'Médecin',
    description: 'Suivez vos patients, leurs diagnostics et les résultats de leurs examens',
    illustration: doctorIllustration,
    icon: mdiStethoscope,
  },
  {
    key: 'technician',
    title: 'Technicien',
    description: 'Gérez le matériel, les installations et l\'accompagnement technique des patients',
    illustration: technicianIllustration,
    icon: mdiToolboxOutline,
  },
]

const servicesBySpecialty = {
  coordinator: [
    {
      title: 'Suivi des patients',
      description: 'Vue d\'ensemble du parcours de chaque patient',
      icon: mdiAccountGroupOutline,
    },
    {
      title: 'Planification des rendez-vous',
      description: 'Organisez les consultations et examens du sommeil',
      icon: mdiCalendarCheckOutline,
    },
    {
      title: 'Messagerie sécurisée',
      description: 'Communiquez avec l\'équipe médicale et les patients',
      icon: mdiMessageTextOutline,
    },
    {
      title: 'Tableau de bord équipe',
      description: 'Indicateurs clés de l\'activité et de la performance',
      icon: mdiChartLineVariant,
    },
  ],
  doctor: [
    {
      title: 'Dossiers patients',
      description: 'Consultez et complétez les dossiers médicaux',
      icon: mdiFileDocumentMultipleOutline,
    },
    {
      title: 'Résultats d\'examens',
      description: 'Analyses polysomnographiques et tests d\'Epworth',
      icon: mdiClipboardPulseOutline,
    },
    {
      title: 'Prescriptions',
      description: 'Émettez et suivez les prescriptions de PPC',
      icon: mdiFileSearchOutline,
    },
    {
      title: 'Téléconsultation',
      description: 'Réalisez des consultations à distance',
      icon: mdiMessageTextOutline,
    },
  ],
  technician: [
    {
      title: 'Gestion du matériel',
      description: 'Suivez le parc d\'appareils PPC et accessoires',
      icon: mdiToolboxOutline,
    },
    {
      title: 'Installations',
      description: 'Planifiez et suivez les installations à domicile',
      icon: mdiCogOutline,
    },
    {
      title: 'Maintenance',
      description: 'Interventions techniques et remplacements',
      icon: mdiCalendarCheckOutline,
    },
    {
      title: 'Données d\'observance',
      description: 'Consultez les données d\'utilisation des appareils',
      icon: mdiChartLineVariant,
    },
  ],
}

const currentServices = computed(() => servicesBySpecialty[selectedSpecialty.value?.key] || [])

function selectRole(role) {
  if (role.key === 'patient') {
    router.push({ name: 'Dashboard' })
  } else {
    step.value = 'specialty'
  }
}

function selectSpecialty(specialty) {
  selectedSpecialty.value = specialty
  step.value = 'services'
}

function goBack() {
  if (step.value === 'services') {
    step.value = 'specialty'
    selectedSpecialty.value = null
  } else if (step.value === 'specialty') {
    step.value = 'role'
  }
}

function goToLogin() {
  router.push({ name: 'Login' })
}

function selectService(service) {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="onboarding-wrapper background-image">
    <!-- Top bar -->
    <div class="top-bar d-flex align-center justify-space-between px-6 px-md-10 py-4">
      <div class="d-flex align-center" style="cursor: pointer;" @click="step = 'role'; selectedSpecialty = null">
        <img :src="logo" alt="myEZlab" class="top-logo" />
      </div>
      <v-btn
        v-if="!selfStore.item.id"
        :prepend-icon="mdiLoginVariant"
        color="primary"
        variant="flat"
        rounded="lg"
        class="text-none"
        @click="goToLogin"
      >
        Se connecter
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="tonal"
        rounded="lg"
        class="text-none"
        @click="router.push({ name: 'Dashboard' })"
      >
        Mon tableau de bord
      </v-btn>
    </div>

    <v-container class="content-container">
      <!-- Step 1: Role choice -->
      <v-fade-transition mode="out-in">
        <div v-if="step === 'role'" key="role">
          <div class="text-center mb-10 mb-md-12">
            <h1 class="text-headline-large font-weight-bold mb-3" style="font-family: title !important;">
              Bienvenue sur myEZlab
            </h1>
            <p class="text-body-large text-medium-emphasis">
              La plateforme dédiée à la prise en charge de l'apnée du sommeil
            </p>
            <p class="text-body-medium text-medium-emphasis mt-2">
              Pour commencer, indiquez-nous qui vous êtes
            </p>
          </div>

          <v-row justify="center" align="stretch" class="mx-0">
            <v-col
              v-for="role in roleCards"
              :key="role.key"
              cols="12"
              sm="10"
              md="5"
              lg="4"
            >
              <v-card
                class="role-card card-shadow pa-8 h-100 d-flex flex-column align-center text-center"
                rounded="xl"
                elevation="0"
                @click="selectRole(role)"
              >
                <div class="role-illustration-wrap mb-6 d-flex align-center justify-center">
                  <img :src="role.illustration" :alt="role.title" class="role-illustration" />
                </div>
                <div
                  class="role-icon-badge mb-4 d-flex align-center justify-center"
                  :style="{ backgroundColor: role.color + '22' }"
                >
                  <v-icon :icon="role.icon" :color="role.color" size="28" />
                </div>
                <h2 class="text-headline-small font-weight-bold mb-3">{{ role.title }}</h2>
                <p class="text-body-medium text-medium-emphasis mb-6 flex-grow-1">
                  {{ role.description }}
                </p>
                <v-btn
                  color="primary"
                  variant="tonal"
                  rounded="lg"
                  size="large"
                  block
                  class="text-none"
                >
                  Continuer
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Step 2: Specialty choice -->
        <div v-else-if="step === 'specialty'" key="specialty">
          <div class="d-flex align-center mb-6">
            <v-btn
              :prepend-icon="mdiArrowLeft"
              variant="text"
              rounded="lg"
              class="text-none"
              @click="goBack"
            >
              Retour
            </v-btn>
          </div>

          <div class="text-center mb-10">
            <h1 class="text-headline-medium font-weight-bold mb-3" style="font-family: title !important;">
              Quelle est votre spécialité ?
            </h1>
            <p class="text-body-large text-medium-emphasis">
              Choisissez votre rôle pour accéder à des services adaptés
            </p>
          </div>

          <v-row justify="center" align="stretch" class="mx-0">
            <v-col
              v-for="specialty in specialties"
              :key="specialty.key"
              cols="12"
              sm="10"
              md="4"
            >
              <v-card
                class="role-card card-shadow pa-6 pa-md-8 h-100 d-flex flex-column align-center text-center"
                rounded="xl"
                elevation="0"
                @click="selectSpecialty(specialty)"
              >
                <div class="specialty-illustration-wrap mb-6 d-flex align-center justify-center">
                  <img :src="specialty.illustration" :alt="specialty.title" class="specialty-illustration" />
                </div>
                <div class="specialty-icon-badge mb-4 d-flex align-center justify-center">
                  <v-icon :icon="specialty.icon" color="primary" size="24" />
                </div>
                <h2 class="text-title-large font-weight-bold mb-2">{{ specialty.title }}</h2>
                <p class="text-body-medium text-medium-emphasis mb-6 flex-grow-1">
                  {{ specialty.description }}
                </p>
                <v-btn
                  color="primary"
                  variant="tonal"
                  rounded="lg"
                  block
                  class="text-none"
                >
                  Choisir
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Step 3: Services -->
        <div v-else-if="step === 'services'" key="services">
          <div class="d-flex align-center mb-6">
            <v-btn
              :prepend-icon="mdiArrowLeft"
              variant="text"
              rounded="lg"
              class="text-none"
              @click="goBack"
            >
              Retour
            </v-btn>
          </div>

          <div class="text-center mb-10">
            <div class="d-flex justify-center mb-4">
              <div class="specialty-icon-badge specialty-icon-badge-large d-flex align-center justify-center">
                <v-icon :icon="selectedSpecialty.icon" color="primary" size="32" />
              </div>
            </div>
            <h1 class="text-headline-medium font-weight-bold mb-2" style="font-family: title !important;">
              Espace {{ selectedSpecialty.title }}
            </h1>
            <p class="text-body-large text-medium-emphasis">
              Découvrez les services à votre disposition
            </p>
          </div>

          <v-row justify="center" align="stretch" class="mx-0">
            <v-col
              v-for="(service, idx) in currentServices"
              :key="idx"
              cols="12"
              sm="6"
              md="6"
              lg="5"
            >
              <v-card
                class="service-card card-shadow pa-6 h-100"
                rounded="xl"
                elevation="0"
                @click="selectService(service)"
              >
                <div class="d-flex align-start">
                  <div class="service-icon-wrap d-flex align-center justify-center mr-4 flex-shrink-0">
                    <v-icon :icon="service.icon" color="primary" size="28" />
                  </div>
                  <div class="flex-grow-1">
                    <h3 class="text-title-medium font-weight-bold mb-2">{{ service.title }}</h3>
                    <p class="text-body-medium text-medium-emphasis mb-0">{{ service.description }}</p>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-fade-transition>
    </v-container>
  </div>
</template>

<style scoped>
.onboarding-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  width: 100%;
}

.top-logo {
  max-height: 40px;
  width: auto;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 24px;
  padding-bottom: 64px;
  max-width: 1100px;
}

.role-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.role-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08) !important;
}

.role-illustration-wrap {
  height: 180px;
  width: 100%;
}

.role-illustration {
  max-height: 180px;
  max-width: 100%;
  object-fit: contain;
}

.specialty-illustration-wrap {
  height: 140px;
  width: 100%;
}

.specialty-illustration {
  max-height: 140px;
  max-width: 100%;
  object-fit: contain;
}

.role-icon-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.specialty-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(88, 173, 50, 0.12);
}

.specialty-icon-badge-large {
  width: 64px;
  height: 64px;
}

.service-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: rgba(255, 255, 255, 0.95);
}

.service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07) !important;
}

.service-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background-color: rgba(88, 173, 50, 0.10);
}
</style>
