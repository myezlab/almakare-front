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
    group: 'Données cliniques',
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
    group: 'Données cliniques',
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
    group: 'Données cliniques',
    number: true,
    inputmode: 'decimal',
    cols: 12,
    md: 6,
    rules: [(v) => (v !== '' && v != null) || 'Ce champ est requis'],
    complete: (item) => item.iah != null
  },
  {
    key: 'sleepLatency',
    type: 'options',
    label: "Votre vitesse d'endormissement",
    group: 'Données cliniques',
    options: [{ title: 'Rapide', value: 'rapide' }, { title: 'Lente', value: 'lente' }],
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
  }
]

export const PATIENT_FIELDS_BY_KEY = PATIENT_FIELDS.reduce((acc, field) => {
  acc[field.key] = field
  return acc
}, {})
