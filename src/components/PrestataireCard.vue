<script setup>
import PrestataireDialog from "@/components/PrestataireDialog.vue"
import { mdiTruckOutline } from "@mdi/js"
import { computed, ref } from "vue"

const props = defineProps({
  // Seeded prestataire record (avatarUrl, company, role, mission, phone, email, city, description).
  prestataire: { type: Object, default: null },
  // Display name, e.g. "Julien Mercier". Falls back to firstName + lastName.
  name: { type: String, default: "" }
})

const fullName = computed(() =>
  props.name || [props.prestataire?.firstName, props.prestataire?.lastName].filter(Boolean).join(" ")
)

const subtitle = computed(() =>
  [props.prestataire?.company, props.prestataire?.role].filter(Boolean).join(" · ")
)

const dialogOpen = ref(false)
</script>

<template>
  <div v-if="prestataire">
    <v-card variant="tonal" rounded="lg" class="pa-3 cursor-pointer" @click="dialogOpen = true">
      <div class="d-flex align-center ga-3">
        <v-avatar size="48" color="primary">
          <v-img v-if="prestataire.avatarUrl" :src="prestataire.avatarUrl" :alt="fullName" />
          <v-icon v-else :icon="mdiTruckOutline" size="28" />
        </v-avatar>
        <div>
          <div class="text-body-medium font-weight-bold">{{ fullName }}</div>
          <div class="text-body-small text-medium-emphasis">{{ subtitle }}</div>
        </div>
      </div>
    </v-card>

    <PrestataireDialog v-model="dialogOpen" :prestataire="prestataire" :name="fullName" />
  </div>
</template>
