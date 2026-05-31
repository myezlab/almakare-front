<script setup>
// Shows a questionnaire's results: the latest saved score as a result card,
// followed by an "Historique" list of the previous results (newest first).
import { ISOToShortenedDate } from "@/composables/useDates"
import { computed } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  maxScore: { type: Number, default: 0 },
  history: { type: Array, default: () => [] },
  colorFor: { type: Function, default: () => "primary" },
  labelFor: { type: Function, default: () => "" },
})

const emit = defineEmits(["update:modelValue"])

// Newest first: the first entry is the latest result, the rest are previous.
const sorted = computed(() =>
  [...props.history].sort((a, b) => new Date(b.date) - new Date(a.date)),
)
const latest = computed(() => sorted.value[0] || null)
const previous = computed(() => sorted.value.slice(1))

function close() {
  emit("update:modelValue", false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-title class="pa-4 d-flex align-center">
        <div>
          <div class="text-headline-small font-weight-bold">Résultats</div>
          <div class="text-body-small text-medium-emphasis mt-1">{{ title }}</div>
        </div>
        <v-spacer />
        <v-btn icon="$close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <div v-if="!latest" class="text-center text-body-medium text-medium-emphasis py-8">
          Aucun résultat enregistré pour le moment.
        </div>

        <template v-else>
          <v-card flat class="pa-6 rounded-lg text-center" variant="outlined"
            :style="`border-color: rgb(var(--v-theme-${colorFor(latest.score)})); border-top-width: 4px`">
            <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing mb-3">
              Score total
            </div>
            <div :class="`text-display-small font-weight-bold text-${colorFor(latest.score)}`">
              {{ latest.score }}<span class="text-title-large text-medium-emphasis"> / {{ maxScore }}</span>
            </div>
            <v-chip :color="colorFor(latest.score)" variant="tonal" rounded="pill" size="small" class="mt-3">
              {{ labelFor(latest.score) }}
            </v-chip>
            <div class="text-body-small text-medium-emphasis mt-3">{{ ISOToShortenedDate(latest.date) }}</div>
          </v-card>

          <template v-if="previous.length">
            <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing mt-6 mb-1">
              Historique
            </div>
            <v-list class="pa-0" bg-color="transparent">
              <v-list-item v-for="(entry, i) in previous" :key="i" class="px-2">
                <template #prepend>
                  <v-avatar :color="colorFor(entry.score)" variant="tonal" size="44" class="font-weight-bold">
                    {{ entry.score }}
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ entry.score }} / {{ maxScore }}
                </v-list-item-title>
                <v-list-item-subtitle>{{ labelFor(entry.score) }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-body-small text-medium-emphasis">{{ ISOToShortenedDate(entry.date) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </template>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}
</style>
