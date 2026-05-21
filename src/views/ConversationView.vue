<script setup>
import { ISOToDateAndTime } from "@/composables/useDates.js"
import { useReadState } from "@/composables/useReadState.js"
import messagesData from "@/data/messages.json"
import { mdiAccount, mdiArrowLeft, mdiSend } from "@mdi/js"
import dayjs from "dayjs"
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()
const { markThreadRead } = useReadState()

const thread = ref(null)
const messages = ref([])
const draft = ref("")
const messagesContainer = ref(null)

const threadId = computed(() => route.params.threadId)

function loadThread() {
  const found = messagesData.find(t => t.id === threadId.value)
  if (!found) {
    router.replace({ name: "Messages" })
    return
  }
  thread.value = { ...found, unreadCount: 0 }
  messages.value = [...found.messages]
  markThreadRead(found.id)
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function sendMessage() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({
    id: `m-local-${Date.now()}`,
    from: "patient",
    text,
    createdAt: new Date().toISOString(),
  })
  draft.value = ""
  scrollToBottom()
}

function goBack() {
  router.push({ name: "Messages" })
}

function isNewDay(index) {
  if (index === 0) return true
  const prev = dayjs(messages.value[index - 1].createdAt)
  const curr = dayjs(messages.value[index].createdAt)
  return !prev.isSame(curr, "day")
}

onMounted(() => {
  loadThread()
  scrollToBottom()
})

watch(threadId, () => {
  loadThread()
  scrollToBottom()
})
</script>

<template>
  <div v-if="thread" class="conversation-page" :class="{ 'is-desktop': !$vuetify.display.mobile }">

    <!-- Header -->
    <div class="conversation-header">
      <v-row align="center" no-gutters class="px-2 py-2">
        <v-col cols="auto">
          <v-btn :icon="mdiArrowLeft" variant="text" @click="goBack" aria-label="Retour" />
        </v-col>
        <v-col cols="auto" class="pr-3">
          <v-avatar size="42" :color="thread.participantAvatarUrl ? undefined : 'grey-lighten-3'">
            <v-img :src="thread.participantAvatarUrl" cover>
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-icon :icon="mdiAccount" color="grey-lighten-1" size="26" />
                </div>
              </template>
            </v-img>
          </v-avatar>
        </v-col>
        <v-col>
          <div class="text-body-large font-weight-medium">{{ thread.participantFullName }}</div>
          <div class="text-label-small text-medium-emphasis">{{ thread.participantRole }}</div>
        </v-col>
      </v-row>
      <v-divider v-if="$vuetify.display.mobile" />
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="conversation-messages">
      <div class="messages-inner">
        <template v-for="(message, index) in messages" :key="message.id">
          <div v-if="isNewDay(index)" class="text-center my-4">
            <span class="text-label-small text-medium-emphasis first-letter-uppercase">
              {{ ISOToDateAndTime(message.createdAt) }}
            </span>
          </div>
          <div class="d-flex mb-2" :class="message.from === 'patient' ? 'justify-end' : 'justify-start'">
            <div class="message-bubble" :class="message.from === 'patient' ? 'bubble-patient' : 'bubble-other'">
              <div class="text-body-medium" style="white-space: pre-wrap;">{{ message.text }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Composer -->
    <div class="conversation-composer">
      <v-row align="center" no-gutters class="px-3 py-2">
        <v-col>
          <v-textarea v-model="draft" placeholder="Écrivez votre message..." variant="outlined" hide-details
            auto-grow rows="1" max-rows="5" density="comfortable" rounded="xl"
            @keydown.enter.exact.prevent="sendMessage" />
        </v-col>
        <v-col cols="auto" class="pl-2">
          <v-btn :icon="mdiSend" color="primary" variant="flat" :disabled="!draft.trim()" @click="sendMessage"
            aria-label="Envoyer" />
        </v-col>
      </v-row>
    </div>

  </div>
</template>

<style scoped>
.conversation-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.conversation-header {
  flex: 0 0 auto;
  background: white;
  position: sticky;
  top: 0;
  z-index: 2;
}

.conversation-messages {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
}

.messages-inner {
  display: flex;
  flex-direction: column;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  word-wrap: break-word;
}

.bubble-patient {
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background-color: rgb(var(--v-theme-surface-variant, 240, 240, 240));
  background: #f1f1f3;
  color: rgba(0, 0, 0, 0.87);
  border-bottom-left-radius: 4px;
}

.conversation-composer {
  flex: 0 0 auto;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  padding-bottom: env(safe-area-inset-bottom);
}

.conversation-page.is-desktop .conversation-header {
  background: transparent;
}

.conversation-page.is-desktop .conversation-composer {
  background: transparent;
  border-top: 0;
}

.conversation-composer :deep(.v-field) {
  background: white;
}
</style>
