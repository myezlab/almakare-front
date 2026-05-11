<script setup>
import illustration from '@/assets/illustrations/collaborators.svg'
import welcomeIllustration from '@/assets/illustrations/dashboard.svg'
import logo from '@/assets/img/logo.svg'
import { useSelfStore } from '@/stores/self'
import { useRouter } from 'vue-router'

const router = useRouter()
const selfStore = useSelfStore()
</script>

<template>
  <div class="home-wrapper background-image d-flex align-center justify-center">
    <v-container class="d-flex align-center justify-center " style="min-height: 100vh;">
      <v-row align="center" justify="center" v-if="!selfStore.item.id">
        <v-col cols="12" sm="10" md="8" lg="6" xl="5">
          <v-card class="card-shadow pa-8 pa-sm-12" rounded="xl" elevation="0">

            <div class="d-flex justify-center mb-6">
              <img :src="logo" alt="DXL Research Logo" class="logo-image" />
            </div>

            <div class="d-flex justify-center mb-8">
              <img :src="illustration" alt="Illustration" class="illustration-image" />
            </div>

            <div class="text-center mb-8">
              <h1 class="text-headline-medium font-weight-bold mb-2" style="font-family: title !important;">
                Bienvenue sur myEZlab
              </h1>
              <p class="text-body-large text-medium-emphasis">
                Choisissez votre espace pour continuer
              </p>
            </div>

            <v-btn @click="router.push({ name: 'Login' })" color="primary" rounded="lg" block size="large" flat
              class="mb-3">
              Se connecter
            </v-btn>
            <v-btn @click="router.push({ name: 'Login', query: { mode: 'signup' } })" variant="outlined" color="primary"
              rounded="lg" block size="large">
              Créer un compte
            </v-btn>

          </v-card>
        </v-col>
      </v-row>

      <v-row align="center" justify="center" v-else>
        <v-col cols="12" sm="10" md="8" lg="6" xl="5">
          <v-card class="card-shadow pa-8 pa-sm-12" rounded="xl" elevation="0" align="center">

            <div class="d-flex justify-center mb-6">
              <img :src="logo" alt="DXL Research Logo" class="logo-image" />
            </div>

            <div class="d-flex justify-center mb-8">
              <img :src="welcomeIllustration" alt="Welcome illustration" class="illustration-image" />
            </div>

            <div class="text-center">
              <h1 class="text-headline-medium font-weight-bold mb-2" style="font-family: title !important;">
                Bienvenue, {{ selfStore.item.fullName || selfStore.item.email }} !
              </h1>
              <p class="text-body-large text-medium-emphasis">
                Vous êtes connecté à myEZlab.
              </p>
            </div>

          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.home-wrapper {
  min-height: 100vh;
}

.logo-image {
  max-width: 180px;
  height: auto;
}

.illustration-image {
  max-width: 220px;
  width: 100%;
  height: auto;
  opacity: 0.92;
}
</style>
