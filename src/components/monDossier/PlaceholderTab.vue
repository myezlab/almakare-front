<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, required: true },
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <div class="d-flex flex-column align-center text-center pa-8 empty-state">
          <div class="empty-state-icon mb-3">
            <v-icon :icon="icon" size="40" />
          </div>
          <div class="text-title-medium font-weight-bold mb-1">{{ title }}</div>
          <div class="text-body-small text-medium-emphasis">{{ subtitle }}</div>
          <div class="text-body-small text-medium-emphasis mt-2">Bientôt disponible.</div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
