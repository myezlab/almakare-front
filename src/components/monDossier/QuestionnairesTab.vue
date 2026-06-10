<script setup>
import QuestionnaireResultsDialog from "@/components/QuestionnaireResultsDialog.vue"
import { useQuestionnaire } from "@/composables/useQuestionnaire"
import { useUrlPanels } from "@/composables/useUrlPanels"
import { TESTS, evaluateTest } from "@/data/tests"
import { useSelfStore } from "@/stores/self"
import { computed, reactive, ref } from "vue"

const selfStore = useSelfStore()

const openPanels = useUrlPanels("qPanels")

// One live questionnaire per catalog test (src/data/tests.js). The questions,
// options, max score and severity bands all come from that single source — the
// colour/label for a score is derived from the test's own thresholds.
const questionnaires = TESTS.map((test) => ({
  test,
  instance: reactive(
    useQuestionnaire({
      count: test.questions.length,
      answersKey: test.answersKey,
      scoreKey: test.scoreKey,
      historyKey: `${test.key}History`,
      colorFor: (score) => evaluateTest(test, score).color,
      labelFor: (score) => evaluateTest(test, score).label,
    }),
  ),
}))
const byKey = Object.fromEntries(questionnaires.map((q) => [q.test.key, q]))

function optionsFor(test, question) {
  return question.options || test.options || []
}
function optionLabel(test, option) {
  return test.showOptionValue ? `${option.value} — ${option.label}` : option.label
}
// Skeleton placeholder chips: one per answer option (Hamilton varies per
// question, so fall back to a representative count).
function skeletonChips(test) {
  return test.options?.length || 3
}

// ---- History dialog --------------------------------------------------------
const activeKey = ref(null)
const historyOpen = computed({
  get: () => activeKey.value !== null,
  set: (val) => {
    if (!val) activeKey.value = null
  },
})
const active = computed(() => (activeKey.value ? byKey[activeKey.value] : null))
const activeTitle = computed(() => active.value?.test.title || '')
const activeMaxScore = computed(() => active.value?.test.maxScore || 0)
const activeHistory = computed(() => active.value?.instance.history || [])
const activeColorFor = computed(() => (active.value ? active.value.instance.colorFor : () => 'primary'))
const activeLabelFor = computed(() => (active.value ? active.value.instance.labelFor : () => ''))

function openResults(key) {
  activeKey.value = key
}

// Save the completed questionnaire and clear the form, collapse all panels, then
// briefly wait for the collapse animation before revealing the results dialog.
function saveQuestionnaire(key) {
  const { instance } = byKey[key]
  instance.save()
  instance.reset()
  openPanels.value = []
  setTimeout(() => openResults(key), 300)
}
</script>

<template>
  <v-row class="mb-16">
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-expansion-panels v-model="openPanels" multiple variant="accordion" flat class="pa-2">
          <v-expansion-panel v-for="{ test, instance } in questionnaires" :key="test.key" :value="test.key"
            rounded="lg">
            <v-expansion-panel-title>
              <div class="d-flex align-center ga-3 flex-grow-1">
                <span class="panel-title">{{ test.title }}</span>
                <v-chip v-if="instance.latest && !$vuetify.display.mobile" :color="instance.latestColor" variant="tonal"
                  size="small" class="ml-2">
                  {{ instance.latestLabel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-medium text-medium-emphasis mb-4 pt-2">
                {{ test.description }}
              </div>

              <div v-if="selfStore.item.id">
                <v-card v-for="(question, i) in test.questions" :key="i" class="mb-3 py-4" flat rounded="lg">
                  <div class="text-body-medium font-weight-medium mb-1">
                    <span class="text-medium-emphasis mr-1">{{ i + 1 }}.</span>
                    {{ question.text }}
                  </div>
                  <div v-if="question.caption" class="text-body-small text-medium-emphasis mb-3">
                    {{ question.caption }}
                  </div>
                  <div class="d-flex flex-wrap ga-2" :class="{ 'mt-3': !question.caption }">
                    <v-btn v-for="option in optionsFor(test, question)" :key="option.value"
                      :color="instance.answers[i] === option.value ? 'primary' : undefined" variant="flat" rounded="lg"
                      size="small" class="text-none answer-btn"
                      :class="{ 'border-light': instance.answers[i] !== option.value }"
                      @click="instance.select(i, option.value)">
                      {{ optionLabel(test, option) }}
                    </v-btn>
                  </div>
                </v-card>

                <div class="text-center text-body-medium text-medium-emphasis mt-4">
                  {{ instance.answeredCount }} / {{ test.questions.length }}
                </div>

                <div class="d-flex flex-wrap align-center ga-2 mt-4">
                  <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :disabled="!instance.complete"
                    @click="saveQuestionnaire(test.key)">
                    Enregistrer
                  </v-btn>
                  <v-spacer />
                  <v-btn variant="tonal" rounded="lg" class="text-none" :disabled="!instance.history.length"
                    @click="openResults(test.key)">
                    Résultats
                  </v-btn>
                </div>
              </div>

              <div v-else>
                <v-card v-for="i in test.questions.length" :key="i" class="mb-3 pa-4" variant="outlined" rounded="lg">
                  <v-skeleton-loader type="text" class="mb-3" />
                  <div class="d-flex ga-2">
                    <v-skeleton-loader v-for="j in skeletonChips(test)" :key="j" type="chip" />
                  </div>
                </v-card>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>

  <QuestionnaireResultsDialog v-model="historyOpen" :title="activeTitle" :max-score="activeMaxScore"
    :history="activeHistory" :color-for="activeColorFor" :label-for="activeLabelFor" />
</template>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}

/* Let long option labels wrap fully instead of being clipped to one line. */
.answer-btn {
  height: auto;
  min-height: 32px;
  max-width: 100%;
}

.answer-btn :deep(.v-btn__content) {
  white-space: normal;
  text-align: left;
  padding-block: 6px;
}
</style>
