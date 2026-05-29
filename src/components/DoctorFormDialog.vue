<script setup>
// Renders a free-form, doctor-authored form inside a dialog.
//
// Unlike the catalog-driven dialogs (TestDialog, FormGeneratorDialog), the form
// here is *unstructured*: the doctor composes their own questions for a given
// patient and they live inline on the activity (`requestedData` in
// activities.json). This component just renders whatever questions it is given
// and collects one answer per question.
//
// Question shape (all keys but `label` optional):
//   {
//     label:   String                       // the question text
//     type:    'text' | 'textarea' | 'choice' | 'boolean' | 'scale'  (default 'text')
//     options: [String]                      // choices (type 'choice')
//     min, max: Number                       // bounds (type 'scale', default 0..10)
//     hint:    String                        // helper text under the field
//     optional: Boolean                      // not required for completion
//   }
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "Formulaire de votre médecin" },
  subtitle: { type: String, default: "" },
  questions: { type: Array, default: () => [] },
  initialAnswers: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "submit"])

const answers = ref([])

// Seed a fresh answer per question each time the dialog opens, reusing any
// previously saved answers.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    answers.value = props.questions.map((q, i) => {
      const saved = props.initialAnswers?.[i]
      if (saved !== undefined && saved !== null) return saved
      return q.type === "boolean" || q.type === "choice" || q.type === "scale" ? null : ""
    })
  },
  { immediate: true },
)

function isAnswered(question, answer) {
  if (question.type === "boolean") return answer === true || answer === false
  if (typeof answer === "number") return true
  return answer != null && String(answer).trim() !== ""
}

const allRequiredAnswered = computed(() =>
  props.questions.every((q, i) => q.optional || isAnswered(q, answers.value[i])),
)

const answeredCount = computed(
  () => props.questions.filter((q, i) => isAnswered(q, answers.value[i])).length,
)

function setAnswer(index, value) {
  const next = [...answers.value]
  next[index] = value
  answers.value = next
}

function scaleValues(question) {
  const min = question.min ?? 0
  const max = question.max ?? 10
  return Array.from({ length: max - min + 1 }, (_, k) => min + k)
}

function close() {
  emit("update:modelValue", false)
}

function submit() {
  if (!allRequiredAnswered.value) return
  emit("submit", answers.value)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" :fullscreen="$vuetify.display.mobile" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-title class="pa-4">
        <div class="text-headline-small font-weight-bold">{{ title }}</div>
        <div v-if="subtitle" class="text-body-small text-medium-emphasis mt-1">{{ subtitle }}</div>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <v-card v-for="(question, i) in questions" :key="i" class="mb-3 py-4" flat rounded="lg">
          <div class="text-body-medium font-weight-medium mb-1">
            <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
            {{ question.label }}
            <span v-if="question.optional" class="text-body-small text-medium-emphasis font-weight-regular">
              (facultatif)
            </span>
          </div>
          <div v-if="question.hint" class="text-body-small text-medium-emphasis mb-3">{{ question.hint }}</div>

          <!-- TEXT -->
          <v-text-field v-if="!question.type || question.type === 'text'" :model-value="answers[i]"
            :placeholder="question.placeholder" variant="outlined" rounded="lg" hide-details="auto"
            class="mt-2" @update:model-value="setAnswer(i, $event)" />

          <!-- TEXTAREA -->
          <v-textarea v-else-if="question.type === 'textarea'" :model-value="answers[i]"
            :placeholder="question.placeholder" :rows="question.rows || 3" variant="outlined" rounded="lg"
            auto-grow hide-details="auto" class="mt-2" @update:model-value="setAnswer(i, $event)" />

          <!-- CHOICE (single select) -->
          <div v-else-if="question.type === 'choice'" class="d-flex flex-wrap ga-2 mt-3">
            <v-btn v-for="opt in question.options" :key="opt"
              :color="answers[i] === opt ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
              class="text-none" :class="{ 'border-light': answers[i] !== opt }" @click="setAnswer(i, opt)">
              {{ opt }}
            </v-btn>
          </div>

          <!-- BOOLEAN (yes / no) -->
          <div v-else-if="question.type === 'boolean'" class="d-flex flex-wrap ga-2 mt-3">
            <v-btn :color="answers[i] === true ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
              class="text-none" :class="{ 'border-light': answers[i] !== true }" @click="setAnswer(i, true)">
              Oui
            </v-btn>
            <v-btn :color="answers[i] === false ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
              class="text-none" :class="{ 'border-light': answers[i] !== false }" @click="setAnswer(i, false)">
              Non
            </v-btn>
          </div>

          <!-- SCALE (numeric buttons) -->
          <div v-else-if="question.type === 'scale'" class="d-flex flex-wrap ga-2 mt-3">
            <v-btn v-for="n in scaleValues(question)" :key="n"
              :color="answers[i] === n ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
              class="text-none scale-btn" :class="{ 'border-light': answers[i] !== n }" @click="setAnswer(i, n)">
              {{ n }}
            </v-btn>
          </div>
        </v-card>

        <div class="text-center text-body-medium text-medium-emphasis mt-4">
          {{ answeredCount }} / {{ questions.length }}
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="loading"
          :disabled="!allRequiredAnswered" @click="submit">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.scale-btn {
  min-width: 44px;
}
</style>
