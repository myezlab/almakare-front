<script setup>
import { ISOToDateAndTime } from '@/composables/useDates'
import { formatLogField, formatLogTitle, formatLogValue } from '@/data/logs'
import { useLogsStore } from '@/stores/logs'
import { useSelfStore } from '@/stores/self'
import { useTeamStore } from '@/stores/team'
import {
  mdiAccount,
  mdiAlertOutline,
  mdiArrowRight,
  mdiCheckCircleOutline,
  mdiCircleSmall,
  mdiClose,
  mdiCloseCircleOutline,
  mdiHistory,
  mdiInformationOutline,
  mdiStarOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  collectionName: { type: String, required: true },
  title: { type: String, required: true },
})

const logsStore = useLogsStore()
const teamStore = useTeamStore()
const selfStore = useSelfStore()

const typeConfig = {
  info: { color: 'info', icon: mdiInformationOutline },
  warning: { color: 'warning', icon: mdiAlertOutline },
  error: { color: 'error', icon: mdiCloseCircleOutline },
  success: { color: 'success', icon: mdiCheckCircleOutline },
  accent: { color: 'accent', icon: mdiStarOutline },
}

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.info
}

const dialog = ref(false)

const logs = computed(() => logsStore.getLogs(props.collectionName))

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  return ISOToDateAndTime(timestamp)
}

const userDialog = ref(false)
const selectedUser = ref(null)

function resolveUser(userId) {
  if (!userId) return null
  if (selfStore.item?.id === userId) return selfStore.item
  return teamStore.items.find((m) => m.id === userId) || null
}

function viewUser(userId) {
  selectedUser.value = resolveUser(userId)
  userDialog.value = true
}

function userFullName(user) {
  if (!user) return ''
  if (user.fullName) return user.fullName
  const parts = [user.firstName, user.lastName].filter(Boolean)
  return parts.join(' ') || user.email || ''
}

watch(dialog, (val) => {
  if (!val) selectedUser.value = null
})
</script>

<template>
  <v-btn icon flat size="small" @click="dialog = true" color="transparent">
    <v-icon size="18" color="tertiary" :icon="mdiHistory" />
    <v-tooltip activator="parent" location="top">Historique</v-tooltip>
  </v-btn>

  <v-dialog v-model="dialog" max-width="800" scrollable min-height="650">
    <v-card class="rounded-15 card-shadow">
      <v-card-title class="d-flex align-center justify-space-between px-6 pt-5 pb-2">
        <span class="text-headline-small font-weight-bold text-truncate mr-2">{{ title }}</span>
        <v-btn icon flat size="small" class="flex-shrink-0" @click="dialog = false">
          <v-icon :icon="mdiClose" />
        </v-btn>
      </v-card-title>

      <v-card-text class="px-0" style="max-height: 60vh">
        <v-list v-if="logs.length > 0" lines="two" class="px-2">
          <template v-for="log in logs" :key="log.id">
            <v-list-item>
              <v-list-item-title class="text-body-medium mb-1 d-flex align-center">
                <v-icon :icon="getTypeConfig(log.type).icon" size="16" start :color="getTypeConfig(log.type).color" />
                {{ formatLogTitle(log) }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-small text-medium-emphasis">
                <span v-if="log.adminId" @click="viewUser(log.adminId)"
                  class="text-decoration-underline mr-1 cursor-pointer">
                  {{ log.adminFullName || 'Utilisateur' }}
                </span>
                <span>{{ formatTimestamp(log.createdAt) }}</span>
              </v-list-item-subtitle>
            </v-list-item>

            <div v-if="log.changes && log.changes.length" class="px-6 pb-3">
              <div v-for="(change, i) in log.changes" :key="i"
                class="text-body-small text-medium-emphasis d-flex align-center ga-1 py-1">
                <v-icon :icon="mdiCircleSmall" size="16" />
                <span class="font-weight-medium">{{ formatLogField(change.field) }}</span>
                <template v-if="change.from && change.to">
                  <span class="text-error text-decoration-line-through">{{ formatLogValue(change.field, change.from)
                    }}</span>
                  <v-icon :icon="mdiArrowRight" size="12" />
                  <span class="text-success">{{ formatLogValue(change.field, change.to) }}</span>
                </template>
                <template v-else-if="change.to">
                  <span class="text-success">{{ formatLogValue(change.field, change.to) }}</span>
                </template>
                <template v-else-if="change.from">
                  <span class="text-error text-decoration-line-through">{{ formatLogValue(change.field, change.from)
                    }}</span>
                </template>
              </div>
            </div>
          </template>
        </v-list>

        <v-row v-if="logs.length === 0" justify="center" class="pa-8">
          <span class="text-medium-emphasis">Aucun historique pour le moment.</span>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="userDialog" max-width="380">
    <v-card class="pa-6 card-shadow rounded-15">
      <v-btn style="position: absolute; right: 0; top: 0; z-index: 1" :icon="mdiClose" size="small" class="ma-2" flat
        @click="userDialog = false" />

      <template v-if="selectedUser">
        <v-row justify="center" class="mb-4">
          <v-avatar size="64">
            <v-img :src="selectedUser.avatarUrl" cover>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-lighten-2 rounded-circle">
                  <v-icon :icon="mdiAccount" color="white" size="32" />
                </div>
              </template>
            </v-img>
          </v-avatar>
        </v-row>

        <div class="text-center mb-4">
          <div class="text-headline-small font-weight-medium">{{ userFullName(selectedUser) || 'N/A' }}</div>
          <div class="text-body-medium text-medium-emphasis">{{ selectedUser.email || 'N/A' }}</div>
        </div>

        <v-divider class="mb-4" />

        <v-row class="text-body-small text-medium-emphasis mb-2" align="center">
          <v-col>ID</v-col>
          <v-col cols="auto" class="font-weight-medium text-body-medium">{{ selectedUser.id }}</v-col>
        </v-row>
      </template>

      <div v-else class="text-center text-medium-emphasis py-4">
        Utilisateur introuvable
      </div>
    </v-card>
  </v-dialog>
</template>
