<script setup>
import { ISOToShortenedDate } from "@/composables/useDates"
import { useSelfStore } from "@/stores/self"
import { computed } from "vue"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }
const EMPTY = '-'

const selfStore = useSelfStore()
const currentUser = computed(() => selfStore.item || {})

const fullName = computed(() => {
  const u = currentUser.value || {}
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Mon profil'
})

const dobDisplay = computed(() => {
  const d = currentUser.value?.dob
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d
  return ISOToShortenedDate(date)
})

const genderLabel = computed(() => GENDER_LABELS[currentUser.value?.gender] || '')

const bmiDisplay = computed(() => {
  const w = currentUser.value?.weight
  const h = currentUser.value?.height
  if (!w || !h) return null
  return Math.round(w / (h * h) * 10) / 10
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <div class="text-headline-small font-weight-bold mb-1">Synthèse</div>
        <div class="text-body-small text-medium-emphasis mb-4">
          Vue d'ensemble de votre dossier patient.
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <div class="field-label">Nom complet</div>
            <div class="field-value">{{ fullName }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="field-label">Date de naissance</div>
            <div class="field-value">{{ dobDisplay || EMPTY }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="field-label">Genre</div>
            <div class="field-value">{{ genderLabel || EMPTY }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="field-label">Téléphone</div>
            <div class="field-value">{{ currentUser.phoneNumber || EMPTY }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="field-label">IMC</div>
            <div class="field-value">{{ bmiDisplay != null ? bmiDisplay : EMPTY }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="field-label">IAH</div>
            <div class="field-value">{{ currentUser.iah != null ? currentUser.iah : EMPTY }}</div>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 4px;
}

.field-value {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.4;
  word-break: break-word;
}
</style>
