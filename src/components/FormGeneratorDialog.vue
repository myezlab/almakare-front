<script setup>
// Generic, schema-driven form rendered inside a dialog.
//
// Pass a `fields` array describing what to render and the component builds the
// form, validates it, and emits the collected values on submit. Supported field
// types: 'text', 'textarea', 'checkbox', 'options' (button group / radio).
//
// Each field definition:
//   {
//     key:        String   // property name in the emitted values object
//     type:       'text' | 'textarea' | 'checkbox' | 'options'
//     label:      String
//     cols:       Number   // grid columns on mobile     (default 12)
//     md:         Number   // grid columns from md up     (default = cols)
//     rules:      Array    // Vuetify validation rules     (optional)
//     hint, placeholder, persistentHint, inputmode        (text/textarea)
//     number:     Boolean  // text field holding a number  (optional)
//     options:    [{ title, value }]                       (type 'options')
//     rows:       Number   // textarea rows                (default 3)
//     showIf:     (model) => Boolean  // conditional display (optional)
//   }
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  fields: { type: Array, default: () => [] },
  initialValues: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: "Enregistrer" },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "submit"])

const formRef = ref(null)
const model = ref({})

// Build a fresh working copy from the field defaults / initial values every time
// the dialog opens, so reopening discards any abandoned edits.
function resetModel() {
  const next = {}
  for (const field of props.fields) {
    const initial = props.initialValues[field.key]
    if (initial !== undefined && initial !== null) {
      next[field.key] = initial
    } else if (field.type === "checkbox") {
      next[field.key] = false
    } else if (field.type === "options") {
      next[field.key] = null
    } else {
      next[field.key] = ""
    }
  }
  model.value = next
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetModel()
  },
  { immediate: true },
)

// Hide fields whose showIf condition is not met, so the form only ever shows
// what is currently relevant.
const visibleFields = computed(() =>
  props.fields.filter((f) => (f.showIf ? f.showIf(model.value) : true)),
)

function close() {
  emit("update:modelValue", false)
}

async function submit() {
  if (formRef.value) {
    const { valid } = await formRef.value.validate()
    if (!valid) return
  }
  // Only emit the values for fields that are actually visible — a conditional
  // field that is hidden should not leak a stale value back to the parent.
  const visibleKeys = new Set(visibleFields.value.map((f) => f.key))
  const values = {}
  for (const field of props.fields) {
    if (!visibleKeys.has(field.key)) continue
    let value = model.value[field.key]
    if (field.number) value = value === "" || value == null ? null : Number(value)
    values[field.key] = value
  }
  emit("submit", values)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" :fullscreen="$vuetify.display.mobile" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-title class="pa-4">
        <div class="text-headline-small font-weight-bold">{{ title }}</div>
        <div v-if="subtitle" class="text-body-small text-medium-emphasis mt-1">{{ subtitle }}</div>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="formRef" @submit.prevent="submit">
          <v-row>
            <v-col v-for="field in visibleFields" :key="field.key" cols="12" :md="field.md || field.cols || 12">

              <!-- TEXT -->
              <v-text-field v-if="field.type === 'text'" v-model.trim="model[field.key]" :label="field.label"
                :type="field.number ? 'number' : 'text'" :inputmode="field.inputmode"
                :placeholder="field.placeholder" :hint="field.hint" :persistent-hint="field.persistentHint"
                :rules="field.rules" variant="outlined" rounded="lg" />

              <!-- TEXTAREA -->
              <v-textarea v-else-if="field.type === 'textarea'" v-model.trim="model[field.key]" :label="field.label"
                :placeholder="field.placeholder" :hint="field.hint" :persistent-hint="field.persistentHint"
                :rules="field.rules" :rows="field.rows || 3" variant="outlined" rounded="lg" auto-grow />

              <!-- CHECKBOX -->
              <v-checkbox v-else-if="field.type === 'checkbox'" v-model="model[field.key]" :label="field.label"
                :rules="field.rules" color="primary" density="comfortable" hide-details="auto" />

              <!-- OPTIONS (button group) -->
              <div v-else-if="field.type === 'options'">
                <div class="field-label mb-2">{{ field.label }}</div>
                <v-btn-toggle v-model="model[field.key]" color="primary" rounded="lg" density="comfortable"
                  variant="outlined" mandatory="force">
                  <v-btn v-for="opt in field.options" :key="String(opt.value)" :value="opt.value" class="text-none">
                    {{ opt.title }}
                  </v-btn>
                </v-btn-toggle>
              </div>

            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="loading" @click="submit">
          {{ submitLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
