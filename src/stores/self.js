import { defineStore } from 'pinia'
import { ref } from "vue"

export const useSelfStore = defineStore('self', () => {

  const item = ref({language: 'fr-FR'})

  async function init() {
   
  }

  async function getItem(selfId) {

  }

  return { item, getItem, init }
})
