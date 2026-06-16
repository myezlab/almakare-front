<script setup>
// Lets the patient self-assess their CPAP (PPC) therapy by answering three
// subjective questions — did I use my machine well, do I feel better with it,
// and do I see the benefits. The answers are stored on the self item so the
// card can show the latest assessment and its date.
import { useSelfStore } from "@/stores/self"
import { mdiClipboardTextOutline, mdiMessageTextOutline } from "@mdi/js"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(["update:modelValue"])

const { mobile } = useDisplay()
const router = useRouter()
const selfStore = useSelfStore()

// The three self-assessment questions. Each answer is keyed by `key`.
const QUESTIONS = [
  { key: "usedWell", label: "Ai-je bien utilisé ma machine ?" },
  { key: "feelBetter", label: "Est-ce que je me sens mieux quand j'utilise ma machine ?" },
  { key: "seeBenefits", label: "Est-ce que je vois les bénéfices de l'utilisation de ma machine ?" },
]

// A simple three-point scale, worst→best, presented as tappable faces — same
// visual language as the sleep-diary QualityRating.
const OPTIONS = [
  { value: "no", emoji: "😕", label: "Non", color: "error" },
  { value: "somewhat", emoji: "😐", label: "Plutôt", color: "warning" },
  { value: "yes", emoji: "🙂", label: "Oui", color: "success" },
]

// Local, editable copy of the answers — committed to the store on save.
const answers = ref({})

// Reset the working copy from the stored assessment every time the dialog opens.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    answers.value = { ...(selfStore.item.treatmentSelfAssessment?.answers || {}) }
  },
  { immediate: true },
)

const lastDate = computed(() => {
  const iso = selfStore.item.treatmentSelfAssessment?.date
  return iso ? dayjs(iso).locale("fr").format("DD/MM/YYYY") : ""
})

const allAnswered = computed(() => QUESTIONS.every((q) => answers.value[q.key]))

// When the patient answers "Non" to every question, their therapy is going
// poorly enough that we nudge them to reach out to their provider directly.
const allNo = computed(() => QUESTIONS.every((q) => answers.value[q.key] === "no"))

function pick(questionKey, value) {
  // Tapping the active option again clears it.
  answers.value = {
    ...answers.value,
    [questionKey]: answers.value[questionKey] === value ? null : value,
  }
}

function close() {
  emit("update:modelValue", false)
}

function contactProvider() {
  close()
  router.push({ path: "/mon-dossier", query: { tab: "chat" } })
}

function save() {
  if (!allAnswered.value) return
  selfStore.item.treatmentSelfAssessment = {
    date: dayjs().format("YYYY-MM-DD"),
    answers: { ...answers.value },
  }
  close()
}
</script>

<template>
  <v-dialog :model-value="modelValue" :fullscreen="mobile" :max-width="mobile ? undefined : 560" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card class="card-shadow" :class="{ 'rounded-15': !mobile }">
      <v-card-item class="pa-4">
        <template #prepend>
          <div class="assess-icon" aria-hidden="true">
            <v-icon :icon="mdiClipboardTextOutline" size="24" />
          </div>
        </template>
        <v-card-title class="text-headline-small font-weight-bold text-wrap">
          Mon ressenti sur le traitement
        </v-card-title>
        <v-card-subtitle class="text-body-medium text-medium-emphasis text-wrap mt-1">
          Quelques questions pour faire le point sur votre traitement.
          <template v-if="lastDate"> Dernière réponse le {{ lastDate }}.</template>
        </v-card-subtitle>
      </v-card-item>

      <v-divider />

      <v-card-text class="pa-4">
        <div v-for="(q, i) in QUESTIONS" :key="q.key" :class="{ 'mt-6': i > 0 }">
          <div class="text-title-small font-weight-bold mb-3">{{ q.label }}</div>
          <div class="rating-row">
            <button v-for="opt in OPTIONS" :key="opt.value" type="button" class="face-btn"
              :class="{ 'face-active': answers[q.key] === opt.value, [`face-${opt.color}`]: answers[q.key] === opt.value }"
              @click="pick(q.key, opt.value)">
              <span class="face-emoji">{{ opt.emoji }}</span>
              <span class="face-label">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div v-if="allNo" class="contact-note mt-6">
          <div class="text-body-medium mb-3">
            Votre traitement ne semble pas se passer comme prévu. N'hésitez pas à
            contacter votre prestataire pour en parler.
          </div>
          <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :prepend-icon="mdiMessageTextOutline"
            @click="contactProvider">
            Contacter mon prestataire
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :disabled="!allAnswered" @click="save">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.assess-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
}

.rating-row {
  display: flex;
  gap: 8px;
}

.contact-note {
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
}

.face-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 64px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  cursor: pointer;
  /* Normalize iOS Safari's native button chrome and tap flash. */
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.face-emoji {
  font-size: 26px;
  line-height: 1;
}

.face-label {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
}

.face-btn:active {
  transform: scale(0.94);
}

.face-active {
  background: rgba(0, 0, 0, 0.02);
}

.face-error {
  border-color: rgb(var(--v-theme-error));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-error));
}

.face-warning {
  border-color: rgb(var(--v-theme-warning));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-warning));
}

.face-success {
  border-color: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-success));
}
</style>
