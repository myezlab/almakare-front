
import { defineStore } from 'pinia'
import { ref } from "vue"

export const useParamsStore = defineStore('params', () => {

  const beforeinstallprompt = ref(null)
  return { beforeinstallprompt }
})

