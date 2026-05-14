<script setup>
import professionalIllustration from '@/assets/illustrations/doctors.svg'
import patientIllustration from '@/assets/illustrations/patient.svg'
import logoText from '@/assets/img/logo-text.svg'
import logo from '@/assets/img/logo.svg'
import HomeFooter from '@/components/HomeFooter.vue'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountHeartOutline,
  mdiAccountTieOutline,
} from '@mdi/js'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const selfStore = useSelfStore()
const { mobile } = useDisplay()

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
    color: '#123B6D',
  },
]

function selectRole(role) {
  router.push({ name: 'Login', query: { mode: 'signup', role: role.key } })
}

function goHome() {
  router.push({ query: {} })
}

function goToLogin() {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="onboarding-wrapper background-image">
    <div style="min-height:100dvh">
      <!-- Top bar -->
      <div class="top-bar d-flex align-center justify-space-between px-6 px-md-10 py-4">
        <div class="d-flex align-center" style="cursor: pointer;" @click="goHome">
          <img :src="logo" alt="almakare" class="top-logo" width="auto" :height="mobile ? 48 : 60" />
        </div>
        <v-btn v-if="!selfStore.item.id" color="primary" variant="flat" rounded="lg" class="text-none"
          @click="goToLogin">
          Se connecter
        </v-btn>
        <v-btn v-else color="primary" variant="tonal" rounded="lg" class="text-none"
          @click="router.push({ name: 'DashboardPatient' })">
          Mon tableau de bord
        </v-btn>
      </div>

      <v-container class="content-container" :class="mobile ? 'px-3 pt-2 pb-6' : 'px-4 pt-6 pb-16'">
        <div class="text-center" :class="mobile ? 'mb-6' : 'mb-12'">
          <img :src="logoText" alt="almakare" class="top-logo mx-auto" width="auto" :height="mobile ? 48 : 60" />
          <p class="text-medium-emphasis px-3" :class="mobile ? 'text-body-medium' : 'text-body-large'">
            La plateforme dédiée à la prise en charge de l'apnée du sommeil
          </p>
          <p class="text-medium-emphasis mt-2 px-3" :class="mobile ? 'text-body-small' : 'text-body-medium'">
            Pour commencer, indiquez-nous qui vous êtes
          </p>
        </div>

        <v-row justify="center" align="stretch" class="mx-0" no-gutters>
          <v-col v-for="role in roleCards" :key="role.key" cols="12" sm="10" md="5" lg="4"
            :class="mobile ? 'pa-2' : 'pa-3'">
            <v-card class="role-card card-shadow h-100 d-flex flex-column align-center text-center"
              :class="mobile ? 'pa-5' : 'pa-8'" rounded="xl" elevation="0" @click="selectRole(role)">
              <div class="role-illustration-wrap d-flex align-center justify-center"
                :class="mobile ? 'mb-4 illustration-mobile' : 'mb-6 illustration-desktop'">
                <img :src="role.illustration" :alt="role.title" class="role-illustration" />
              </div>
              <h2 class="font-weight-bold" :class="mobile ? 'text-title-large mb-2' : 'text-headline-small mb-3'">
                {{ role.title }}
              </h2>
              <p class="text-body-medium text-medium-emphasis flex-grow-1" :class="mobile ? 'mb-4' : 'mb-6'">
                {{ role.description }}
              </p>
              <v-btn color="primary" variant="tonal" rounded="lg" :size="mobile ? 'default' : 'large'" block
                class="text-none">
                Créer un compte
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <HomeFooter />
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
  width: auto;
  display: block;
  object-fit: contain;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  width: 100%;
}

.role-illustration-wrap.illustration-mobile {
  height: 130px;
}

.role-illustration-wrap.illustration-desktop {
  height: 180px;
}

.role-illustration {
  max-width: 100%;
  object-fit: contain;
}

.illustration-mobile .role-illustration {
  max-height: 130px;
}

.illustration-desktop .role-illustration {
  max-height: 180px;
}
</style>
