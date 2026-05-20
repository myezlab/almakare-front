<script setup>
import { mdiCheckCircle, mdiCircleOutline } from "@mdi/js"
import { computed } from "vue"

const props = defineProps({
  completionPercent: {
    type: Number,
    required: true,
  },
  completionTitle: {
    type: String,
    required: true,
  },
  completeTitle: {
    type: String,
    required: true,
  },
  completionSubtitle: {
    type: String,
    required: true,
  },
  completeSubtitle: {
    type: String,
    required: true,
  },
  sections: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['section-click'])

const completionColor = computed(() => {
  return props.completionPercent >= 100 ? 'success' : 'primary'
})
</script>

<template>
  <v-card class="card-shadow pa-2 overflow-hidden rounded-15">
    <div class="completion-banner" :class="`completion-banner-${completionColor}`" />
    <v-card-text class="px-5 pt-5 pb-4">
      <div class="d-flex align-center mb-3">
        <div>
          <div class="text-headline-small font-weight-bold">
            <span v-if="completionPercent < 100">{{ completionTitle }}</span>
            <span v-else class="d-flex align-center">
              <v-icon :icon="mdiCheckCircle" color="success" class="mr-2" size="small" />
              {{ completeTitle }}
            </span>
          </div>
          <div class="text-body-medium text-medium-emphasis mt-1">
            <span v-if="completionPercent < 100">{{ completionSubtitle }}</span>
            <span v-else>{{ completeSubtitle }}</span>
          </div>
        </div>
        <v-spacer />
        <div class="text-headline-large font-weight-bold pl-2" :class="`text-${completionColor}`">{{ completionPercent
        }}%</div>
      </div>
      <v-progress-linear :model-value="completionPercent" :color="completionColor" height="10" rounded bg-opacity="0.15"
        class="mb-2" />

      <div v-if="sections.length && completionPercent < 100" class="d-flex flex-wrap ga-2 mt-4">
        <v-chip v-for="section in sections" :key="section.key || section.label" size="small" rounded="lg"
          :variant="section.complete ? 'flat' : 'outlined'" :color="section.complete ? 'success' : 'primary'"
          :prepend-icon="section.complete ? mdiCheckCircle : mdiCircleOutline" class="section-chip"
          @click="emit('section-click', section)">
          <span class="font-weight-medium">{{ section.label }}</span>
          <span v-if="!section.complete" class="text-caption ml-2 chip-state">À compléter</span>
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.completion-banner {
  height: 4px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transition: background 0.4s ease;
}

.completion-banner-success {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.completion-banner-primary {
  background: linear-gradient(90deg, #123B6D, #0988ac);
}

.section-chip {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.section-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.chip-state {
  opacity: 0.75;
}
</style>
