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

function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISO(date) {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dateObj = computed({
  get: () => parseISO(props.modelValue),
  set: (v) => {
    emit('update:modelValue', toISO(v))
    menu.value = false
  },
})

const display = computed(() => {
  if (!props.modelValue) return ''
  const [y, m, d] = props.modelValue.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
})
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom start">
    <template #activator="{ props: activatorProps }">
      <v-text-field
        :model-value="display"
        :label="label"
        :rules="rules"
        :prepend-inner-icon="prependInnerIcon"
        placeholder="JJ/MM/AAAA"
        readonly
        variant="outlined"
        rounded="lg"
        density="comfortable"
        v-bind="activatorProps"
      />
    </template>
    <v-date-picker
      :model-value="dateObj"
      hide-header
      show-adjacent-months
      @update:model-value="dateObj = $event"
    />
  </v-menu>
</template>
