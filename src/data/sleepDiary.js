// Fake data for the "Agenda du sommeil" (sleep diary) and its link to the
// "Suivi de mon traitement" (PPC) card.
//
// Night quality is the agenda's own datum (answer to the "Qualité de la nuit"
// question). We expose it two ways:
//  - nightQualityByDate : ~6 months of quality, keyed by ISO date. The PPC card
//    overlays the matching emoji on its curves, so the patient sees how a night
//    *felt* alongside the device's objective metrics. This is the link between
//    the two views.
//  - fakeSleepDiaryEntries : a few weeks of fully-detailed recent entries
//    (coucher/lever, réveils, siestes, somnolence…) used to pre-populate the
//    diary so the page isn't empty in the demo.
import dayjs from "dayjs"

// Stored on the 5-level Réseau Morphée scale (worst → best), matching
// QualityRating.vue so the chips, colours and timeline keep working.
const QUALITY_ORDER = ["TM", "M", "Moy", "B", "TB"]

export const QUALITY_EMOJI = { TM: "😣", M: "😕", Moy: "😐", B: "🙂", TB: "😄" }
export const QUALITY_VALUE = { TM: 1, M: 2, Moy: 3, B: 4, TB: 5 }
export const QUALITY_LABEL = {
  TM: "Très mauvaise",
  M: "Mauvaise",
  Moy: "Moyenne",
  B: "Bonne",
  TB: "Très bonne",
}
export const QUALITY_BY_VALUE = { 1: "TM", 2: "M", 3: "Moy", 4: "B", 5: "TB" }

// Anchor the generated history to the demo's "today" so dates line up with
// ppcTracking (which ends 2026-06-16) and stay stable across reloads — we avoid
// Date.now()/new Date() for the same reason ppcTracking does.
const ANCHOR = "2026-06-16"

// Deterministic pseudo-random in [0, 1) from a seed (same trick as ppcTracking).
const rnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const pad = (n) => String(n).padStart(2, "0")
// Minutes-since-midnight → "HH:MM" (wraps past 24h so a 25:30 becomes 01:30).
const hm = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`

// Pick a night-quality level for a given day. Weighted toward Moy/B with the odd
// great or rough night, so the curve looks lived-in rather than flat.
function qualityFor(k) {
  const r = rnd(k + 7)
  if (r < 0.08) return "TM"
  if (r < 0.24) return "M"
  if (r < 0.54) return "Moy"
  if (r < 0.84) return "B"
  return "TB"
}

// ~6 months of night quality, oldest → newest, so the PPC card can show emojis
// across the 1 semaine / 1 mois / 6 mois ranges.
export const nightQuality = []
for (let k = 182; k >= 0; k--) {
  nightQuality.push({
    date: dayjs(ANCHOR).subtract(k, "day").format("YYYY-MM-DD"),
    quality: qualityFor(k),
  })
}

export const nightQualityByDate = Object.fromEntries(
  nightQuality.map((e) => [e.date, e.quality]),
)

// A morning/daytime form that hovers around the night's quality (±1 level), so
// the detailed entries feel internally consistent.
function near(quality, seed) {
  const base = QUALITY_VALUE[quality]
  const delta = rnd(seed) < 0.45 ? 0 : rnd(seed + 0.5) < 0.5 ? -1 : 1
  return QUALITY_BY_VALUE[Math.min(5, Math.max(1, base + delta))]
}

// Build one fully-detailed diary entry for the day k nights before the anchor.
function detailedEntry(k) {
  const date = dayjs(ANCHOR).subtract(k, "day").format("YYYY-MM-DD")
  const quality = nightQualityByDate[date]

  const bed = 22 * 60 + 15 + Math.round(rnd(k + 11) * 90) // 22:15 → 23:45
  const wake = 6 * 60 + 20 + Math.round(rnd(k + 12) * 95) // 06:20 → 07:55

  const entry = {
    date,
    bedtime: hm(bed),
    wakeTime: hm(wake),
    awakenings: [],
    nightQuality: quality,
    morningForm: near(quality, k + 21),
    medications: "",
    naps: [],
    somnolence: [],
    daytimeForm: near(quality, k + 31),
  }

  // Poorer nights are more likely to carry a nocturnal awakening.
  if (rnd(k + 13) > (QUALITY_VALUE[quality] >= 4 ? 0.75 : 0.5)) {
    const start = wake - 180 - Math.round(rnd(k + 14) * 120)
    entry.awakenings.push({ start: hm(start), end: hm(start + 15 + Math.round(rnd(k + 15) * 30)) })
  }

  // Occasional afternoon nap (14:00 → 16:00, 20–60 min).
  if (rnd(k + 16) > 0.78) {
    const ns = 14 * 60 + Math.round(rnd(k + 17) * 120)
    entry.naps.push({ start: hm(ns), end: hm(ns + 20 + Math.round(rnd(k + 18) * 40)) })
  }

  // Occasional daytime sleepiness marker (15:00 → 18:00).
  if (rnd(k + 19) > 0.7) {
    entry.somnolence.push(hm(15 * 60 + Math.round(rnd(k + 20) * 180)))
  }

  return entry
}

// Detailed entries for the last 6 weeks (excluding the anchor day itself, so the
// "Comment avez-vous dormi cette nuit ?" quick-log card still has a night to
// fill). Newest first, matching how the view persists and renders entries.
export const fakeSleepDiaryEntries = []
for (let k = 1; k <= 42; k++) {
  fakeSleepDiaryEntries.push(detailedEntry(k))
}
fakeSleepDiaryEntries.sort((a, b) => b.date.localeCompare(a.date))
