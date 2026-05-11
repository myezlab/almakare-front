/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import { aliases, mdi } from 'vuetify/lib/iconsets/mdi-svg'
import { fr } from 'vuetify/locale'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VMaskInput } from 'vuetify/labs/VMaskInput'
import { VTimePicker } from 'vuetify/components/VTimePicker'


// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VDateInput,
    VMaskInput,
    VTimePicker,
  },
  locale: {
    locale: 'fr',
    fallback: 'fr',
    messages: { fr }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#58AD32',
          secondary: '#7B93BB',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#d4a108',
        },
      }
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases
    },
    sets: {
      mdi,
    },
  }
})
