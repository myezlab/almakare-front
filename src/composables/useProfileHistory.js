// Shared modification-history logic for the patient profile (Données générales /
// Données cliniques). Both the "Mon dossier" profile editor and the activity
// preparation form (FormGeneratorDialog) go through here, so an edit made from
// either place produces the same labelled history entries on the self store.
//
// Each history entry: { id, section: 'general' | 'clinical', date (ISO), author,
//   changes: [{ label, from, to }] }. Snapshot labels match the seeded history
// (src/data/profileHistory.js) so old and new entries line up field for field.

import { ISOToDDMMYYYY } from "@/composables/useDates"
import { PROFILE_HISTORY_SEED } from "@/data/profileHistory"
import { useSelfStore } from "@/stores/self"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }
const SLEEP_LATENCY_LABELS = { rapide: 'Rapide', lente: 'Lente' }

// Format a 15-digit NIR into the spaced display form. Returns null when empty,
// and the raw input untouched when it isn't a full 15-digit number.
export function formatNir(nir) {
  if (!nir) return null
  const clean = String(nir).replace(/\D/g, '')
  if (clean.length !== 15) return nir
  return `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)} ${clean.slice(13, 15)}`
}

// Labelled snapshot of the "Données générales" section so two snapshots can be
// diffed field by field.
export function generalSnapshot(u = {}) {
  const dob = u.dob ? ISOToDDMMYYYY(u.dob?.toDate ? u.dob.toDate() : u.dob) : ''
  const address = [u.postalAddress, [u.postalCode, u.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [
    { label: 'Prénom', value: u.firstName || '' },
    { label: 'Nom', value: u.lastName || '' },
    { label: 'Nom de naissance', value: u.birthName || '' },
    { label: 'Genre', value: GENDER_LABELS[u.gender] || '' },
    { label: 'Date de naissance', value: dob },
    { label: 'Téléphone', value: u.phoneNumber || '' },
    { label: 'Adresse', value: address },
    { label: 'Régime alimentaire', value: u.hasDietaryRestrictions === false ? 'Aucun' : (u.dietaryRestrictions || '') },
    { label: 'Antécédents médicaux', value: u.hasMedicalHistory === false ? 'Aucun' : (u.medicalHistory || '') },
    { label: 'Numéro de sécurité sociale', value: formatNir(u.carteVitaleNir) || '' },
    { label: "Date d'émission carte vitale", value: u.carteVitaleIssueDate || '' },
  ]
}

// Labelled snapshot of the "Données cliniques" section. Labels match the seed
// ('Poids (kg)', 'IAH', …) and the patient-field labels used in the form.
export function clinicalSnapshot(u = {}) {
  return [
    { label: 'Poids (kg)', value: u.weight != null ? String(u.weight) : '' },
    { label: 'Taille (m)', value: u.height != null ? String(u.height) : '' },
    { label: 'IAH', value: u.iah != null ? String(u.iah) : '' },
    { label: "Latence d'endormissement", value: SLEEP_LATENCY_LABELS[u.sleepLatency] || '' },
  ]
}

export function diffSnapshots(before, after) {
  const changes = []
  after.forEach((field, i) => {
    const from = before[i]?.value ?? ''
    const to = field.value ?? ''
    if (String(from) !== String(to)) {
      changes.push({ label: field.label, from: from || '—', to: to || '—' })
    }
  })
  return changes
}

export function useProfileHistory() {
  const selfStore = useSelfStore()

  // Seed the history list the first time we touch it, so a first edit made from
  // anywhere (including the activity form, before the profile tab is ever
  // opened) still shows the prior entries.
  function ensureSeed() {
    const item = selfStore.item
    if (item && !item.history) item.history = PROFILE_HISTORY_SEED.map((e) => ({ ...e }))
  }

  function recordHistory(section, changes, author = 'Vous') {
    if (!changes.length) return
    ensureSeed()
    const entry = {
      id: `hist-${Date.now()}-${section}`,
      section,
      date: new Date().toISOString(),
      author,
      changes,
    }
    selfStore.item.history = [entry, ...(selfStore.item.history || [])]
  }

  // Diff a before-snapshot of the whole item against the current store item and
  // record any change under the matching section. Call after the item has been
  // updated, passing a shallow copy of the item taken beforehand.
  function recordProfileChanges(beforeItem, author = 'Vous') {
    recordHistory('general', diffSnapshots(generalSnapshot(beforeItem), generalSnapshot(selfStore.item)), author)
    recordHistory('clinical', diffSnapshots(clinicalSnapshot(beforeItem), clinicalSnapshot(selfStore.item)), author)
  }

  return { ensureSeed, recordHistory, recordProfileChanges }
}
