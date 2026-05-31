<script setup>
// Renders a scored questionnaire (from src/data/tests.js) inside a dialog.
//
// The patient answers each question with an option button; the running score
// and its severity band are shown live. Once every question is answered, the
// "Enregistrer" action emits { answers, score } for the parent to persist.
import { evaluateTest } from "@/data/tests"
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  test: { type: Object, default: null },
  initialAnswers: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "submit"])

const answers = ref([])

// Seed a fresh answer array each time the dialog opens, reusing any previously
// saved answers for this test.
watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.test) return
    const count = props.test.questions.length
    answers.value = Array.from({ length: count }, (_, i) =>
      props.initialAnswers?.[i] != null ? props.initialAnswers[i] : null,
    )
  },
  { immediate: true },
)

const questions = computed(() => props.test?.questions || [])
const answeredCount = computed(() => answers.value.filter((v) => v !== null).length)
const allAnswered = computed(
  () => questions.value.length > 0 && answeredCount.value === questions.value.length,
)
const score = computed(() =>
  allAnswered.value ? answers.value.reduce((sum, v) => sum + v, 0) : null,
)
const result = computed(() => evaluateTest(props.test, score.value))

function optionsFor(question) {
  return question.options || props.test?.options || []
}

function optionLabel(option) {
  return props.test?.showOptionValue ? `${option.value} — ${option.label}` : option.label
}

function selectAnswer(index, value) {
  const next = [...answers.value]
  next[index] = value
  answers.value = next
}

function close() {
  emit("update:modelValue", false)
}

function submit() {
  if (!allAnswered.value) return
  emit("submit", { answers: answers.value, score: score.value })
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" :fullscreen="$vuetify.display.mobile" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="test" class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
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
              :color="answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
              class="text-none" :class="{ 'border-light': answers[i] !== option.value }"
              @click="selectAnswer(i, option.value)">
              {{ optionLabel(option) }}
            </v-btn>
          </div>
        </v-card>

        <v-card v-if="score !== null" flat class="mt-4 pa-6 rounded-lg text-center" variant="outlined"
          :style="`border-top: 4px solid rgb(var(--v-theme-${result.color}))`">
          <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing mb-3">
            Score total
          </div>
          <div :class="`text-display-small font-weight-bold text-${result.color}`">
            {{ score }}<span class="text-title-large text-medium-emphasis"> / {{ test.maxScore }}</span>
          </div>
          <v-chip :color="result.color" variant="tonal" rounded="pill" size="small" class="mt-3">
            {{ result.label }}
          </v-chip>
        </v-card>

        <div v-else class="text-center text-body-medium text-medium-emphasis mt-4">
          {{ answeredCount }} / {{ questions.length }}
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="loading"
          :disabled="!allAnswered" @click="submit">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}

/* Vuetify's v-card-title truncates with ellipsis by default; allow the
   title and description to wrap so the subtitle isn't cropped. */
.dialog-title {
  white-space: normal;
}
</style>
