<script setup>
import doctorIllustration from '@/assets/illustrations/doctor.svg'
import teamIllustration from '@/assets/illustrations/team.svg'
import technicianIllustration from '@/assets/illustrations/technician.svg'
import {
  getPresetFor,
  PERMISSION_CATEGORIES,
  PERMISSIONS,
} from '@/data/permissions'
import DialogLogs from '@/components/DialogLogs.vue'
import { LOG_ACTIONS, LOG_FIELDS } from '@/data/logs'
import { useLogsStore } from '@/stores/logs'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import { useTeamStore } from '@/stores/team'
import {
  mdiAccountGroupOutline,
  mdiAccountPlusOutline,
  mdiAlertOutline,
  mdiCheckCircleOutline,
  mdiChevronRight,
  mdiClockOutline,
  mdiClose,
  mdiDoctor,
  mdiEmailOutline,
  mdiHeadset,
  mdiPencilOutline,
  mdiPlus,
  mdiRestore,
  mdiSendOutline,
  mdiShieldKeyOutline,
  mdiTrashCanOutline,
} from '@mdi/js'
import { computed, ref } from 'vue'

const teamStore = useTeamStore()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const logsStore = useLogsStore()

function logTeamAction(payload) {
  logsStore.add('teamLogs', {
    adminId: selfStore.item?.id,
    adminFullName: selfStore.item?.fullName,
    ...payload,
  })
}

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Médecin', icon: mdiDoctor, illustration: doctorIllustration },
  { value: 'coordinator', label: 'Coordinateur', icon: mdiAccountGroupOutline, illustration: teamIllustration },
  { value: 'technician', label: 'Technicien', icon: mdiHeadset, illustration: technicianIllustration },
]

const roleByValue = computed(() =>
  Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r])),
)

function getRoles(member) {
  if (!member) return []
  if (Array.isArray(member.roles) && member.roles.length > 0) return member.roles
  if (member.role) return [member.role]
  return []
}

function combinedPresetFor(roleList) {
  const set = new Set()
  for (const r of roleList) {
    for (const p of getPresetFor(r)) set.add(p)
  }
  return [...set]
}

function rolesLabel(roleList) {
  return roleList
    .map((r) => roleByValue.value[r]?.label || r)
    .join(', ')
}

const dialog = ref(false)
const permissionsDialog = ref(false)
const previewDialog = ref(false)
const sending = ref(false)
const formRef = ref(null)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const roles = ref(['doctor'])
const saving = ref(false)
const permissions = ref(getPresetFor('doctor'))
const permissionsTouched = ref(false)

const selectedRoles = computed(() =>
  roles.value.map((r) => roleByValue.value[r]).filter(Boolean),
)
const selectedRolesSet = computed(() => new Set(roles.value))
const selectedRolesLabel = computed(() =>
  selectedRoles.value.map((r) => r.label.toLowerCase()).join(', '),
)
const primaryRole = computed(() => selectedRoles.value[0] || ROLE_OPTIONS[0])

function toggleRole(value) {
  if (selectedRolesSet.value.has(value)) {
    if (roles.value.length <= 1) return
    roles.value = roles.value.filter((r) => r !== value)
  } else {
    roles.value = [...roles.value, value]
  }
  if (!permissionsTouched.value) {
    permissions.value = combinedPresetFor(roles.value)
  }
}

const permissionsSet = computed(() => new Set(permissions.value))
const activeCount = computed(() => permissions.value.length)

const permissionsByCategory = computed(() => {
  const map = {}
  for (const cat of PERMISSION_CATEGORIES) map[cat.id] = []
  for (const p of PERMISSIONS) {
    if (map[p.category]) map[p.category].push(p)
  }
  return map
})

function togglePermission(id, value) {
  permissionsTouched.value = true
  if (value) {
    if (!permissionsSet.value.has(id)) permissions.value = [...permissions.value, id]
  } else {
    permissions.value = permissions.value.filter((p) => p !== id)
  }
}

function resetPermissionsToPreset() {
  permissions.value = combinedPresetFor(roles.value)
  permissionsTouched.value = false
}

function categoryActiveCount(categoryId) {
  return permissionsByCategory.value[categoryId].filter((p) => permissionsSet.value.has(p.id)).length
}

const required = (v) => !!v?.trim() || 'Ce champ est requis'
const emailRule = (v) => /.+@.+\..+/.test(v) || 'Email invalide'

function resetForm() {
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  roles.value = ['doctor']
  permissions.value = getPresetFor('doctor')
  permissionsTouched.value = false
}

function openDialog() {
  resetForm()
  dialog.value = true
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  previewDialog.value = true
}

async function sendInvitation() {
  sending.value = true
  try {
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`.trim()
    teamStore.add({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      roles: [...roles.value],
      permissions: [...permissions.value],
      invitedAt: new Date().toISOString(),
      invitationStatus: 'pending',
    })
    logTeamAction({
      type: 'success',
      action: LOG_ACTIONS.MEMBER_INVITED,
      params: { name: fullName || email.value.trim() },
    })
    messagesStore.add({ type: 'success', text: 'Invitation envoyée' })
    previewDialog.value = false
    dialog.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de l\'envoi de l\'invitation' })
  } finally {
    sending.value = false
  }
}

const inviterName = computed(() => {
  const name = selfStore.item.fullName?.trim()
  return name || 'Votre coordinateur'
})

const inviterFirstName = computed(() => {
  return selfStore.item.firstName?.trim() || inviterName.value
})

const inviterEmail = computed(() => selfStore.item.email || 'no-reply@almakare.app')

const invitationSubject = computed(() =>
  `${inviterFirstName.value} vous invite à rejoindre son équipe sur Almakare`,
)

const removeDialog = ref(false)
const memberToRemove = ref(null)

function askRemove(member) {
  memberToRemove.value = member
  removeDialog.value = true
}

function confirmRemove() {
  if (memberToRemove.value) {
    const fullName = `${memberToRemove.value.firstName || ''} ${memberToRemove.value.lastName || ''}`.trim()
    teamStore.remove(memberToRemove.value.id)
    logTeamAction({
      type: 'error',
      action: LOG_ACTIONS.MEMBER_REMOVED,
      params: { name: fullName || memberToRemove.value.email },
    })
    messagesStore.add({ type: 'success', text: 'Membre retiré de l\'équipe' })
    memberDialog.value = false
    editMode.value = false
    selectedMember.value = null
  }
  removeDialog.value = false
  memberToRemove.value = null
}

function cancelRemove() {
  removeDialog.value = false
  memberToRemove.value = null
}

function initials(member) {
  return `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase()
}

const memberDialog = ref(false)
const editMode = ref(false)
const selectedMember = ref(null)
const editFormRef = ref(null)
const editFirstName = ref('')
const editLastName = ref('')
const editEmail = ref('')
const editRoles = ref(['doctor'])
const editPermissions = ref([])
const editPermissionsTouched = ref(false)
const editPermissionsDialog = ref(false)
const updating = ref(false)

const editPermissionsSet = computed(() => new Set(editPermissions.value))
const editActiveCount = computed(() => editPermissions.value.length)
const editSelectedRoles = computed(() =>
  editRoles.value.map((r) => roleByValue.value[r]).filter(Boolean),
)
const editSelectedRolesSet = computed(() => new Set(editRoles.value))
const editPrimaryRole = computed(() => editSelectedRoles.value[0] || ROLE_OPTIONS[0])
const editRolesLabel = computed(() =>
  editSelectedRoles.value.map((r) => r.label.toLowerCase()).join(', '),
)

function toggleEditRole(value) {
  if (editSelectedRolesSet.value.has(value)) {
    if (editRoles.value.length <= 1) return
    editRoles.value = editRoles.value.filter((r) => r !== value)
  } else {
    editRoles.value = [...editRoles.value, value]
  }
  if (!editPermissionsTouched.value) {
    editPermissions.value = combinedPresetFor(editRoles.value)
  }
}

function openMember(member) {
  selectedMember.value = member
  editMode.value = false
  memberDialog.value = true
}

function startEdit() {
  if (!selectedMember.value) return
  editFirstName.value = selectedMember.value.firstName
  editLastName.value = selectedMember.value.lastName
  editEmail.value = selectedMember.value.email
  editRoles.value = getRoles(selectedMember.value)
  if (editRoles.value.length === 0) editRoles.value = ['doctor']
  editPermissions.value = [...(selectedMember.value.permissions || [])]
  const preset = combinedPresetFor(editRoles.value)
  const sameAsPreset =
    preset.length === editPermissions.value.length &&
    preset.every((p) => editPermissionsSet.value.has(p))
  editPermissionsTouched.value = !sameAsPreset
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

function toggleEditPermission(id, value) {
  editPermissionsTouched.value = true
  if (value) {
    if (!editPermissionsSet.value.has(id)) editPermissions.value = [...editPermissions.value, id]
  } else {
    editPermissions.value = editPermissions.value.filter((p) => p !== id)
  }
}

function resetEditPermissionsToPreset() {
  editPermissions.value = combinedPresetFor(editRoles.value)
  editPermissionsTouched.value = false
}

function editCategoryActiveCount(categoryId) {
  return permissionsByCategory.value[categoryId].filter((p) => editPermissionsSet.value.has(p.id)).length
}

async function saveMember() {
  if (!selectedMember.value) return

  try {
    if (editFormRef.value?.validate) {
      const result = await editFormRef.value.validate()
      if (result && result.valid === false) return
    }
  } catch (e) {
    console.warn('Validation failed, continuing with manual check:', e)
  }

  const firstNameTrim = (editFirstName.value || '').trim()
  const lastNameTrim = (editLastName.value || '').trim()
  if (!firstNameTrim || !lastNameTrim) {
    messagesStore.add({ type: 'error', text: 'Prénom et nom sont requis' })
    return
  }

  updating.value = true
  try {
    const previous = selectedMember.value
    const patch = {
      firstName: firstNameTrim,
      lastName: lastNameTrim,
      roles: [...editRoles.value],
      role: editRoles.value[0],
      permissions: [...editPermissions.value],
    }
    const changes = []
    if (previous.firstName !== patch.firstName) {
      changes.push({ field: LOG_FIELDS.FIRST_NAME, from: previous.firstName, to: patch.firstName })
    }
    if (previous.lastName !== patch.lastName) {
      changes.push({ field: LOG_FIELDS.LAST_NAME, from: previous.lastName, to: patch.lastName })
    }
    const prevRoles = getRoles(previous).join(', ')
    const nextRoles = patch.roles.join(', ')
    if (prevRoles !== nextRoles) {
      changes.push({ field: LOG_FIELDS.ROLES, from: prevRoles, to: nextRoles })
    }
    const prevPerms = (previous.permissions || []).length
    const nextPerms = patch.permissions.length
    if (prevPerms !== nextPerms) {
      changes.push({ field: LOG_FIELDS.PERMISSIONS, from: String(prevPerms), to: String(nextPerms) })
    }
    teamStore.update(selectedMember.value.id, patch)
    selectedMember.value = { ...selectedMember.value, ...patch }
    logTeamAction({
      type: 'info',
      action: LOG_ACTIONS.MEMBER_UPDATED,
      params: { name: `${firstNameTrim} ${lastNameTrim}` },
      changes,
    })
    messagesStore.add({ type: 'success', text: 'Membre mis à jour' })
    editMode.value = false
  } catch (e) {
    console.error('Update member error:', e)
    messagesStore.add({
      type: 'error',
      text: `Erreur lors de la mise à jour : ${e?.message || 'inconnue'}`,
    })
  } finally {
    updating.value = false
  }
}

function formattedInvitedAt(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Équipe</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiAccountGroupOutline" size="18" class="mr-1" />
              Membres de votre équipe
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <DialogLogs collectionName="teamLogs" title="Historique de l'équipe" />
            <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiPlus" class="text-none" @click="openDialog">
              {{ $vuetify.display.mobile ? 'Inviter' : 'Inviter un membre' }}
            </v-btn>
          </v-col>
        </v-row>

        <v-card class="pa-6 card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-row align="center" class="mb-2">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Mon équipe
              </div>
              <div class="text-body-medium text-medium-emphasis">
                {{ teamStore.items.length }} membre{{ teamStore.items.length > 1 ? 's' : '' }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-list lines="two" class="pa-0">
            <template v-for="(member, idx) in teamStore.items" :key="member.id">
              <v-list-item class="px-2 py-3 rounded-lg member-item" @click="openMember(member)">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                    <v-img v-if="member.avatarUrl" :src="member.avatarUrl" cover />
                    <span v-else class="text-title-small font-weight-bold">{{ initials(member) }}</span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">
                  {{ member.firstName }} {{ member.lastName }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-body-small text-medium-emphasis mt-1">
                  {{ member.email }}
                </v-list-item-subtitle>

                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip v-for="r in getRoles(member)" :key="r" size="small" variant="flat" color="white"
                    class="border-light">
                    <template #prepend>
                      <img v-if="roleByValue[r]?.illustration" :src="roleByValue[r].illustration"
                        :alt="roleByValue[r]?.label" class="role-chip-img" />
                    </template>
                    {{ roleByValue[r]?.label || r }}
                  </v-chip>
                  <v-chip size="small" variant="flat" color="white" class="border-light text-primary"
                    :prepend-icon="mdiShieldKeyOutline">
                    {{ (member.permissions || []).length }} permission{{ (member.permissions || []).length > 1 ? 's' :
                      '' }}
                  </v-chip>
                  <v-chip v-if="member.invitationStatus === 'pending'" size="small" variant="flat" color="white"
                    class="border-light text-warning" :prepend-icon="mdiClockOutline">
                    Compte en attente
                  </v-chip>
                </div>
              </v-list-item>
              <v-divider v-if="idx < teamStore.items.length - 1" />
            </template>

            <v-list-item v-if="teamStore.items.length === 0" class="py-8 text-center flex-column">
              <v-icon :icon="mdiAccountPlusOutline" size="48" color="medium-emphasis" class="mb-3" />
              <div class="text-body-medium text-medium-emphasis mb-4">
                Aucun membre dans votre équipe pour le moment.
              </div>
              <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiPlus" class="text-none" @click="openDialog">
                Inviter un premier membre
              </v-btn>
            </v-list-item>
          </v-list>
        </v-card>

      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500" :fullscreen="$vuetify.display.mobile">
      <v-card class="pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-text class="px-6 pt-6 pb-6">
          <div class="text-headline-small font-weight-bold mb-2 text-center">Inviter un membre</div>
          <div class="text-body-medium text-medium-emphasis mb-5 text-center">
            Choisissez un ou plusieurs rôles, puis renseignez les informations.
          </div>

          <div class="role-picker mb-6">
            <button v-for="opt in ROLE_OPTIONS" :key="opt.value" type="button" class="role-card"
              :class="{ active: selectedRolesSet.has(opt.value) }" @click="toggleRole(opt.value)">
              <img :src="opt.illustration" :alt="opt.label" class="role-card-img" />
              <span class="role-card-label">{{ opt.label }}</span>
            </button>
          </div>

          <v-form ref="formRef" @submit.prevent="handleSubmit">
            <v-text-field v-model.trim="firstName" label="Prénom" variant="outlined" rounded="lg" density="comfortable"
              autofocus :rules="[required]" class="mb-2" />
            <v-text-field v-model.trim="lastName" label="Nom" variant="outlined" rounded="lg" density="comfortable"
              :rules="[required]" class="mb-2" />
            <v-text-field v-model.trim="email" label="Email" type="email" variant="outlined" rounded="lg"
              density="comfortable" :rules="[required, emailRule]" class="mb-3" />

            <button type="button" class="permissions-row mb-4" @click="permissionsDialog = true">
              <v-icon :icon="mdiShieldKeyOutline" size="22" color="primary" class="mr-3" />
              <div class="permissions-row-text">
                <div class="permissions-row-label">Permissions</div>
                <div class="permissions-row-sub">
                  {{ activeCount }} / {{ PERMISSIONS.length }} actives
                  <span v-if="permissionsTouched" class="permissions-row-tag">· personnalisées</span>
                </div>
              </div>
              <v-icon :icon="mdiChevronRight" size="22" color="medium-emphasis" />
            </button>

            <v-row class="ga-2" no-gutters>
              <v-col>
                <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="dialog = false"
                  :disabled="saving">
                  Annuler
                </v-btn>
              </v-col>
              <v-col>
                <v-btn color="primary" rounded="lg" flat size="large" block class="text-none" type="submit"
                  :loading="saving">
                  Inviter
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="permissionsDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['permissions-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <v-row align="center" no-gutters>
            <v-col>
              <div class="text-headline-small font-weight-bold">Permissions</div>
              <div class="text-body-small text-medium-emphasis mt-1">
                {{ activeCount }} / {{ PERMISSIONS.length }} actives
                · {{ roles.length > 1 ? 'Rôles' : 'Rôle' }} {{ selectedRolesLabel }}
              </div>
            </v-col>
            <v-col cols="auto">
              <v-btn variant="text" rounded="lg" size="small" :prepend-icon="mdiRestore" class="text-none"
                :disabled="!permissionsTouched" @click="resetPermissionsToPreset">
                Réinitialiser
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4" :class="{ 'permissions-scroll': !$vuetify.display.mobile }">
          <div v-for="cat in PERMISSION_CATEGORIES" :key="cat.id" class="mb-5">
            <div class="d-flex align-center mb-2">
              <div class="text-title-small text-medium-emphasis text-uppercase font-weight-bold">
                {{ cat.label }}
              </div>
              <v-spacer />
              <div class="text-body-small text-medium-emphasis">
                {{ categoryActiveCount(cat.id) }} / {{ permissionsByCategory[cat.id].length }}
              </div>
            </div>

            <div v-for="perm in permissionsByCategory[cat.id]" :key="perm.id" class="permission-item">
              <div class="permission-item-text">
                <div class="permission-item-label">{{ perm.label }}</div>
                <div class="permission-item-desc">{{ perm.description }}</div>
              </div>
              <v-switch :model-value="permissionsSet.has(perm.id)" color="primary" hide-details density="compact" inset
                @update:model-value="(v) => togglePermission(perm.id, v)" />
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat class="text-none" @click="permissionsDialog = false">
            Terminé
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="previewDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['preview-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <div class="text-headline-small font-weight-bold">Aperçu de l'invitation</div>
          <div class="text-body-small text-medium-emphasis mt-1">
            Voici l'email qui sera envoyé à {{ firstName }}.
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4">
          <div class="email-meta mb-4">
            <div class="email-meta-row">
              <span class="email-meta-key">De</span>
              <span class="email-meta-value">{{ inviterName }} &lt;{{ inviterEmail }}&gt;</span>
            </div>
            <div class="email-meta-row">
              <span class="email-meta-key">À</span>
              <span class="email-meta-value">{{ firstName }} {{ lastName }} &lt;{{ email }}&gt;</span>
            </div>
            <div class="email-meta-row">
              <span class="email-meta-key">Sujet</span>
              <span class="email-meta-value font-weight-bold">{{ invitationSubject }}</span>
            </div>
          </div>

          <div class="email-body">
            <div class="email-body-header">
              <img :src="primaryRole.illustration" :alt="primaryRole.label" class="email-body-illustration" />
              <div class="email-body-title">Bienvenue dans l'équipe !</div>
            </div>

            <p>Bonjour <strong>{{ firstName }}</strong>,</p>

            <p>
              <strong>{{ inviterFirstName }}</strong> vous invite à rejoindre son équipe sur
              <strong>Almakare</strong> en tant que
              <strong>{{ selectedRolesLabel }}</strong>.
            </p>

            <p>
              Cliquez sur le bouton ci-dessous pour activer votre compte, définir votre mot de passe et
              commencer à collaborer avec votre équipe.
            </p>

            <div class="email-cta-wrap">
              <span class="email-cta">Rejoindre l'équipe</span>
            </div>

            <p class="text-body-small text-medium-emphasis">
              Vous aurez accès à {{ activeCount }} permission{{ activeCount > 1 ? 's' : '' }} configurée{{ activeCount >
                1 ?
                's' : '' }}
              par {{ inviterFirstName }}. Ces droits pourront être ajustés à tout moment.
            </p>

            <p class="text-body-small text-medium-emphasis mb-0">
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message en toute sécurité.
            </p>

            <div class="email-footer">
              À très vite,<br />
              L'équipe Almakare
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-btn variant="text" rounded="lg" class="text-none" @click="previewDialog = false" :disabled="sending">
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiSendOutline" class="text-none" :loading="sending"
            @click="sendInvitation">
            Envoyer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="memberDialog" max-width="520" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['member-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]" v-if="selectedMember">

        <v-card-title class="px-6 pt-6 pb-2 d-flex align-center">
          <div class="text-headline-small font-weight-bold flex-grow-1">
            {{ editMode ? 'Modifier le membre' : 'Détails du membre' }}
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="memberDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-5">
          <div class="member-hero mb-5">
            <v-avatar color="primary" variant="tonal" size="96" class="mb-3">
              <v-img v-if="selectedMember.avatarUrl" :src="selectedMember.avatarUrl" cover />
              <span v-else class="text-headline-small font-weight-bold">{{ initials(selectedMember) }}</span>
            </v-avatar>
            <div class="text-headline-small font-weight-bold">
              {{ editMode ? `${editFirstName || '…'} ${editLastName || ''}`.trim() : `${selectedMember.firstName}
              ${selectedMember.lastName}` }}
            </div>
            <div class="d-flex flex-wrap justify-center ga-2 mt-3">
              <v-chip v-for="r in (editMode ? editRoles : getRoles(selectedMember))" :key="r" size="large"
                variant="flat" color="white" class="border-light">
                <template #prepend>
                  <img v-if="roleByValue[r]?.illustration" :src="roleByValue[r].illustration"
                    :alt="roleByValue[r]?.label" class="role-chip-img" />
                </template>
                {{ roleByValue[r]?.label || r }}
              </v-chip>
            </div>
          </div>

          <template v-if="!editMode">
            <div class="info-row">
              <v-icon :icon="mdiEmailOutline" size="20" color="medium-emphasis" class="info-row-icon" />
              <div class="info-row-content">
                <div class="info-row-label">Email</div>
                <div class="info-row-value">{{ selectedMember.email }}</div>
              </div>
            </div>

            <div class="info-row">
              <v-icon :icon="roleByValue[getRoles(selectedMember)[0]]?.icon" size="20" color="medium-emphasis"
                class="info-row-icon" />
              <div class="info-row-content">
                <div class="info-row-label">{{ getRoles(selectedMember).length > 1 ? 'Rôles' : 'Rôle' }}</div>
                <div class="info-row-value">{{ rolesLabel(getRoles(selectedMember)) }}</div>
              </div>
            </div>

            <div class="info-row">
              <v-icon :icon="mdiShieldKeyOutline" size="20" color="medium-emphasis" class="info-row-icon" />
              <div class="info-row-content">
                <div class="info-row-label">Permissions</div>
                <div class="info-row-value">
                  {{ (selectedMember.permissions || []).length }} / {{ PERMISSIONS.length }} actives
                </div>
              </div>
            </div>

            <div class="info-row">
              <v-icon :icon="selectedMember.invitationStatus === 'accepted' ? mdiCheckCircleOutline : mdiClockOutline"
                size="20" :color="selectedMember.invitationStatus === 'accepted' ? 'success' : 'warning'"
                class="info-row-icon" />
              <div class="info-row-content">
                <div class="info-row-label">Statut</div>
                <div class="info-row-value">
                  <template v-if="selectedMember.invitationStatus === 'accepted'">Compte actif</template>
                  <template v-else>Invitation en attente · envoyée le {{ formattedInvitedAt(selectedMember.invitedAt)
                  }}</template>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="role-picker mb-5">
              <button v-for="opt in ROLE_OPTIONS" :key="opt.value" type="button" class="role-card"
                :class="{ active: editSelectedRolesSet.has(opt.value) }" @click="toggleEditRole(opt.value)">
                <img :src="opt.illustration" :alt="opt.label" class="role-card-img" />
                <span class="role-card-label">{{ opt.label }}</span>
              </button>
            </div>

            <v-form ref="editFormRef" @submit.prevent="saveMember">
              <v-text-field v-model.trim="editFirstName" label="Prénom" variant="outlined" rounded="lg"
                density="comfortable" :rules="[required]" class="mb-2" />
              <v-text-field v-model.trim="editLastName" label="Nom" variant="outlined" rounded="lg"
                density="comfortable" :rules="[required]" class="mb-2" />
              <v-text-field v-model.trim="editEmail" label="Email" type="email" variant="outlined" rounded="lg"
                density="comfortable" disabled persistent-hint
                hint="L'email ne peut pas être modifié après envoi de l'invitation." class="mb-4" />

              <button type="button" class="permissions-row" @click="editPermissionsDialog = true">
                <v-icon :icon="mdiShieldKeyOutline" size="22" color="primary" class="mr-3" />
                <div class="permissions-row-text">
                  <div class="permissions-row-label">Permissions</div>
                  <div class="permissions-row-sub">
                    {{ editActiveCount }} / {{ PERMISSIONS.length }} actives
                    <span v-if="editPermissionsTouched" class="permissions-row-tag">· personnalisées</span>
                  </div>
                </div>
                <v-icon :icon="mdiChevronRight" size="22" color="medium-emphasis" />
              </button>
            </v-form>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <template v-if="!editMode">
            <v-spacer />
            <v-btn variant="text" rounded="lg" class="text-none" @click="memberDialog = false">
              Fermer
            </v-btn>
            <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiPencilOutline" class="text-none"
              @click="startEdit">
              Modifier
            </v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" color="error" rounded="lg" class="text-none" :prepend-icon="mdiTrashCanOutline"
              :disabled="updating" @click="askRemove(selectedMember)">
              Supprimer
            </v-btn>
            <v-spacer />
            <v-btn variant="text" rounded="lg" class="text-none" @click="cancelEdit" :disabled="updating">
              Annuler
            </v-btn>
            <v-btn color="primary" rounded="lg" flat class="text-none" :loading="updating" @click="saveMember">
              Enregistrer
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editPermissionsDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['permissions-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <v-row align="center" no-gutters>
            <v-col>
              <div class="text-headline-small font-weight-bold">Permissions</div>
              <div class="text-body-small text-medium-emphasis mt-1">
                {{ editActiveCount }} / {{ PERMISSIONS.length }} actives
                · {{ editRoles.length > 1 ? 'Rôles' : 'Rôle' }} {{ editRolesLabel }}
              </div>
            </v-col>
            <v-col cols="auto">
              <v-btn variant="text" rounded="lg" size="small" :prepend-icon="mdiRestore" class="text-none"
                :disabled="!editPermissionsTouched" @click="resetEditPermissionsToPreset">
                Réinitialiser
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4" :class="{ 'permissions-scroll': !$vuetify.display.mobile }">
          <div v-for="cat in PERMISSION_CATEGORIES" :key="cat.id" class="mb-5">
            <div class="d-flex align-center mb-2">
              <div class="text-title-small text-medium-emphasis text-uppercase font-weight-bold">
                {{ cat.label }}
              </div>
              <v-spacer />
              <div class="text-body-small text-medium-emphasis">
                {{ editCategoryActiveCount(cat.id) }} / {{ permissionsByCategory[cat.id].length }}
              </div>
            </div>

            <div v-for="perm in permissionsByCategory[cat.id]" :key="perm.id" class="permission-item">
              <div class="permission-item-text">
                <div class="permission-item-label">{{ perm.label }}</div>
                <div class="permission-item-desc">{{ perm.description }}</div>
              </div>
              <v-switch :model-value="editPermissionsSet.has(perm.id)" color="primary" hide-details density="compact"
                inset @update:model-value="(v) => toggleEditPermission(perm.id, v)" />
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat class="text-none" @click="editPermissionsDialog = false">
            Terminé
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="removeDialog" max-width="420" :fullscreen="false">
      <v-card class="pa-2 rounded-15">
        <v-card-text class="px-6 pt-6 pb-2 text-center">
          <div class="remove-icon-wrap mb-4">
            <v-icon :icon="mdiAlertOutline" size="40" color="error" />
          </div>
          <div class="text-headline-small font-weight-bold mb-2">Retirer ce membre ?</div>
          <div class="text-body-medium text-medium-emphasis">
            <template v-if="memberToRemove">
              <strong>{{ memberToRemove.firstName }} {{ memberToRemove.lastName }}</strong>
              perdra immédiatement l'accès à l'équipe et à ses
              {{ (memberToRemove.permissions || []).length }} permission{{ (memberToRemove.permissions || []).length > 1
                ? 's' : '' }}.
              Cette action est irréversible.
            </template>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-row class="ga-2" no-gutters>
            <v-col>
              <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="cancelRemove">
                Annuler
              </v-btn>
            </v-col>
            <v-col>
              <v-btn color="error" rounded="lg" flat size="large" block class="text-none"
                :prepend-icon="mdiTrashCanOutline" @click="confirmRemove">
                Retirer
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.role-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 6px;
  background: rgba(0, 0, 0, 0.025);
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.role-card:hover {
  background: rgba(0, 0, 0, 0.05);
}

.role-card:active {
  transform: scale(0.96);
}

.role-card.active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.role-card-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.role-card-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
}

.role-card.active .role-card-label {
  color: rgb(var(--v-theme-primary));
}

.preview-card {
  display: flex;
  flex-direction: column;
}

.email-meta {
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
}

.email-meta-row {
  display: flex;
  font-size: 13px;
  line-height: 1.6;
}

.email-meta-key {
  width: 64px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding-top: 2px;
}

.email-meta-value {
  color: rgba(0, 0, 0, 0.85);
  word-break: break-word;
}

.email-body {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.65;
}

.email-body p {
  margin: 0 0 14px 0;
}

.email-body-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.email-body-illustration {
  height: 90px;
  width: auto;
  margin-bottom: 10px;
}

.email-body-title {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.email-cta-wrap {
  display: flex;
  justify-content: center;
  margin: 22px 0;
}

.email-cta {
  display: inline-block;
  background: rgb(var(--v-theme-primary));
  color: white;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.email-footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}

.role-chip-img {
  height: 18px;
  width: 18px;
  object-fit: contain;
  margin-right: 6px;
}

.member-hero .role-chip-img {
  height: 22px;
  width: 22px;
}

.remove-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), 0.12);
}

.member-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.member-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.member-card {
  display: flex;
  flex-direction: column;
}

.member-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row-icon {
  margin-top: 2px;
}

.info-row-content {
  flex: 1;
  min-width: 0;
}

.info-row-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 2px;
}

.info-row-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-word;
}
</style>
