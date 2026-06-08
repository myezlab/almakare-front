<script setup>
import PrestataireDialog from "@/components/PrestataireDialog.vue"
import { ISOToTimeOrDay } from "@/composables/useDates"
import PRESTATAIRE from "@/data/prestataire.json"
import { useChatStore } from "@/stores/chat"
import { useSelfStore } from "@/stores/self"
import { mdiAccountOutline, mdiSend } from "@mdi/js"
import { computed, nextTick, onMounted, ref } from "vue"

defineProps({
  // When true the chat fills the screen under the app bar (mobile): the header
  // sits right under the toolbar and the composer is pinned to the bottom.
  fullscreen: { type: Boolean, default: false },
})

const selfStore = useSelfStore()
const chatStore = useChatStore()

const currentUser = computed(() => selfStore.item || {})

// The chat is with the patient's "prestataire santé": the home-care provider who
// makes sure the patient uses their breathing device (PPC) correctly.
const prestataire = {
  name: [PRESTATAIRE.firstName, PRESTATAIRE.lastName].filter(Boolean).join(' ').trim(),
  subtitle: [PRESTATAIRE.company, PRESTATAIRE.role].filter(Boolean).join(' · '),
  avatarUrl: PRESTATAIRE.avatarUrl,
}

// Opens the prestataire details dialog when the chat header is tapped.
const prestataireDialogOpen = ref(false)

const patientInitials = computed(() => {
  const u = currentUser.value || {}
  const initials = `${(u.firstName || '').charAt(0)}${(u.lastName || '').charAt(0)}`.trim()
  return initials.toUpperCase()
})

const messages = computed(() => chatStore.messages)
const draft = ref('')
const messagesEnd = ref(null)

function scrollToBottom() {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ block: 'end' })
  })
}

function send() {
  if (!draft.value.trim()) return
  chatStore.send(draft.value)
  draft.value = ''
  scrollToBottom()
}

onMounted(() => {
  chatStore.markAllRead()
  scrollToBottom()
})
</script>

<template>
  <div class="chat-card d-flex flex-column"
    :class="fullscreen ? 'chat-card--fullscreen' : 'chat-card--boxed card-shadow rounded-15'">

    <!-- =================== HEADER =================== -->
    <div class="chat-header d-flex align-center ga-3 pa-3 cursor-pointer" role="button" tabindex="0"
      @click="prestataireDialogOpen = true" @keydown.enter="prestataireDialogOpen = true">
      <v-avatar size="44">
        <v-img :src="prestataire.avatarUrl" :alt="prestataire.name" cover />
      </v-avatar>
      <div class="min-w-0">
        <div class="text-title-small font-weight-bold text-truncate">{{ prestataire.name }}</div>
        <div class="text-body-small text-medium-emphasis text-truncate">{{ prestataire.subtitle }}</div>
      </div>
    </div>
    <v-divider />

    <PrestataireDialog v-model="prestataireDialogOpen" :prestataire="PRESTATAIRE" :name="prestataire.name" />

    <!-- =================== MESSAGES =================== -->
    <div class="chat-messages flex-grow-1 pa-4">
      <div v-for="m in messages" :key="m.id" class="msg-row"
        :class="m.sender === 'patient' ? 'msg-row--me' : 'msg-row--them'">
        <v-avatar v-if="m.sender !== 'patient'" size="32" class="msg-avatar">
          <v-img :src="m.avatarUrl" :alt="m.authorName" cover />
        </v-avatar>
        <v-avatar v-else size="32" color="primary" class="msg-avatar">
          <span v-if="patientInitials" class="text-caption font-weight-bold">{{ patientInitials }}</span>
          <v-icon v-else :icon="mdiAccountOutline" size="20" />
        </v-avatar>
        <div class="msg-bubble" :class="m.sender === 'patient' ? 'msg-bubble--me' : 'msg-bubble--them'">
          <div class="text-body-medium msg-text">{{ m.text }}</div>
          <div class="msg-time">{{ ISOToTimeOrDay(m.createdAt) }}</div>
        </div>
      </div>
      <div ref="messagesEnd" />
    </div>

    <!-- =================== COMPOSER =================== -->
    <v-divider />
    <div class="chat-composer d-flex align-center ga-2 pa-3" :class="{ 'chat-composer--safe': fullscreen }">
      <v-text-field v-model="draft" class="flex-grow-1" placeholder="Écrivez votre message…" variant="solo" flat
        rounded="lg" density="comfortable" hide-details bg-color="grey-lighten-4" @keydown.enter.prevent="send" />
      <v-btn :icon="mdiSend" color="primary" variant="flat" rounded="lg" :disabled="!draft.trim()"
        aria-label="Envoyer" @click="send" />
    </div>
  </div>
</template>

<style scoped>
.chat-card {
  background: #fff;
  overflow: hidden;
}

.chat-card--boxed {
  height: calc(100vh - 280px);
  min-height: 420px;
}

/* Mobile: fill the viewport under the sticky app bar (comfortable toolbar = 56px). */
.chat-card--fullscreen {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0;
  z-index: 4;
}

.chat-header {
  flex: 0 0 auto;
}

.chat-messages {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 80%;
}

.msg-row--them {
  align-self: flex-start;
}

.msg-row--me {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  flex: 0 0 auto;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  min-width: 0;
}

.msg-bubble--them {
  background: rgba(0, 0, 0, 0.04);
  border-bottom-left-radius: 4px;
}

.msg-bubble--me {
  background: rgba(var(--v-theme-primary), 0.12);
  border-bottom-right-radius: 4px;
}

.msg-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
  text-align: right;
}

.chat-composer {
  flex: 0 0 auto;
}

/* Keep the composer clear of the iOS home indicator when full-screen. */
.chat-composer--safe {
  padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
}

.min-w-0 {
  min-width: 0;
}
</style>
