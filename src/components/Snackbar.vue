<script setup>
import { useMessagesStore } from '@/stores/messages'
import { mdiClose } from '@mdi/js'

const messagesStore = useMessagesStore()
</script>

<template>
  <v-snackbar-queue :total-visible="5" closable v-model="messagesStore.queue"
    :location="$vuetify.display.xs ? 'top' : 'top right'">
    <template #default="{ item }">
      <v-icon v-if="item.prependIcon" :icon="item.prependIcon" class="mr-2" />
      {{ item.text }}
    </template>
    <template #actions="{ item, props }">
      <v-btn v-if="item.to" :to="item.to" variant="text" size="small" class="text-none" @click="props.onClick">
        {{ $t('VIEW') }}
      </v-btn>
      <v-btn :icon="mdiClose" variant="text" size="small" @click="props.onClick" />
    </template>
  </v-snackbar-queue>
</template>