import languagesData from '@/enums/languages.json'
import { functions } from "@/firebase"
import { useMessagesStore } from '@/stores/messages'
import { httpsCallable } from "firebase/functions"
import { ref } from "vue"
import { useI18n } from "vue-i18n"

export function useLanguages() {
  const { t, locale } = useI18n()
  const messagesStore = useMessagesStore()
  const callSetLanguage = httpsCallable(functions, "languages-setLanguage")

  const loadingLanguage = ref(false)

  // Selected languages for a customer map
  const language = ref("")
  const allLanguages = languagesData

  // Update user's language preference
  async function updateUserLanguage(lang) {

    try {
      loadingLanguage.value = true

      await callSetLanguage({ language: lang })

      // Update the app locale
      locale.value = lang
      localStorage.setItem('locale', lang)
      messagesStore.add({ type: 'success', text: t('SETTINGS_LANGUAGE_UPDATED') })
    } catch (error) {
      console.error("Error updating user language:", error)
      messagesStore.add({ type: 'error', text: t('SETTINGS_LANGUAGE_ERROR') })
    } finally {
      loadingLanguage.value = false
    }
  }

  // Helper function to get the best matching language
  function getBestMatchingLanguage(userLang) {
    if (!userLang) return "fr-FR"

    // Direct match
    const directMatch = allLanguages.find(lang => lang.value === userLang)
    if (directMatch) return directMatch.value

    // Extract base language (e.g., "fr" from "fr-FR")
    const baseLang = userLang.split('-')[0].toLowerCase()

    // Find language that starts with the same base
    const baseMatch = allLanguages.find(lang => lang.value.toLowerCase().startsWith(baseLang))
    if (baseMatch) return baseMatch.value

    // Default fallback
    return "fr-FR"
  }

  return {
    // Data
    language,
    loadingLanguage,
    allLanguages,

    // Methods
    updateUserLanguage,
    getBestMatchingLanguage,
  }
}
