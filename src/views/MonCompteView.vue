<script setup>
import { ISOToShortenedDate } from "@/composables/useDates"
import { useRules } from "@/composables/useRules"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountOutline,
  mdiDeleteOutline,
  mdiEye,
  mdiEyeOff,
  mdiLockOutline,
} from "@mdi/js"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

const EMPTY = '-'

const router = useRouter()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { required, passwordValidation } = useRules()

const currentUser = computed(() => selfStore.item || {})

const createdAtDisplay = computed(() => {
  const d = currentUser.value?.createdAt
  if (!d) return ''
  return ISOToShortenedDate(d?.toDate ? d.toDate() : d)
})

// ---- Password change ----
const passwordFormRef = ref(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const savingPassword = ref(false)

const passwordsMatch = (v) => v === newPassword.value || 'Les mots de passe ne correspondent pas'
const passwordDiffersFromCurrent = (v) =>
  !v || v !== currentPassword.value || 'Le nouveau mot de passe doit être différent'

async function handleChangePassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  savingPassword.value = true
  try {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordFormRef.value.resetValidation()
    messagesStore.add({ type: 'success', text: 'Mot de passe mis à jour' })
  } finally {
    savingPassword.value = false
  }
}

// ---- Delete account ----
const deleteDialog = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)
const CONFIRM_WORD = 'SUPPRIMER'

function openDeleteDialog() {
  deleteConfirmText.value = ''
  deleteDialog.value = true
}

async function handleDeleteAccount() {
  if (deleteConfirmText.value.trim() !== CONFIRM_WORD) return
  deleting.value = true
  try {
    selfStore.item = {}
    deleteDialog.value = false
    messagesStore.add({ type: 'success', text: 'Compte supprimé' })
    router.push({ name: 'Login' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10" :md="8" :lg="6">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Mon compte</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              Gérez les paramètres de votre compte
            </div>
          </v-col>
        </v-row>

        <!-- =================== INFORMATIONS =================== -->
        <v-card class="card-shadow mb-4 pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-4">
            <v-icon :icon="mdiAccountOutline" class="mr-2" />
            <span class="section-title">Informations du compte</span>
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <div class="field-label">Email</div>
              <div class="field-value">{{ currentUser.email || EMPTY }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">Date de création</div>
              <div class="field-value">{{ createdAtDisplay || EMPTY }}</div>
            </v-col>
          </v-row>
        </v-card>

        <!-- =================== MOT DE PASSE =================== -->
        <v-card class="card-shadow mb-4 pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-4">
            <v-icon :icon="mdiLockOutline" class="mr-2" />
            <span class="section-title">Modifier le mot de passe</span>
          </div>
          <v-form ref="passwordFormRef" @submit.prevent="handleChangePassword">
            <v-text-field v-model="currentPassword" label="Mot de passe actuel"
              :type="showCurrent ? 'text' : 'password'" variant="outlined" rounded="lg" density="comfortable"
              autocomplete="current-password" :rules="[required]"
              :append-inner-icon="showCurrent ? mdiEyeOff : mdiEye" @click:append-inner="showCurrent = !showCurrent" />

            <v-text-field v-model="newPassword" label="Nouveau mot de passe" :type="showNew ? 'text' : 'password'"
              variant="outlined" rounded="lg" density="comfortable" autocomplete="new-password"
              :rules="[required, passwordValidation, passwordDiffersFromCurrent]"
              :append-inner-icon="showNew ? mdiEyeOff : mdiEye" @click:append-inner="showNew = !showNew" />

            <v-text-field v-model="confirmPassword" label="Confirmer le nouveau mot de passe"
              :type="showConfirm ? 'text' : 'password'" variant="outlined" rounded="lg" density="comfortable"
              autocomplete="new-password" :rules="[required, passwordsMatch]"
              :append-inner-icon="showConfirm ? mdiEyeOff : mdiEye" @click:append-inner="showConfirm = !showConfirm" />

            <div class="d-flex justify-end">
              <v-btn color="primary" rounded="lg" flat class="text-none" :loading="savingPassword" type="submit">
                Mettre à jour le mot de passe
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <!-- =================== SUPPRESSION =================== -->
        <v-card class="card-shadow pa-6 danger-card" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-2">
            <v-icon :icon="mdiDeleteOutline" color="error" class="mr-2" />
            <span class="section-title text-error">Supprimer le compte</span>
          </div>
          <div class="text-body-medium text-medium-emphasis mb-4">
            La suppression est définitive. Vos données et votre historique seront effacés.
          </div>
          <div class="d-flex justify-end">
            <v-btn color="error" variant="outlined" rounded="lg" class="text-none" :prepend-icon="mdiDeleteOutline"
              @click="openDeleteDialog">
              Supprimer mon compte
            </v-btn>
          </div>
        </v-card>

      </v-col>
    </v-row>

    <!-- =================== DELETE CONFIRM DIALOG =================== -->
    <v-dialog v-model="deleteDialog" max-width="500" :fullscreen="$vuetify.display.mobile">
      <v-card :rounded="$vuetify.display.mobile ? 0 : 'lg'" class="card-shadow">
        <v-card-title class="pa-4">
          <span class="text-headline-small font-weight-bold">Supprimer mon compte</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="text-body-medium mb-4">
            Cette action est <strong>irréversible</strong>. Pour confirmer, saisissez
            <strong>{{ CONFIRM_WORD }}</strong> ci-dessous.
          </div>
          <v-text-field v-model="deleteConfirmText" label="Tapez SUPPRIMER pour confirmer" variant="outlined"
            rounded="lg" density="comfortable" autocomplete="off" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" class="text-none" :loading="deleting"
            :disabled="deleteConfirmText.trim() !== CONFIRM_WORD" @click="handleDeleteAccount">
            Supprimer définitivement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 4px;
}

.field-value {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.4;
  word-break: break-word;
}

.danger-card {
  border: 1px solid rgba(var(--v-theme-error), 0.25);
}
</style>
