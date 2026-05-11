<script setup>
import Loader from "@/components/Loader.vue"
import { usePendingsStore } from "@/stores/pendings"

const pendingsStore = usePendingsStore()
</script>

<template>
  <v-overlay :model-value="pendingsStore.overlay" persistent opacity="0.2" class="align-center justify-center">
    <Loader />
  </v-overlay>
</template>
