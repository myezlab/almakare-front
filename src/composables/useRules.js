import { useI18n } from 'vue-i18n'

export function useRules() {
  const { t } = useI18n()

  function emailValidation(email) {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email) ||
      t('AUTH_VALIDATION_EMAIL_FORMAT')
  }

  function passwordValidation(password) {
    // Password rules at least 8 characters (only)
    // eslint-disable-next-line prefer-regex-literals
    const regex = new RegExp('.{6,}')
    return !!password && regex.test(password) || t('AUTH_VALIDATION_MIN_6_CHARACTERS')
  }

  function passwordSymbols() {
    const symbols = ['!', '@', '#', '$', '%', '^', '&', '*']
    return symbols.join(', ')
  }

  function checkboxRequired(value) {
    return !!value || t('AUTH_VALIDATION_CHECKBOX_REQUIRED')
  }

  function required(value) {
    return !!value || t('AUTH_VALIDATION_FIELD_REQUIRED')
  }

  return { emailValidation, passwordValidation, passwordSymbols, checkboxRequired, required }
}

