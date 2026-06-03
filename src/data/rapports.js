// Rapports = the medical report documents a doctor produces after a past
// activity. Each rapport mirrors the activity's free-text `report` (shown as the
// "Compte rendu" in ActivitesTab) but is presented as a downloadable PDF that
// also lives in the patient's documents, retrievable from the "Rapports" panel
// of the Documents tab.
//
// Rapports are derived from any non-cancelled activity that carries a report, so
// there is a single source of truth (activities.json) — no duplicated content.

import ACTIVITIES_DATA from "@/data/activities.json"

// Combining diacritical marks (accents), built from unicode escapes so the
// source stays plain-ASCII and editor-safe.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")

// "Consultation de pneumologie" → "consultation-de-pneumologie"
function slugify(value) {
  return (value || "rapport")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function buildRapport(activity) {
  if (!activity.report || activity.cancelled) return null
  const day = (activity.startAt || "").slice(0, 10) // YYYY-MM-DD
  return {
    id: `rapport-${activity.id}`,
    activityId: activity.id,
    title: activity.title,
    doctor: activity.doctor,
    date: activity.startAt,
    report: activity.report,
    name: `${slugify(activity.title)}-${day}.pdf`,
    type: "application/pdf",
  }
}

// Most recent first, matching the "Passés" ordering of the activities list.
export const RAPPORTS = [...ACTIVITIES_DATA]
  .map(buildRapport)
  .filter(Boolean)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export const RAPPORTS_BY_ACTIVITY = RAPPORTS.reduce((acc, rapport) => {
  acc[rapport.activityId] = rapport
  return acc
}, {})
