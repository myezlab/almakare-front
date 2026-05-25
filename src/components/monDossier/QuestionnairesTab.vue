<script setup>
import { useSelfStore } from "@/stores/self"
import { mdiChevronRight, mdiClipboardPulseOutline } from "@mdi/js"
import { computed } from "vue"
import { useRouter } from "vue-router"

const selfStore = useSelfStore()
const router = useRouter()
const currentUser = computed(() => selfStore.item || {})

const epworthScoreColor = computed(() => {
  const score = currentUser.value?.epworthScore
  if (score == null) return 'primary'
  if (score <= 10) return 'success'
  if (score <= 15) return 'warning'
  return 'error'
})

const epworthScoreLabel = computed(() => {
  const score = currentUser.value?.epworthScore
  if (score == null) return ''
  if (score <= 10) return 'Somnolence normale'
  if (score <= 15) return 'Somnolence modérée'
  return 'Somnolence sévère'
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
          <span class="text-headline-small font-weight-bold text-truncate">Questionnaires</span>
        </v-card-title>
        <v-card-text class="px-4 pt-2 pb-2 text-body-small text-medium-emphasis">
          Répondez aux questionnaires de suivi médical.
        </v-card-text>

        <v-list :lines="currentUser.epworthScore != null && $vuetify.display.mobile ? 'three' : 'two'" class="pa-0">
          <v-list-item rounded="lg" class="ma-2" @click="router.push({ name: 'EpworthTest' })">
            <template #prepend>
              <v-avatar color="primary" variant="tonal" rounded="lg">
                <v-icon :icon="mdiClipboardPulseOutline" />
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">Test d'Epworth</v-list-item-title>
            <v-list-item-subtitle class="text-wrap">
              Évaluez votre somnolence diurne en répondant à 8 questions
            </v-list-item-subtitle>
            <v-chip
              v-if="currentUser.epworthScore != null && $vuetify.display.mobile"
              :color="epworthScoreColor" variant="tonal" size="small" class="mt-2">
              {{ epworthScoreLabel }}
            </v-chip>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip
                  v-if="currentUser.epworthScore != null && !$vuetify.display.mobile"
                  :color="epworthScoreColor" variant="tonal" size="small">
                  {{ epworthScoreLabel }}
                </v-chip>
                <v-icon :icon="mdiChevronRight" color="medium-emphasis" />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>
