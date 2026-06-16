<script setup>
import logoInitials from '@/assets/img/logo-initials-white.svg'
import { useRules } from '@/composables/useRules'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import { mdiAccountOutline, mdiArrowLeft, mdiClose, mdiHelpCircleOutline, mdiLogout } from '@mdi/js'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// On Mon dossier (mobile), an open tab turns the logo into a back arrow that returns to the hub.
const showBack = computed(() => route.name === 'MonDossier' && !!route.query.tab)

function goBack() {
  const query = { ...route.query }
  delete query.tab
  router.replace({ query })
}
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { emailValidation, required } = useRules()

const supportDialog = ref(false)
const supportFormRef = ref(null)
const supportSubmitting = ref(false)
const supportForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
})

function openSupportDialog() {
  supportForm.value = {
    firstName: selfStore.item?.firstName || '',
    lastName: selfStore.item?.lastName || '',
    email: selfStore.item?.email || '',
    subject: '',
    message: '',
  }
  supportDialog.value = true
}

function goToAccount() {
  router.push({ name: 'MonCompte' })
}

function goToDashboard() {
  router.push({ name: 'Dashboard' })
}

function logout() {
  selfStore.reset()
  router.push({ name: 'Login' })
}

async function submitSupport() {
  const { valid } = await supportFormRef.value.validate()
  if (!valid) return
  supportSubmitting.value = true
  try {
    messagesStore.add({ type: 'success', text: "Demande d'assistance envoyée" })
    supportDialog.value = false
  } finally {
    supportSubmitting.value = false
  }
}

const accountLabel = computed(() => {
  const first = selfStore.item?.firstName?.trim() || ''
  const last = selfStore.item?.lastName?.trim() || ''
  const full = `${first} ${last}`.trim()
  return full || 'Utilisateur'
})
</script>

<template>
  <v-toolbar flat color="primary" density="comfortable" class="app-toolbar-sticky">
    <v-btn v-if="$vuetify.display.mobile && showBack" :icon="mdiArrowLeft" variant="text" color="white"
      aria-label="Retour" @click="goBack" />
    <v-btn v-else-if="$vuetify.display.mobile" icon variant="text" color="white" aria-label="Almakare"
      @click="goToDashboard">
      <v-img :src="logoInitials" width="28" height="28" contain />
    </v-btn>
    <v-spacer />
    <v-btn variant="text" color="white" aria-label="Aide" rounded="lg" min-width="0" class="px-3" width="40" hidden="40"
      @click="openSupportDialog">
      <v-icon :icon="mdiHelpCircleOutline" />
    </v-btn>
    <v-menu offset="8">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" :prepend-icon="mdiAccountOutline" variant="text" color="white" class="text-none">
          {{ accountLabel }}
        </v-btn>
      </template>
      <v-list density="compact" rounded="lg" class="card-shadow">
        <v-list-item :prepend-icon="mdiAccountOutline" title="Mon compte" @click="goToAccount" />
        <v-list-item :prepend-icon="mdiLogout" title="Déconnexion" @click="logout" />
      </v-list>
    </v-menu>
  </v-toolbar>

  <!-- Support dialog -->
  <v-dialog v-model="supportDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
    <v-card :class="['card-shadow', { 'rounded-15': !$vuetify.display.mobile }]">
      <v-card-title class="d-flex align-center ga-2 pa-4 support-dialog-title">
        <span class="text-headline-small font-weight-bold flex-grow-1">Envoyer une demande d'assistance</span>
        <v-btn :icon="mdiClose" variant="text" size="small" aria-label="Fermer" @click="supportDialog = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-form ref="supportFormRef" @submit.prevent="submitSupport">
          <v-text-field v-model.trim="supportForm.firstName" label="Prénom*" variant="outlined" rounded="lg"
            :rules="[required]" />
          <v-text-field v-model.trim="supportForm.lastName" label="Nom*" variant="outlined" rounded="lg"
            :rules="[required]" />
          <v-text-field v-model.trim="supportForm.email" label="Email*" type="email" variant="outlined" rounded="lg"
            :rules="[required, emailValidation]" />
          <v-text-field v-model.trim="supportForm.subject" label="Objet*" variant="outlined" rounded="lg"
            :rules="[required]" />
          <v-textarea v-model.trim="supportForm.message" label="Problème rencontré*" variant="outlined" rounded="lg"
            rows="4" auto-grow :rules="[required]" />
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="supportDialog = false">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="supportSubmitting"
          @click="submitSupport">Envoyer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.app-toolbar-sticky {
  position: sticky;
  top: 0;
  z-index: 5;
}

.support-dialog-title :deep(span),
.support-dialog-title span {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.25;
  min-width: 0;
}
</style>
