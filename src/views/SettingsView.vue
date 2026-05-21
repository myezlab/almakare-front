<script setup>
import { useSelfStore } from "@/stores/self"
import {
  mdiBellOutline,
  mdiCalendarCheckOutline,
  mdiClipboardListOutline,
  mdiCogOutline,
  mdiEmailOutline,
  mdiFileDocumentOutline,
  mdiMessageOutline,
} from "@mdi/js"
import { computed } from "vue"

const selfStore = useSelfStore()

const EMAIL_NOTIFICATION_TYPES = [
  {
    key: 'newMessage',
    label: 'Nouveaux messages',
    description: 'Recevez un email lorsqu’un professionnel vous envoie un message',
    icon: mdiMessageOutline,
  },
  {
    key: 'appointmentConfirmed',
    label: 'Confirmations de rendez-vous',
    description: 'Recevez un email lorsque votre rendez-vous est confirmé',
    icon: mdiCalendarCheckOutline,
  },
  {
    key: 'appointmentReminder',
    label: 'Rappels de rendez-vous',
    description: 'Recevez un email avant chaque rendez-vous',
    icon: mdiBellOutline,
  },
  {
    key: 'documentSigned',
    label: 'Documents à signer',
    description: 'Recevez un email lorsqu’un document attend votre signature',
    icon: mdiFileDocumentOutline,
  },
  {
    key: 'questionnaireAvailable',
    label: 'Nouveaux questionnaires',
    description: 'Recevez un email lorsqu’un questionnaire vous est attribué',
    icon: mdiClipboardListOutline,
  },
]

const emailNotifications = computed({
  get() {
    return selfStore.item.emailNotifications || {}
  },
  set(val) {
    selfStore.item = { ...selfStore.item, emailNotifications: val }
  },
})

function isEnabled(key) {
  const val = emailNotifications.value[key]
  return val === undefined ? true : !!val
}

function setEnabled(key, value) {
  emailNotifications.value = { ...emailNotifications.value, [key]: value }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Paramètres</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiCogOutline" size="18" class="mr-1" />
              Gérez vos préférences de notification
            </div>
          </v-col>
        </v-row>

        <!-- =================== EMAIL NOTIFICATIONS =================== -->
        <v-card class="card-shadow pa-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-4">
            <v-icon :icon="mdiEmailOutline" size="22" class="mr-2 text-primary" />
            <div class="text-title-medium font-weight-bold">Notifications par email</div>
          </div>

          <v-list class="pa-0" bg-color="transparent">
            <template v-for="(t, index) in EMAIL_NOTIFICATION_TYPES" :key="t.key">
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon :icon="t.icon" class="mr-3 text-medium-emphasis" />
                </template>
                <v-list-item-title class="font-weight-medium">{{ t.label }}</v-list-item-title>
                <v-list-item-subtitle class="text-medium-emphasis" style="opacity: 1;">
                  {{ t.description }}
                </v-list-item-subtitle>
                <template #append>
                  <v-switch :model-value="isEnabled(t.key)" @update:model-value="setEnabled(t.key, $event)"
                    color="primary" hide-details density="compact" inset />
                </template>
              </v-list-item>
              <v-divider v-if="index < EMAIL_NOTIFICATION_TYPES.length - 1" />
            </template>
          </v-list>
        </v-card>

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>
