import THREAD_DATA from '@/data/thread.json'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // Seeded from the example thread; kept in memory for the MVP (sent messages and
  // read state reset on reload, which keeps thread.json the single source of truth).
  const messages = ref(THREAD_DATA.map((m) => ({ ...m })))

  const unreadCount = computed(
    () => messages.value.filter((m) => m.sender === 'partenaire' && !m.read).length,
  )

  function send(text) {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    messages.value.push({
      id: `msg-${Date.now()}`,
      sender: 'patient',
      authorName: 'Vous',
      avatarUrl: null,
      text: trimmed,
      createdAt: new Date().toISOString(),
      read: true,
    })
  }

  function markAllRead() {
    messages.value.forEach((m) => {
      if (m.sender === 'partenaire') m.read = true
    })
  }

  return { messages, unreadCount, send, markAllRead }
})
