<script setup>
// Emoji-face rating for the sleep diary. Keeps the Réseau Morphée 5-level scale
// (TB / B / Moy / M / TM) but presents it as tappable faces worst→best, which is
// faster and more inviting to fill than the abstract abbreviations.
import { computed } from 'vue'

// Stored values are unchanged (TB/B/Moy/M/TM) so existing entries, colours and
// the timeline visualisation keep working — only the presentation differs.
const OPTIONS = [
  { value: 'TM', emoji: '😣', label: 'Très mauvais', color: 'error' },
  { value: 'M', emoji: '😕', label: 'Mauvais', color: 'error' },
  { value: 'Moy', emoji: '😐', label: 'Moyen', color: 'warning' },
  { value: 'B', emoji: '🙂', label: 'Bien', color: 'success' },
  { value: 'TB', emoji: '😄', label: 'Très bien', color: 'success' },
]

const model = defineModel({ type: String, default: null })

const selected = computed(() => OPTIONS.find(o => o.value === model.value) || null)

function pick(value) {
  // Tapping the active face again clears it.
  model.value = model.value === value ? null : value
}
</script>

<template>
  <div>
    <div class="rating-row">
      <button v-for="opt in OPTIONS" :key="opt.value" type="button" class="face-btn"
        :class="{ 'face-active': model === opt.value, [`face-${opt.color}`]: model === opt.value }"
        @click="pick(opt.value)">
        <span class="face-emoji">{{ opt.emoji }}</span>
      </button>
    </div>
    <div class="rating-label text-medium-emphasis" :class="{ 'rating-label-set': selected }">
      {{ selected ? selected.label : 'Appuyez pour évaluer' }}
    </div>
  </div>
</template>

<style scoped>
.rating-row {
  display: flex;
  gap: 6px;
}

.face-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
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

/* Faces stay full-colour and obviously tappable by default — no hover/selection
   dependence, so they never read as disabled on touch devices. Selection is
   conveyed by the coloured border/shadow below, not by dimming the others. */
.face-emoji {
  font-size: 26px;
  line-height: 1;
}

.face-btn:active {
  transform: scale(0.92);
}

/* Selected face gets a subtle tint in addition to the coloured border below. */
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

.rating-label {
  text-align: center;
  font-size: 0.85rem;
  margin-top: 8px;
  min-height: 20px;
}

.rating-label-set {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
}
</style>
