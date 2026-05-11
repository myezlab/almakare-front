<script setup>
import { ISOToRelativeTime } from "@/composables/useDates.js"
import notificationsData from '@/data/notifications.json'
import { mdiAccount, mdiBell, mdiBellOutline, mdiChat, mdiCheckCircle, mdiCircle, mdiPen, mdiRefresh } from "@mdi/js"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"

const { t } = useI18n()
const router = useRouter()

const notifications = ref(notificationsData.map(n => ({
  ...n,
  createdAt: { toDate: () => new Date(n.createdAt) }
})))

const loading = ref(false)

const notificationTypeIcons = {
  newMessage: { icon: mdiChat, color: 'primary' },
  participationConfirmation: { icon: mdiCheckCircle, color: 'success' },
  contractSigned: { icon: mdiPen, color: 'warning' },
  default: { icon: mdiBell, color: 'grey' }
}

const notificationTypeTexts = {
  newMessage: 'NEW_MESSAGE',
  participationConfirmation: 'PARTICIPATION_CONFIRMED_SUCCESS',
  contractSigned: 'REPORT_SIGNED_SUCCESS'
}

function markAsRead(notification) {
  notification.read = true
}

function clickNotification(notification) {
  markAsRead(notification)
  if (notification.to) {
    router.push(notification.to)
  }
}

function getTitle(notification) {
  return notification.userFullName ? notification.userFullName : t('USER')
}
</script>

<template>
  <div :class="$vuetify.display.mobile ? 'pt-8' : 'pt-10'">
    <v-row justify="center">
      <v-col :cols="$vuetify.display.mobile ? 12 : 6">

        <v-row class="mb-4" align="center" :class="{ 'px-6': $vuetify.display.mobile }">
          <v-col align-self="center" class="text-headline-medium font-weight-bold">
            {{ $t('NOTIFICATIONS') }}
          </v-col>
          <v-col cols="auto">
            <v-btn icon variant="text" color="grey" :loading="loading" disabled>
              <v-icon :icon="mdiRefresh" />
            </v-btn>
          </v-col>
        </v-row>

        <!-- Skeleton loaders -->
        <v-row v-if="loading && notifications.length === 0" class="px-4">
          <v-skeleton-loader v-for="n in 5" :key="n" style="border: thin solid rgba(0, 0, 0, 0.03); width: 100%"
            class="mb-3 rounded-lg card-shadow" type="list-item-three-line"></v-skeleton-loader>
        </v-row>

        <!-- Notifications list -->

        <v-list v-if="notifications.length > 0" :class="{ 'rounded-15': !$vuetify.display.mobile }" lines="three"
          class="card-shadow  mb-16">
          <v-list-item v-for="(notification, index) in notifications" :key="notification.id" class="pa-0"
            @click="clickNotification(notification)">
            <v-card class="pa-4 cursor-pointer" flat>
              <v-row align="center" density="compact">
                <v-col cols="auto" class="pr-0">
                  <div style="position: relative; display: inline-block;">
                    <v-avatar size="50" :color="notification.userAvatarUrl ? undefined : 'grey-lighten-3'">
                      <v-img :src="notification.userAvatarUrl" cover>
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-icon :icon="mdiAccount" color="grey-lighten-1" size="32" />
                          </div>
                        </template>
                      </v-img>
                    </v-avatar>
                    <v-icon :icon="(notificationTypeIcons[notification.type] ?? notificationTypeIcons.default).icon"
                      color="white" size="26"
                      :class="[`bg-${(notificationTypeIcons[notification.type] ?? notificationTypeIcons.default).color}`]"
                      style="position: absolute; bottom: -4px; right: -4px; border-radius: 50%; padding: 5px;" />
                  </div>
                </v-col>
                <v-col class="pl-1 pr-1">
                  <div class="text-body-large font-weight-medium">{{ getTitle(notification) }}</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    {{ notification.text ? $t(notification.text) : $t(notificationTypeTexts[notification.type]) }}
                  </div>
                  <div v-if="notification.createdAt" class="text-label-small text-grey mt-2 first-letter-uppercase">
                    {{ ISOToRelativeTime(notification.createdAt.toDate()) }}
                    <template v-if="!notification.read">
                      <span class="mx-2">•</span>
                      <span class="text-primary cursor-pointer" @click.stop="markAsRead(notification)">
                        {{ $t('MARK_AS_READ') }}
                      </span>
                    </template>
                  </div>
                </v-col>
                <v-col cols="auto" v-if="!notification.read">
                  <v-icon color="primary" size="12" :icon="mdiCircle"></v-icon>
                </v-col>
              </v-row>
            </v-card>
            <v-divider class="mx-4" v-if="index < notifications.length - 1"></v-divider>
          </v-list-item>
        </v-list>

        <!-- Empty state -->
        <template v-if="!loading && notifications.length === 0">
          <v-row justify="center">
            <v-icon :icon="mdiBellOutline" size="64" class="my-6" style="opacity: 0.3" />
          </v-row>
          <v-row justify="center" class="mx-6 text-center" style="opacity: 0.3">
            {{ $t("EMPTY_NOTIFICATIONS") }}
          </v-row>
        </template>

      </v-col>
    </v-row>
  </div>
</template>