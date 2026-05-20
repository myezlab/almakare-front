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
        <div class="d-flex flex-column align-center text-center pa-8 tab-empty">
          <div class="tab-empty-icon mb-3">
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

<style scoped>
.tab-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
}

.tab-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
