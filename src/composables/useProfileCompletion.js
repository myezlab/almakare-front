import { computed, toValue } from "vue"
import { useI18n } from "vue-i18n"

const PROFILE_FIELD_KEYS = [
  'firstName', 'lastName', 'birthName', 'gender', 'dob', 'socialSecurityNumber',
  'postalAddress', 'city', 'postalCode', 'phoneNumber',
  'dietaryRestrictions', 'medicalHistory', 'currentTreatments',
  'avatarUrl', 'weight', 'height', 'iah',
]

const PROFILE_LABEL_KEYS = [
  'FIRST_NAME', 'LAST_NAME', 'BIRTH_NAME', 'GENDER', 'DATE_OF_BIRTH', 'SOCIAL_SECURITY_NUMBER',
  'POSTAL_ADDRESS', 'CITY', 'POSTAL_CODE', 'PHONE_NUMBER',
  'DIETARY_RESTRICTIONS', 'MEDICAL_HISTORY', 'CURRENT_TREATMENTS',
  'PHOTO_AVATAR', 'WEIGHT', 'HEIGHT', 'IAH',
]

const PROFILE_SECTIONS = [
  { labelKey: 'SECTION_PERSONAL_DATA_AUTHORIZATION', fields: ['agreementPersonal'] },
  { labelKey: 'SECTION_GENERAL', fields: ['firstName', 'lastName', 'birthName', 'gender', 'dob', 'postalAddress', 'city', 'postalCode', 'phoneNumber', 'avatarUrl'] },
  { labelKey: 'SECTION_MEDICAL', fields: ['socialSecurityNumber', 'dietaryRestrictions', 'medicalHistory', 'currentTreatments'] },
  { labelKey: 'SECTION_CLINICAL', fields: ['weight', 'height', 'iah'] },
]

function isFilled(saved, key) {
  if (['weight', 'height', 'iah'].includes(key)) return saved[key] != null && saved[key] !== ''
  return !!saved[key]
}

export function getCompletionPercent(saved) {
  if (!saved) return 0
  const total = PROFILE_FIELD_KEYS.length
  const filled = PROFILE_FIELD_KEYS.filter(k => isFilled(saved, k)).length
  return Math.round((filled / total) * 100)
}

export function useProfileCompletion(user) {
  const { t } = useI18n()

  const profileFields = computed(() => {
    const saved = toValue(user) || {}
    return PROFILE_FIELD_KEYS.map((key, i) => ({
      filled: isFilled(saved, key),
      label: t(PROFILE_LABEL_KEYS[i]),
    }))
  })

  const profileSections = computed(() => {
    const saved = toValue(user) || {}
    return PROFILE_SECTIONS.map(section => ({
      label: t(section.labelKey),
      complete: section.fields.every(key => isFilled(saved, key)),
    }))
  })

  const completionCount = computed(() => profileFields.value.filter(f => f.filled).length)
  const completionTotal = computed(() => profileFields.value.length)
  const completionPercent = computed(() => Math.round((completionCount.value / completionTotal.value) * 100))

  return { profileFields, profileSections, completionCount, completionTotal, completionPercent }
}
