import { createPinia } from 'pinia'
import router from '../router'
import vuetify from './vuetify'
import VueApexCharts from 'vue3-apexcharts'

export function registerPlugins(app) {
  app.use(vuetify)
    .use(createPinia())
    .use(router)
    .use(VueApexCharts)
}
