<script setup>
import { ISOToLongDateTime } from "@/composables/useDates"
import {
  mdiCheckCircle,
  mdiClipboardPulseOutline,
  mdiFolderOutline,
  mdiProgressClock
} from "@mdi/js"
import { computed } from "vue"

// Patient-facing view of where a medical procedure (acte) stands: its conditions
// (PPC / orthèse / bed rest) and a chronological checklist of every step — what
// is done, who completed it and when, what is still pending. Shown on the acte
// while it is "En cours". The parent owns the activity; this card only renders
// the `protocol` payload attached to it.
const props = defineProps({
  protocol: { type: Object, default: () => ({}) }
})

// Conditions of the acte, shown as compact chips. Each is a simple Oui/Non flag.
const parameters = computed(() => [
  { label: "PPC", value: !!props.protocol.withPpc },
  { label: "Orthèse", value: !!props.protocol.withOrthese },
  { label: "Bed rest", value: !!props.protocol.withBedRest }
])

const steps = computed(() => props.protocol.steps || [])
const doneCount = computed(() => steps.value.filter((s) => s.done).length)
const allDone = computed(() => steps.value.length > 0 && doneCount.value === steps.value.length)

// "Par na LGHAZI • Samedi 31 mai à 19h26" once done, otherwise a pending note.
function stepCaption(step) {
  if (!step.done) return "En attente"
  const parts = []
  if (step.by) parts.push(`Par ${step.by}`)
  if (step.at) parts.push(ISOToLongDateTime(step.at))
  return parts.join(" • ") || "Effectué"
}
</script>

<template>
  <v-card variant="tonal" color="primary" rounded="lg" class="pa-3">
    <div class="d-flex align-center justify-space-between ga-2 mb-3">
      <div class="d-flex align-center ga-3">
        <v-icon v-if="!$vuetify.display.mobile" :icon="mdiClipboardPulseOutline" color="primary" size="24"
          class="flex-shrink-0" />
        <div class="text-body-medium font-weight-bold">Déroulé de l'acte</div>
      </div>
      <v-chip size="small" :color="allDone ? 'success' : 'primary'" variant="flat" label>
        {{ doneCount }}/{{ steps.length }}
      </v-chip>
    </div>

    <!-- Conditions of the acte -->
    <div class="d-flex flex-wrap ga-2 mb-1">
      <v-chip v-for="param in parameters" :key="param.label" size="small" variant="outlined"
        :color="param.value ? 'success' : undefined" label>
        {{ param.label }} : {{ param.value ? "Oui" : "Non" }}
      </v-chip>
    </div>

    <div v-if="protocol.comment" class="text-body-small text-medium-emphasis mt-2">
      {{ protocol.comment }}
    </div>

    <v-divider class="my-3" />

    <!-- Step-by-step timeline -->
    <div class="steps">
      <div v-for="(step, index) in steps" :key="index" class="step d-flex ga-3"
        :class="{ 'step--last': index === steps.length - 1 }">
        <div class="step-marker d-flex flex-column align-center flex-shrink-0">
          <v-icon :icon="step.done ? mdiCheckCircle : mdiProgressClock"
            :color="step.done ? 'success' : 'medium-emphasis'" size="22" />
          <span v-if="index !== steps.length - 1" class="step-line" />
        </div>
        <div class="flex-grow-1 pb-4" style="min-width: 0">
          <div class="text-body-medium font-weight-medium"
            :class="{ 'text-medium-emphasis': !step.done }">
            {{ step.label }}
          </div>
          <div class="text-body-small text-medium-emphasis">{{ stepCaption(step) }}</div>
          <div v-if="step.detail" class="d-flex align-center ga-1 text-body-small text-medium-emphasis mt-1">
            <v-icon :icon="mdiFolderOutline" size="14" class="flex-shrink-0" />
            <span class="step-detail">{{ step.detail }}</span>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.step-line {
  flex: 1 1 auto;
  width: 2px;
  margin-top: 2px;
  background: rgba(var(--v-theme-primary), 0.25);
}

.step-detail {
  word-break: break-all;
}
</style>
