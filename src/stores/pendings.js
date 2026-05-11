import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePendingsStore = defineStore('pendings', () => {

  const dialog = ref(false)
  const overlay = ref(true)

  return { dialog, overlay }
})