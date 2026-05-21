<script setup>
import { ISOToRelativeTime } from "@/composables/useDates.js"
import { useReadState } from "@/composables/useReadState.js"
import messagesData from "@/data/messages.json"
import { mdiAccount, mdiChatProcessingOutline } from "@mdi/js"
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const { isThreadRead, markThreadRead } = useReadState()

const threads = ref(messagesData.map(t => ({
  ...t,
  lastMessageAtDate: new Date(t.lastMessageAt),
})))

function threadUnreadCount(thread) {
  if (isThreadRead(thread)) return 0
  return thread.unreadCount || 0
}

function openThread(thread) {
  markThreadRead(thread.id)
  router.push({ name: "Conversation", params: { threadId: thread.id } })
}
</script>

<template>
  <v-row justify="center" class="mb-16 pb-10 pt-6">
    <v-col :cols="$vuetify.display.mobile ? 12 : 9">

      <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
        <v-col align-self="center">
          <div class="text-headline-medium font-weight-bold">
            Messages
          </div>
          <div class="text-body-medium text-medium-emphasis mt-1">
            <v-icon :icon="mdiChatProcessingOutline" size="18" class="mr-1" />
            Échangez avec votre équipe soignante
          </div>
        </v-col>
      </v-row>

      <v-list :class="{ 'rounded-15': !$vuetify.display.mobile }" lines="two" class="card-shadow">
        <template v-for="(thread, index) in threads" :key="thread.id">
          <v-list-item class="pa-0" @click="openThread(thread)">
            <v-card class="pa-4 cursor-pointer" flat>
              <v-row align="center" density="compact">
                <v-col cols="auto" class="pr-0">
                  <v-avatar size="50" :color="thread.participantAvatarUrl ? undefined : 'grey-lighten-3'">
                    <v-img :src="thread.participantAvatarUrl" cover>
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-icon :icon="mdiAccount" color="grey-lighten-1" size="32" />
                        </div>
                      </template>
                    </v-img>
                  </v-avatar>
                </v-col>
                <v-col class="pl-3 pr-1">
                  <div class="d-flex align-center justify-space-between">
                    <div class="text-body-large font-weight-medium">{{ thread.participantFullName }}</div>
                    <div class="text-label-small text-grey first-letter-uppercase">
                      {{ ISOToRelativeTime(thread.lastMessageAtDate) }}
                    </div>
                  </div>
                  <div class="text-label-small text-medium-emphasis">{{ thread.participantRole }}</div>
                  <div class="text-body-small mt-1"
                    :class="threadUnreadCount(thread) > 0 ? 'font-weight-medium' : 'text-medium-emphasis'">
                    {{ thread.lastMessageText }}
                  </div>
                </v-col>
                <v-col cols="auto" v-if="threadUnreadCount(thread) > 0">
                  <v-badge :content="threadUnreadCount(thread)" color="error" inline />
                </v-col>
              </v-row>
            </v-card>
            <v-divider class="mx-4" v-if="index < threads.length - 1" />
          </v-list-item>
        </template>
      </v-list>

    </v-col>
  </v-row>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>
