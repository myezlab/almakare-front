
import { useMessageType } from '@/composables/useMessageType'
import { defineStore } from 'pinia'
import { ref } from "vue"

export const useMessagesStore = defineStore('messages', () => {
  const queue = ref([])
  const { getTypeOption } = useMessageType()

  function add ({ type, text, ...rest }) {
    const { color, icon } = getTypeOption(type)
    queue.value.push({ color, prependIcon: icon, text, ...rest })
  }

  return { queue, add }
})