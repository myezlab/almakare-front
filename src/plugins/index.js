import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import fr from '../lang/fr-FR.json'
import router from '../router'
import vuetify from './vuetify'

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: localStorage.getItem('locale') || 'fr-FR',
  fallbackLocale: 'fr-FR',
  messages: {
    'fr-FR': fr,
    'en': fr,
    'en-US': fr,
    'en-GB': fr,
  },
  strictMessage: false,
})

export function registerPlugins(app) {
  app.use(i18n)
    .use(vuetify)
    .use(createPinia())
    .use(router)
}
