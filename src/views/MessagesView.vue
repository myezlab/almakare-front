<script setup>
import { mdiMessageTextOutline } from "@mdi/js"
</script>

<template>
  <v-row justify="center" class="mb-16 pb-10 pt-6">
    <v-col :cols="$vuetify.display.mobile ? 12 : 9">

      <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
        <v-col align-self="center">
          <div class="text-headline-medium font-weight-bold">
            Messages
          </div>
          <div class="text-body-medium text-medium-emphasis mt-1">
            <v-icon :icon="mdiMessageTextOutline" size="18" class="mr-1" />
            Échangez avec votre équipe soignante
          </div>
        </v-col>
      </v-row>

      <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <p class="text-body-1 text-medium-emphasis">Aucun message pour le moment.</p>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>
