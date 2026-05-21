
import { useMessageType } from '@/composables/useMessageType'
import { defineStore } from 'pinia'
import { ref } from "vue"

const ACTIVE_TTL = 5500

export const useMessagesStore = defineStore('messages', () => {
  const queue = ref([])
  const activeIds = new Set()
  const { getTypeOption } = useMessageType()

  function add ({ type, text, id, ...rest }) {
    if (id && activeIds.has(id)) return
    const { color, icon } = getTypeOption(type)
    queue.value.push({ color, prependIcon: icon, text, id, ...rest })
    if (id) {
      activeIds.add(id)
      setTimeout(() => activeIds.delete(id), ACTIVE_TTL)
    }
  }

  return { queue, add }
})