<script setup>
import { useSelfStore } from '@/stores/self'
import { mdiFire } from '@mdi/js'
import { computed } from 'vue'

// Reusable weekly streak indicator for the sleep diary. Shows the 7 days of the
// current week (Mon→Sun) with a flame per day: coloured when an entry exists,
// greyscale otherwise. Used on the SleepDiary view and the dashboard card.
const props = defineProps({
  // Optional override; defaults to the persisted sleep-diary entries.
  entries: { type: Array, default: null },
  // Compact rendering for tight spaces (e.g. dashboard card).
  dense: { type: Boolean, default: false },
})

const selfStore = useSelfStore()

const allEntries = computed(() =>
  props.entries ?? selfStore.item.sleepDiaryEntries ?? [],
)

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function toIso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// The 7 days of the current week, Monday-first.
const week = computed(() => {
  const filled = new Set(allEntries.value.map(e => e.date))
  const now = new Date()
  const todayIso = toIso(now)

  // Monday as the first day (JS getDay: 0=Sun … 6=Sat).
  const monday = new Date(now)
  const offset = (now.getDay() + 6) % 7
  monday.setDate(now.getDate() - offset)

  return DAY_LABELS.map((label, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const iso = toIso(date)
    return {
      label,
      iso,
      done: filled.has(iso),
      isToday: iso === todayIso,
      isFuture: iso > todayIso,
    }
  })
})

// Current consecutive streak ending today (or yesterday if today not yet filled).
const streak = computed(() => {
  const filled = new Set(allEntries.value.map(e => e.date))
  const cursor = new Date()
  let count = 0
  // If today isn't filled yet, start counting from yesterday so the streak
  // isn't broken before the user has had a chance to fill the day.
  if (!filled.has(toIso(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (filled.has(toIso(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
})

const iconSize = computed(() => (props.dense ? 22 : 30))
</script>

<template>
  <div>
    <div class="d-flex align-center mb-2" :style="{ gap: dense ? '6px' : '8px' }">
      <v-icon :icon="mdiFire" :size="dense ? 18 : 22" color="deep-orange" />
      <span :class="dense ? 'text-body-medium' : 'text-title-medium'" class="font-weight-bold">
        {{ streak }} {{ streak > 1 ? 'jours' : 'jour' }} d'affilée
      </span>
    </div>
    <div class="d-flex" :style="{ gap: dense ? '4px' : '8px' }">
      <div v-for="day in week" :key="day.iso" class="d-flex flex-column align-center flex-1">
        <v-icon :icon="mdiFire" :size="iconSize" :class="{ 'flame-off': !day.done, 'flame-today': day.isToday && !day.done }"
          :color="day.done ? 'deep-orange' : undefined" />
        <span class="day-label text-medium-emphasis" :class="{ 'font-weight-bold': day.isToday }">
          {{ day.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-1 {
  flex: 1;
}

.day-label {
  font-size: 11px;
  margin-top: 2px;
}

/* Greyscale flame for days without an entry. */
.flame-off {
  color: rgba(0, 0, 0, 0.18);
}

/* Today, not yet filled — a subtle nudge to complete it. */
.flame-today {
  color: rgba(255, 112, 67, 0.45);
}
</style>
