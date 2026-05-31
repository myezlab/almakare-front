import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import dayjs from "dayjs"
import { computed, ref, watch } from "vue"

/**
 * Manages a single scored questionnaire: the in-progress (draft) answers, the
 * live score, and a persisted history of { score, date } entries.
 *
 * The form is filled freely and only committed to the history when `save()` is
 * called, which is allowed exclusively once every question is answered. `save`
 * also mirrors the latest score onto `scoreKey` so summary surfaces (e.g. the
 * dashboard prompts) stay in sync.
 *
 * @param {Object} cfg
 * @param {number} cfg.count       Number of questions.
 * @param {string} cfg.answersKey  selfStore key holding the in-progress answers.
 * @param {string} cfg.scoreKey    selfStore key holding the latest saved score.
 * @param {string} cfg.historyKey  selfStore key holding the saved score history.
 * @param {(score: number|null) => string} cfg.colorFor  Severity color for a score.
 * @param {(score: number|null) => string} cfg.labelFor  Severity label for a score.
 */
export function useQuestionnaire({ count, answersKey, scoreKey, historyKey, colorFor, labelFor }) {
  const selfStore = useSelfStore()
  const messagesStore = useMessagesStore()

  const answers = ref(Array(count).fill(null))

  // Restore any in-progress answers persisted on the patient record.
  watch(
    () => selfStore.item?.[answersKey],
    (val) => {
      if (Array.isArray(val) && val.length === count) answers.value = [...val]
    },
    { immediate: true },
  )

  const answeredCount = computed(() => answers.value.filter((v) => v !== null).length)
  const complete = computed(() => answeredCount.value === count)
  const score = computed(() =>
    complete.value ? answers.value.reduce((sum, v) => sum + v, 0) : null,
  )

  const history = computed(() => selfStore.item?.[historyKey] || [])
  const latest = computed(() =>
    history.value.length ? history.value[history.value.length - 1] : null,
  )

  const latestColor = computed(() => colorFor(latest.value ? latest.value.score : null))
  const latestLabel = computed(() => labelFor(latest.value ? latest.value.score : null))

  function select(questionIndex, value) {
    const next = [...answers.value]
    next[questionIndex] = value
    answers.value = next
    selfStore.item[answersKey] = next
  }

  function save() {
    if (!complete.value) return
    const entry = { score: score.value, date: dayjs().toISOString() }
    selfStore.item[historyKey] = [...history.value, entry]
    selfStore.item[scoreKey] = entry.score
    messagesStore.add({ type: "success", text: "Questionnaire enregistré" })
  }

  function reset() {
    answers.value = Array(count).fill(null)
    selfStore.item[answersKey] = answers.value
  }

  return {
    answers,
    answeredCount,
    complete,
    score,
    history,
    latest,
    latestColor,
    latestLabel,
    colorFor,
    labelFor,
    select,
    save,
    reset,
  }
}
