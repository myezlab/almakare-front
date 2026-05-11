import { defineStore } from 'pinia'
import { ref } from "vue"

export const useSelfStore = defineStore('self', () => {

  const item = ref({id: "123456"})

  async function init() {
   
  }

  async function getItem(selfId) {

  }

  return { item, getItem, init }
})
