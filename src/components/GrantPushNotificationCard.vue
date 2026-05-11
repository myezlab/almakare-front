<script setup>
import { usePushNotifications } from "@/composables/usePushNotifications"
import { mdiBellOffOutline, mdiBellOutline } from "@mdi/js"

const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe, checkSubscription } = usePushNotifications()

checkSubscription()

defineExpose({ isSupported, isSubscribed })
</script>

<template>
  <v-card v-if="isSupported" class="pa-4 card-shadow rounded-15" color="white">
    <v-row align="center">
      <v-col>
        <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
          {{ $t('PUSH_NOTIFICATIONS') }}
        </div>
        <div class="text-body-medium text-medium-emphasis mb-3">
          {{ isSubscribed ? $t('PUSH_NOTIFICATIONS_ENABLED') : $t('PUSH_NOTIFICATIONS_PROMPT') }}
        </div>
        <v-btn v-if="!isSubscribed" :prepend-icon="mdiBellOutline" variant="tonal" color="primary" rounded="lg"
          class="text-none" :loading="loading" @click="subscribe()">
          {{ $t('PUSH_NOTIFICATIONS_ENABLE') }}
        </v-btn>
        <v-btn v-else :prepend-icon="mdiBellOffOutline" variant="tonal" color="medium-emphasis" rounded="lg"
          class="text-none" :loading="loading" @click="unsubscribe()">
          {{ $t('PUSH_NOTIFICATIONS_DISABLE') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-img src="@/assets/illustrations/notification.svg" width="100" height="80" contain
          transition="fade-transition">
          <template #error>
            <v-icon size="60" color="primary" :icon="mdiBellOutline" />
          </template>
        </v-img>
      </v-col>
    </v-row>
  </v-card>
</template>
