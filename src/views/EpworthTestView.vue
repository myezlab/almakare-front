<script setup>
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import { doc, getFirestore, updateDoc } from 'firebase/firestore'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const db = getFirestore()

const QUESTIONS = [
  'EPWORTH_QUESTION_1',
  'EPWORTH_QUESTION_2',
  'EPWORTH_QUESTION_3',
  'EPWORTH_QUESTION_4',
  'EPWORTH_QUESTION_5',
  'EPWORTH_QUESTION_6',
  'EPWORTH_QUESTION_7',
  'EPWORTH_QUESTION_8',
]

const ANSWER_OPTIONS = [
  { value: 0, labelKey: 'EPWORTH_NEVER' },
  { value: 1, labelKey: 'EPWORTH_LOW' },
  { value: 2, labelKey: 'EPWORTH_MODERATE' },
  { value: 3, labelKey: 'EPWORTH_HIGH' },
]

const answers = ref([null, null, null, null, null, null, null, null])

watch(
  () => selfStore.item?.epworthAnswers,
  (val) => {
    if (Array.isArray(val) && val.length === 8) {
      answers.value = [...val]
    }
  },
  { immediate: true },
)

const epworthScore = computed(() => {
  if (answers.value.some((v) => v === null)) return null
  return answers.value.reduce((sum, v) => sum + v, 0)
})

const scoreColor = computed(() => {
  if (epworthScore.value === null) return 'primary'
  if (epworthScore.value <= 10) return 'success'
  if (epworthScore.value <= 15) return 'warning'
  return 'error'
})

const scoreLabel = computed(() => {
  if (epworthScore.value === null) return ''
  if (epworthScore.value <= 10) return t('EPWORTH_SCORE_NORMAL')
  if (epworthScore.value <= 15) return t('EPWORTH_SCORE_MODERATE')
  return t('EPWORTH_SCORE_SEVERE')
})

async function selectAnswer(questionIndex, value) {
  const newAnswers = [...answers.value]
  newAnswers[questionIndex] = value
  answers.value = newAnswers

  try {
    const score = newAnswers.every((v) => v !== null)
      ? newAnswers.reduce((sum, v) => sum + v, 0)
      : null
    const updateData = { epworthAnswers: newAnswers }
    if (score !== null) updateData.epworthScore = score
    await updateDoc(doc(db, `users/${selfStore.item.id}`), updateData)
    if (score !== null) selfStore.item.epworthScore = score
    selfStore.item.epworthAnswers = newAnswers
  } catch {
    messagesStore.add({ type: 'error', text: t('EPWORTH_SAVE_ERROR') })
  }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-3 mb-16 pb-10" :class="{ 'mx-6': !$vuetify.display.mobile }">
      <v-col :cols="$vuetify.display.mobile ? 12 : 8">

        <v-card flat color="transparent" class="mb-4 pa-5">
          <div class="text-headline-medium font-weight-bold mb-2">{{ $t('EPWORTH_TEST') }}</div>
          <div class="text-body-medium text-medium-emphasis">{{ $t('EPWORTH_TEST_DESCRIPTION') }}</div>
        </v-card>

        <div v-if="selfStore.item.createdAt">
          <!-- Questions -->
          <v-card v-for="(questionKey, i) in QUESTIONS" :key="i" class="mb-3 card-shadow pa-5"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <div class="text-body-large font-weight-medium mb-4">
              <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
              {{ $t(questionKey) }}
            </div>

            <div class="d-flex flex-wrap gap-2">
              <v-btn v-for="option in ANSWER_OPTIONS" :key="option.value"
                :color="answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg" size="small"
                class="text-none" :class="{ 'border-light': answers[i] !== option.value }"
                @click="selectAnswer(i, option.value)">
                {{ $t(option.labelKey) }}
              </v-btn>
            </div>
          </v-card>

          <!-- Score -->
          <v-card v-if="epworthScore !== null" :class="{ 'mx-6': $vuetify.display.mobile }" flat color="white"
            class="mt-6 pa-6 card-shadow rounded-15 text-center"
            :style="`border-top: 4px solid rgb(var(--v-theme-${scoreColor}))`">
            <div class="text-body-small text-medium-emphasis text-uppercase font-weight-bold letter-spacing mb-3">
              Score total
            </div>
            <div :class="`text-display-small font-weight-bold text-${scoreColor}`">{{ epworthScore }}<span
                class="text-title-large text-medium-emphasis"> / 24</span></div>
            <v-chip :color="scoreColor" variant="tonal" rounded="pill" size="small" class="mt-3">
              {{ scoreLabel }}
            </v-chip>
          </v-card>

          <div v-else class="text-center text-body-medium text-medium-emphasis mt-4">
            {{answers.filter(v => v !== null).length}} / 8
          </div>

        </div>

        <div v-else>
          <v-card v-for="i in 8" :key="i" class="mb-3 card-shadow pa-5"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <v-skeleton-loader type="text" class="mb-4" />
            <div class="d-flex gap-2">
              <v-skeleton-loader v-for="j in 4" :key="j" type="chip" />
            </div>
          </v-card>
        </div>

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.letter-spacing {
  letter-spacing: 0.08em;
}

.gap-2 {
  gap: 8px;
}
</style>
