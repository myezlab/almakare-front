import { computed, toValue } from "vue"

const PROFILE_FIELDS = [
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'birthName', label: 'Nom de naissance' },
  { key: 'gender', label: 'Genre' },
  { key: 'dob', label: 'Date de naissance' },
  { key: 'socialSecurityNumber', label: 'Numéro de sécurité sociale' },
  { key: 'postalAddress', label: 'Adresse' },
  { key: 'city', label: 'Ville' },
  { key: 'postalCode', label: 'Code postal' },
  { key: 'phoneNumber', label: 'Téléphone' },
  { key: 'dietaryRestrictions', label: 'Régime alimentaire' },
  { key: 'medicalHistory', label: 'Antécédents médicaux' },
  { key: 'currentTreatments', label: 'Traitements en cours' },
  { key: 'avatarUrl', label: 'Photo de profil' },
  { key: 'weight', label: 'Poids (kg)' },
  { key: 'height', label: 'Taille (m)' },
  { key: 'iah', label: 'IAH' },
]

const PROFILE_SECTIONS = [
  { label: 'Données personnelles', fields: ['agreementPersonal'] },
  { label: 'Données générales', fields: ['firstName', 'lastName', 'birthName', 'gender', 'dob', 'postalAddress', 'city', 'postalCode', 'phoneNumber', 'avatarUrl'] },
  { label: 'Données médicales', fields: ['socialSecurityNumber', 'dietaryRestrictions', 'medicalHistory', 'currentTreatments'] },
  { label: 'Données cliniques', fields: ['weight', 'height', 'iah'] },
]

function isFilled(saved, key) {
  if (['weight', 'height', 'iah'].includes(key)) return saved[key] != null && saved[key] !== ''
  return !!saved[key]
}

export function getCompletionPercent(saved) {
  if (!saved) return 0
  const total = PROFILE_FIELDS.length
  const filled = PROFILE_FIELDS.filter(f => isFilled(saved, f.key)).length
  return Math.round((filled / total) * 100)
}

export function useProfileCompletion(user) {
  const profileFields = computed(() => {
    const saved = toValue(user) || {}
    return PROFILE_FIELDS.map(f => ({
      filled: isFilled(saved, f.key),
      label: f.label,
    }))
  })

  const profileSections = computed(() => {
    const saved = toValue(user) || {}
    return PROFILE_SECTIONS.map(section => ({
      label: section.label,
      complete: section.fields.every(key => isFilled(saved, key)),
    }))
  })

  const completionCount = computed(() => profileFields.value.filter(f => f.filled).length)
  const completionTotal = computed(() => profileFields.value.length)
  const completionPercent = computed(() => Math.round((completionCount.value / completionTotal.value) * 100))

  return { profileFields, profileSections, completionCount, completionTotal, completionPercent }
}
