<script setup>
// Renders a scored questionnaire (from src/data/tests.js) inside a dialog,
// driven by a useQuestionnaire instance — the same logic and data the
// QuestionnairesTab uses. The patient answers each question; saving commits the
// result to the questionnaire history (and reveals it via QuestionnaireResultsDialog),
// while a "Résultats" button opens that history at any time.
import { computed } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  test: { type: Object, default: null },
  // A reactive useQuestionnaire(...) instance for `test` (answers, score,
  // history, select/save/reset, colorFor/labelFor). Built by the parent.
  instance: { type: Object, default: null },
})

const emit = defineEmits(["update:modelValue", "save", "results"])

const questions = computed(() => props.test?.questions || [])

function optionsFor(question) {
  return question.options || props.test?.options || []
}

function optionLabel(option) {
  return props.test?.showOptionValue ? `${option.value} — ${option.label}` : option.label
}

function close() {
  emit("update:modelValue", false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" :fullscreen="$vuetify.display.mobile" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="test && instance" class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-title class="pa-4 dialog-title">
        <div class="text-headline-small font-weight-bold">{{ test.title }}</div>
        <div v-if="test.description" class="text-body-small text-medium-emphasis mt-1">{{ test.description }}</div>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <v-card v-for="(question, i) in questions" :key="i" class="mb-3 py-4" flat rounded="lg">
          <div class="text-body-medium font-weight-medium mb-1">
            <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
            {{ question.text }}
          </div>
          <div v-if="question.caption" class="text-body-small text-medium-emphasis mb-3">{{ question.caption }}</div>
          <div class="d-flex flex-wrap ga-2" :class="{ 'mt-3': !question.caption }">
            <v-btn v-for="option in optionsFor(question)" :key="option.value"
              :color="instance.answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
              size="small" class="text-none" :class="{ 'border-light': instance.answers[i] !== option.value }"
              @click="instance.select(i, option.value)">
              {{ optionLabel(option) }}
            </v-btn>
          </div>
        </v-card>

        <div class="text-center text-body-medium text-medium-emphasis mt-4">
          {{ instance.answeredCount }} / {{ questions.length }}
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-spacer />
        <v-btn variant="tonal" rounded="lg" class="text-none" :disabled="!instance.history.length"
          @click="emit('results')">
          Résultats
        </v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :disabled="!instance.complete"
          @click="emit('save')">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Vuetify's v-card-title truncates with ellipsis by default; allow the
   title and description to wrap so the subtitle isn't cropped. */
.dialog-title {
  white-space: normal;
}
</style>
