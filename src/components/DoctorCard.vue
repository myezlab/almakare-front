<script setup>
import DoctorDialog from "@/components/DoctorDialog.vue"
import { mdiDoctor } from "@mdi/js"
import { ref } from "vue"

defineProps({
  // Seeded doctor record (avatarUrl, specialty, firstName, lastName, phone, email, adeli).
  doctor: { type: Object, default: null },
  // Display name, e.g. "Dr Lucas Robert".
  name: { type: String, default: "" }
})

const dialogOpen = ref(false)
</script>

<template>
  <div v-if="doctor">
    <v-card variant="tonal" rounded="lg" class="pa-3 cursor-pointer" @click="dialogOpen = true">
      <div class="d-flex align-center ga-3">
        <v-avatar size="48" color="primary">
          <v-img v-if="doctor.avatarUrl" :src="doctor.avatarUrl" :alt="name" />
          <v-icon v-else :icon="mdiDoctor" size="28" />
        </v-avatar>
        <div>
          <div class="text-body-medium font-weight-bold">{{ name }}</div>
          <div class="text-body-small text-medium-emphasis">{{ doctor.specialty }}</div>
        </div>
      </div>
    </v-card>

    <DoctorDialog v-model="dialogOpen" :doctor="doctor" :name="name" />
  </div>
</template>
