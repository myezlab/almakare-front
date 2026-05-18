<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  rules: { type: Array, default: () => [] },
  prependInnerIcon: { type: [String, Array], default: undefined },
})
const emit = defineEmits(['update:modelValue'])

const menu = ref(false)

const value = computed({
  get: () => props.modelValue || null,
  set: (v) => emit('update:modelValue', v || ''),
})
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom start">
    <template #activator="{ props: activatorProps }">
      <v-text-field
        :model-value="modelValue"
        :label="label"
        :rules="rules"
        :prepend-inner-icon="prependInnerIcon"
        readonly
        variant="outlined"
        rounded="lg"
        density="comfortable"
        v-bind="activatorProps"
      />
    </template>
    <v-time-picker
      v-model="value"
      format="24hr"
      :allowed-minutes="(m) => m % 5 === 0"
      @update:model-value="menu = false"
    />
  </v-menu>
</template>
