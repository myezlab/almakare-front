// Catalog of patient-data fields a doctor can request before a consultation.
//
// Each entry is consumed by FormGeneratorDialog (key/type/label/rules/…) and by
// ActivitesTab to decide what still needs filling. A consultation's
// `requestedItems` (in activities.json) references these by `key`; the dialog
// then shows only the requested fields that are not yet complete.
//
// Fields with a `complete(item)` predicate are the ones the patient must fill.
// Fields with a `parentKey` are conditional details that only appear alongside
// their parent (via `showIf`) and inherit the parent's completion state.
//
// Fields flagged `clinical: true` are persistent patient information (not tied
// to a single acte), so they are mirrored read-only in the "Données cliniques"
// panel of "Mon dossier" (see clinicalDisplayRows below) and tracked in the
// clinical modification history.

const G1 = 'Informations générales'
const G2 = 'Recueil des données et habitudes de vie'
const G3 = "Signes d'appels"

// Reusable validation rules for the recurring field shapes of this catalog.
const requiredRule = (v) => !!v || 'Ce champ est requis'
const requiredNumberRule = (v) => (v !== '' && v != null) || 'Ce champ est requis'
const answerRule = (v) => v != null || 'Veuillez répondre'
const preciseRule = (v) => !!v || 'Veuillez préciser ou répondre Non'
const rangeRule = (min, max) => (v) =>
  (v !== '' && v != null && Number(v) >= min && Number(v) <= max) || `Indiquez une valeur entre ${min} et ${max}`

const YES_NO_OPTIONS = [{ title: 'Oui', value: true }, { title: 'Non', value: false }]

// A "Si oui, précisez / sinon Non" pair: a Yes/No toggle plus a free-text
// precision shown only when the answer is Yes. `extra` lets a field override the
// parent (e.g. a custom displayLabel or a non-textarea child).
function yesNoPrecise({ key, label, displayLabel, group, detailLabel, clinical = true, child }) {
  const detailKey = `${key}Details`
  const parent = {
    key,
    type: 'options',
    label,
    displayLabel: displayLabel || label,
    group,
    options: YES_NO_OPTIONS,
    clinical,
    rules: [answerRule],
    complete: (item) => item[key] != null,
  }
  const detail = child || {
    key: detailKey,
    type: 'textarea',
    label: detailLabel || 'Précisez',
    group,
    parentKey: key,
    showIf: (m) => m[key] === true,
    rules: [preciseRule],
  }
  return [parent, detail]
}

const DRIVING_USAGE_OPTIONS = [
  { title: 'Transports publics', value: 'transportsPublics' },
  { title: 'Poids lourds', value: 'poidsLourds' },
  { title: 'Taxi', value: 'taxi' },
  { title: 'Ambulance', value: 'ambulance' },
  { title: 'Autre usage professionnel', value: 'autreUsagePro' },
  { title: 'Usage personnel', value: 'usagePersonnel' },
]

export const PATIENT_FIELDS = [
  {
    key: 'firstName',
    type: 'text',
    label: 'Prénom',
    group: 'Données générales',
    cols: 12,
    md: 6,
    rules: [(v) => !!v || 'Ce champ est requis'],
    complete: (item) => !!item.firstName
  },
  {
    key: 'lastName',
    type: 'text',
    label: 'Nom',
    group: 'Données générales',
    cols: 12,
    md: 6,
    rules: [(v) => !!v || 'Ce champ est requis'],
    complete: (item) => !!item.lastName
  },
  {
    key: 'carteVitaleNir',
    type: 'text',
    label: 'Numéro de sécurité sociale',
    group: 'Données générales',
    inputmode: 'numeric',
    hint: '15 chiffres sans espaces',
    persistentHint: true,
    rules: [
      (v) => !!v || 'Ce champ est requis',
      (v) => /^\d{15}$/.test((v || '').replace(/\D/g, '')) || 'Le numéro doit contenir 15 chiffres'
    ],
    complete: (item) => !!item.carteVitaleNir
  },
  {
    key: 'carteVitaleIssueDate',
    type: 'text',
    label: "Date d'émission carte vitale",
    group: 'Données générales',
    placeholder: 'JJ/MM/AAAA',
    cols: 12,
    md: 6,
    rules: [
      (v) => !!v || 'Ce champ est requis',
      (v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v) || 'Format attendu : JJ/MM/AAAA'
    ],
    complete: (item) => !!item.carteVitaleIssueDate
  },
  {
    key: 'weight',
    type: 'text',
    label: 'Poids (kg)',
    group: 'Données générales',
    number: true,
    inputmode: 'decimal',
    cols: 12,
    md: 6,
    rules: [(v) => (v !== '' && v != null) || 'Ce champ est requis'],
    complete: (item) => item.weight != null
  },
  {
    key: 'height',
    type: 'text',
    label: 'Taille (m)',
    group: 'Données générales',
    number: true,
    inputmode: 'decimal',
    cols: 12,
    md: 6,
    rules: [(v) => (v !== '' && v != null) || 'Ce champ est requis'],
    complete: (item) => item.height != null
  },
  {
    key: 'iah',
    type: 'text',
    label: 'IAH',
    displayLabel: 'IAH',
    group: 'Données cliniques',
    number: true,
    inputmode: 'decimal',
    cols: 12,
    md: 6,
    clinical: true,
    rules: [(v) => (v !== '' && v != null) || 'Ce champ est requis'],
    complete: (item) => item.iah != null
  },
  {
    key: 'sleepLatency',
    type: 'options',
    label: "Votre vitesse d'endormissement",
    displayLabel: "Latence d'endormissement",
    group: 'Données cliniques',
    options: [{ title: 'Rapide', value: 'rapide' }, { title: 'Lente', value: 'lente' }],
    clinical: true,
    rules: [(v) => v != null || 'Veuillez répondre'],
    complete: (item) => item.sleepLatency != null
  },
  {
    key: 'hasMedicalHistory',
    type: 'options',
    label: 'Avez-vous des antécédents médicaux ?',
    group: 'Données générales',
    options: [{ title: 'Oui', value: true }, { title: 'Non', value: false }],
    rules: [(v) => v != null || 'Veuillez répondre'],
    complete: (item) => item.hasMedicalHistory != null
  },
  {
    key: 'medicalHistory',
    type: 'textarea',
    label: 'Précisez vos antécédents',
    group: 'Données générales',
    parentKey: 'hasMedicalHistory',
    showIf: (m) => m.hasMedicalHistory === true,
    rules: [(v) => !!v || 'Veuillez préciser ou répondre Non']
  },
  {
    key: 'hasDietaryRestrictions',
    type: 'options',
    label: 'Suivez-vous un régime alimentaire ?',
    group: 'Données générales',
    options: [{ title: 'Oui', value: true }, { title: 'Non', value: false }],
    rules: [(v) => v != null || 'Veuillez répondre'],
    complete: (item) => item.hasDietaryRestrictions != null
  },
  {
    key: 'dietaryRestrictions',
    type: 'textarea',
    label: 'Précisez votre régime',
    group: 'Données générales',
    parentKey: 'hasDietaryRestrictions',
    showIf: (m) => m.hasDietaryRestrictions === true,
    rules: [(v) => !!v || 'Veuillez préciser votre régime']
  },

  // ===================================================================
  // Pré-questionnaire — Polygraphie ventilatoire nocturne
  // ===================================================================

  // ---- 1. Informations générales ------------------------------------
  {
    // Tied to this specific acte/consultation, so NOT a persistent clinical
    // field (not mirrored in the "Données cliniques" panel).
    key: 'consultationReason',
    type: 'text',
    label: 'Motif de la consultation',
    group: G1,
    rules: [requiredRule],
    complete: (item) => !!item.consultationReason,
  },
  ...yesNoPrecise({
    key: 'hasCurrentTreatments',
    label: 'Suivez-vous des traitements en cours ?',
    displayLabel: 'Traitements en cours',
    group: G1,
    detailLabel: 'Précisez vos traitements en cours',
  }),
  ...yesNoPrecise({
    key: 'hasFamilyHistory',
    label: 'Avez-vous des antécédents familiaux ?',
    displayLabel: 'Antécédents familiaux',
    group: G1,
    detailLabel: 'Précisez vos antécédents familiaux',
  }),
  {
    key: 'maritalStatus',
    type: 'options',
    label: 'Situation maritale',
    displayLabel: 'Situation maritale',
    group: G1,
    options: [{ title: 'En couple', value: 'enCouple' }, { title: 'Célibataire', value: 'celibataire' }],
    clinical: true,
    rules: [answerRule],
    complete: (item) => item.maritalStatus != null,
  },
  {
    key: 'numberOfChildren',
    type: 'text',
    label: "Nombre d'enfants",
    displayLabel: "Nombre d'enfants",
    group: G1,
    number: true,
    inputmode: 'numeric',
    cols: 12,
    md: 6,
    clinical: true,
    rules: [requiredNumberRule, rangeRule(0, 10)],
    complete: (item) => item.numberOfChildren != null,
  },
  {
    key: 'profession',
    type: 'text',
    label: 'Profession',
    displayLabel: 'Profession',
    group: G1,
    clinical: true,
    rules: [requiredRule],
    complete: (item) => !!item.profession,
  },
  ...yesNoPrecise({
    key: 'drivesVehicle',
    label: 'Conduisez-vous un véhicule ?',
    displayLabel: 'Conduite automobile',
    group: G1,
    child: {
      key: 'drivingUsages',
      type: 'multiselect',
      label: 'Type de conduite',
      group: G1,
      options: DRIVING_USAGE_OPTIONS,
      parentKey: 'drivesVehicle',
      showIf: (m) => m.drivesVehicle === true,
      rules: [(v) => (Array.isArray(v) && v.length > 0) || 'Veuillez sélectionner au moins une option'],
    },
  }),

  // ---- 2. Recueil des données et habitudes de vie -------------------
  ...yesNoPrecise({
    key: 'hasTobacco',
    label: 'Consommez-vous du tabac ?',
    displayLabel: 'Consommation de tabac',
    group: G2,
    detailLabel: 'Précisez votre consommation de tabac',
  }),
  ...yesNoPrecise({
    key: 'hasToxicAddictions',
    label: 'Avez-vous des addictions toxiques ?',
    displayLabel: 'Addictions toxiques',
    group: G2,
    detailLabel: 'Précisez vos addictions',
  }),
  ...yesNoPrecise({
    key: 'hasAllergies',
    label: 'Avez-vous des allergies ?',
    displayLabel: 'Allergies',
    group: G2,
    detailLabel: 'Précisez vos allergies',
  }),
  ...yesNoPrecise({
    key: 'hasPhysicalActivity',
    label: 'Pratiquez-vous une activité physique ?',
    displayLabel: 'Activité physique',
    group: G2,
    detailLabel: 'Précisez votre activité physique',
  }),
  ...yesNoPrecise({
    key: 'hasOccupationalExposure',
    label: 'Avez-vous une exposition professionnelle ?',
    displayLabel: 'Exposition professionnelle',
    group: G2,
    detailLabel: 'Précisez votre exposition professionnelle',
  }),
  ...yesNoPrecise({
    key: 'hasShiftWork',
    label: 'Travaillez-vous en horaire décalé ?',
    displayLabel: 'Travail en horaire décalé',
    group: G2,
    detailLabel: 'Précisez vos horaires',
  }),
  ...yesNoPrecise({
    key: 'hasEnergyDrinks',
    label: 'Consommez-vous des boissons énergisantes ?',
    displayLabel: 'Boissons énergisantes',
    group: G2,
    detailLabel: 'Précisez votre consommation',
  }),
  {
    key: 'bedtime',
    type: 'text',
    label: 'Heure de coucher',
    displayLabel: 'Heure de coucher',
    group: G2,
    cols: 12,
    md: 6,
    clinical: true,
    rules: [requiredRule],
    complete: (item) => !!item.bedtime,
  },
  {
    key: 'wakeTime',
    type: 'text',
    label: 'Heure de réveil',
    displayLabel: 'Heure de réveil',
    group: G2,
    cols: 12,
    md: 6,
    clinical: true,
    rules: [requiredRule],
    complete: (item) => !!item.wakeTime,
  },

  // ---- 3. Signes d'appels -------------------------------------------
  {
    key: 'nightAwakenings',
    type: 'text',
    label: "Nombre d'éveils durant la nuit",
    displayLabel: "Nombre d'éveils durant la nuit",
    group: G3,
    cols: 12,
    md: 6,
    clinical: true,
    rules: [requiredRule],
    complete: (item) => !!item.nightAwakenings,
  },
  {
    key: 'morningWakeTime',
    type: 'text',
    label: 'Temps nécessaire au réveil matinal (en minutes)',
    displayLabel: 'Temps de réveil matinal (min)',
    group: G3,
    number: true,
    inputmode: 'numeric',
    cols: 12,
    md: 6,
    clinical: true,
    rules: [requiredNumberRule, rangeRule(0, 60)],
    complete: (item) => item.morningWakeTime != null,
  },
  ...yesNoPrecise({
    key: 'hasMorningHeadaches',
    label: 'Avez-vous des maux de tête au réveil ?',
    displayLabel: 'Céphalées matinales',
    group: G3,
    detailLabel: 'Précisez',
  }),
  ...yesNoPrecise({
    key: 'hasDaytimeFatigue',
    label: 'Ressentez-vous une fatigue dans la journée ?',
    displayLabel: 'Fatigue diurne',
    group: G3,
    detailLabel: 'Précisez',
  }),
  ...yesNoPrecise({
    key: 'hasNocturia',
    label: 'Vous levez-vous la nuit pour uriner ?',
    displayLabel: 'Nycturie',
    group: G3,
    detailLabel: 'Précisez',
  }),
]

export const PATIENT_FIELDS_BY_KEY = PATIENT_FIELDS.reduce((acc, field) => {
  acc[field.key] = field
  return acc
}, {})

// The conditional detail field (if any) attached to a parent field.
function childOf(field) {
  return PATIENT_FIELDS.find((f) => f.parentKey === field.key) || null
}

function optionTitle(field, value) {
  const opt = (field?.options || []).find((o) => o.value === value)
  return opt ? opt.title : null
}

// Whether an `options` field is a Yes/No toggle (true/false values).
function isYesNo(field) {
  return field.type === 'options' && (field.options || []).some((o) => o.value === true)
}

// Human-readable value of a field for the read-only "Données cliniques" panel
// and the clinical modification history. Returns '' when unanswered so callers
// can diff/placeholder consistently.
export function formatPatientValue(field, item = {}) {
  const value = item[field.key]
  if (field.type === 'options') {
    if (isYesNo(field)) {
      if (value == null) return ''
      if (value === false) return 'Non'
      const child = childOf(field)
      if (child) {
        if (child.type === 'multiselect') {
          const list = item[child.key] || []
          return list.length ? list.map((v) => optionTitle(child, v) || v).join(', ') : 'Oui'
        }
        return item[child.key] || 'Oui'
      }
      return 'Oui'
    }
    return optionTitle(field, value) || ''
  }
  if (field.type === 'multiselect') {
    const list = value || []
    return list.length ? list.map((v) => optionTitle(field, v) || v).join(', ') : ''
  }
  if (value == null || value === '') return ''
  return String(value)
}

// Persistent clinical fields (the primary, non-conditional ones), in catalog
// order — the single source for both the "Données cliniques" panel display and
// the clinical history snapshot.
export const CLINICAL_FIELDS = PATIENT_FIELDS.filter((f) => f.clinical && f.complete)

// [{ label, value }] rows describing the patient's clinical data.
export function clinicalDisplayRows(item = {}) {
  return CLINICAL_FIELDS.map((field) => ({
    key: field.key,
    label: field.displayLabel || field.label,
    value: formatPatientValue(field, item),
  }))
}
