// Shared geometry for the sleep-diary timeline, used by both the editable
// SleepBandInput and the read-only multi-day visualisation in SleepDiaryView.
//
// The window spans 24 h starting at 20:00 (20:00 → 20:00 next day), matching the
// Réseau Morphée "Agenda de vigilance et de sommeil" grid. Evening (20:00→23:59)
// sits on the left, the night in the middle, and the following day on the right.

export const TL_START = 20 // window starts at 20:00
export const TL_SPAN = 24 // 24 h wide

const pad = n => String(n).padStart(2, '0')

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

// "HH:MM" → continuous hours from the window start. Times before 20:00 belong to
// the following day, so they wrap past midnight (+24).
export function toHours(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  let hrs = h + m / 60
  if (hrs < TL_START) hrs += 24
  return hrs
}

// "HH:MM" → percentage position along the track [0, 100].
export function toPct(timeStr) {
  const hrs = toHours(timeStr)
  if (hrs === null) return null
  return clamp(((hrs - TL_START) / TL_SPAN) * 100, 0, 100)
}

// Percentage position → "HH:MM", snapped to the nearest 15 min. The Morphée
// method is explicit that times are approximate, so a coarse snap keeps entry
// fast without losing meaning.
export function pctToTime(pct) {
  const clamped = clamp(pct, 0, 100)
  const totalMin = Math.round((TL_START * 60 + (clamped / 100) * TL_SPAN * 60) / 15) * 15
  const mins = ((totalMin % 1440) + 1440) % 1440
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`
}

// 15 min expressed as a fraction of the track width — the minimum gap we keep
// between two draggable edges so they never cross.
export const MIN_GAP_PCT = (15 / (TL_SPAN * 60)) * 100

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Current consecutive streak (in days) ending today, computed from the
// sleep-diary entries. If today isn't filled yet we start from yesterday so the
// streak isn't broken before the user has had a chance to fill the day.
export function sleepStreak(entries = []) {
  const filled = new Set(entries.map(e => e.date))
  const cursor = new Date()
  let count = 0
  if (!filled.has(toIsoDate(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (filled.has(toIsoDate(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

// Hour labels every 4 h across the window, e.g. 20h · 0h · 4h … 20h.
export function hourLabels() {
  const labels = []
  for (let i = 0; i <= TL_SPAN; i += 4) {
    labels.push({ label: `${(TL_START + i) % 24}h`, pct: (i / TL_SPAN) * 100 })
  }
  return labels
}
