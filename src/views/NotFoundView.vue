<script setup>
import nobodyIllustration from '@/assets/illustrations/nobody.svg'
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'Dashboard' })
}
</script>

<template>
  <div class="not-found-wrapper d-flex align-center justify-center">
    <v-row justify="center" no-gutters>
      <v-col :cols="$vuetify.display.mobile ? 12 : 8" class="text-center">
        <v-img :src="nobodyIllustration" :width="$vuetify.display.mobile ? 150 : 200" class="mx-auto mb-8 grayscale-img"
          contain />
        <div class="text-headline-small font-weight-bold mb-3">Page introuvable</div>
        <div class="text-body-medium text-medium-emphasis mb-8 px-6">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </div>
        <v-btn color="primary" size="large" flat rounded="lg" class="text-none" @click="goHome">
          Retour au dashboard
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.not-found-wrapper {
  min-height: calc(100vh - 64px);
  width: 100%;
}

.grayscale-img {
  filter: grayscale(1);
}
</style>
