<script setup>
import doctorIllustration from '@/assets/illustrations/doctor.svg'
import teamIllustration from '@/assets/illustrations/team.svg'
import technicianIllustration from '@/assets/illustrations/technician.svg'
import Picture from '@/components/Picture.vue'
import { useRules } from '@/composables/useRules'
import {
  getPresetFor,
  PERMISSION_CATEGORIES,
  PERMISSIONS,
} from '@/data/permissions'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountGroupOutline,
  mdiChevronRight,
  mdiDoctor,
  mdiEmailOutline,
  mdiHeadset,
  mdiPencilOutline,
  mdiPhoneOutline,
  mdiRestore,
  mdiShieldKeyOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const router = useRouter()

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Médecin', icon: mdiDoctor, illustration: doctorIllustration },
  { value: 'coordinator', label: 'Coordinateur', icon: mdiAccountGroupOutline, illustration: teamIllustration },
  { value: 'technician', label: 'Technicien', icon: mdiHeadset, illustration: technicianIllustration },
]

const roleByValue = computed(() =>
  Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r])),
)

const currentUser = computed(() => selfStore.item || {})

const currentRoles = computed(() => {
  const u = currentUser.value
  if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles
  if (u.role) return [u.role]
  return ['doctor']
})
const currentRole = computed(() => currentRoles.value[0])
const currentRolesLabel = computed(() =>
  currentRoles.value.map((r) => (roleByValue.value[r]?.label || r).toLowerCase()).join(', '),
)

const generalFormRef = ref(null)
const savingGeneral = ref(false)
const permissionsDialog = ref(false)
const isEditing = ref(false)
const isCoordinator = computed(() => currentRoles.value.includes('coordinator'))
const roleChangeDialog = ref(false)

const editRoles = ref([])
const editRolesSet = computed(() => new Set(editRoles.value))
const rolesDirty = computed(() => {
  if (editRoles.value.length !== currentRoles.value.length) return true
  const set = new Set(currentRoles.value)
  return editRoles.value.some((r) => !set.has(r))
})

function hydrateRoles() {
  editRoles.value = [...currentRoles.value]
}

function toggleRoleSelection(value) {
  if (editRolesSet.value.has(value)) {
    if (editRoles.value.length <= 1) return
    editRoles.value = editRoles.value.filter((r) => r !== value)
  } else {
    editRoles.value = [...editRoles.value, value]
  }
}

const generalModel = ref({
  firstName: '',
  lastName: '',
  phoneNumber: '',
})

function hydrateModel(item) {
  generalModel.value = {
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    phoneNumber: item.phoneNumber || '',
  }
}

watch(() => currentUser.value, (item) => {
  if (!item?.id) return
  hydrateModel(item)
  hydrateRoles()
}, { immediate: true })

function startEdit() {
  hydrateModel(currentUser.value)
  isEditing.value = true
}

function cancelEdit() {
  hydrateModel(currentUser.value)
  isEditing.value = false
}

const userPermissions = computed(() => {
  const perms = currentUser.value.permissions
  if (Array.isArray(perms) && perms.length > 0) return perms
  return combinedPresetFor(currentRoles.value)
})

const permissionsSet = computed(() => new Set(userPermissions.value))
const activeCount = computed(() => userPermissions.value.length)

const permissionsByCategory = computed(() => {
  const map = {}
  for (const cat of PERMISSION_CATEGORIES) map[cat.id] = []
  for (const p of PERMISSIONS) {
    if (map[p.category]) map[p.category].push(p)
  }
  return map
})

function categoryActiveCount(categoryId) {
  return permissionsByCategory.value[categoryId].filter((p) => permissionsSet.value.has(p.id)).length
}

function combinedPresetFor(roleList) {
  const set = new Set()
  for (const r of roleList) {
    for (const p of getPresetFor(r)) set.add(p)
  }
  return [...set]
}

const editPermissions = ref([])
const editPermissionsSet = computed(() => new Set(editPermissions.value))
const editActiveCount = computed(() => editPermissions.value.length)
const editPermissionsDirty = computed(() => {
  if (editPermissions.value.length !== userPermissions.value.length) return true
  const set = new Set(userPermissions.value)
  return editPermissions.value.some((p) => !set.has(p))
})
const savingPermissions = ref(false)
const categoryDialog = ref(false)
const selectedCategoryId = ref(null)
const selectedCategory = computed(() =>
  PERMISSION_CATEGORIES.find((c) => c.id === selectedCategoryId.value) || null,
)

function hydratePermissions() {
  editPermissions.value = [...userPermissions.value]
}

function openCategoryDialog(categoryId) {
  selectedCategoryId.value = categoryId
  hydratePermissions()
  categoryDialog.value = true
}

function cancelCategoryEdit() {
  hydratePermissions()
  categoryDialog.value = false
}

async function handleSaveCategoryPermissions() {
  if (await persistPermissions()) categoryDialog.value = false
}

function resetCategoryToPreset() {
  if (!selectedCategoryId.value) return
  const preset = new Set(combinedPresetFor(currentRoles.value))
  const catPerms = permissionsByCategory.value[selectedCategoryId.value] || []
  const catIds = new Set(catPerms.map((p) => p.id))
  const next = editPermissions.value.filter((p) => !catIds.has(p))
  for (const p of catPerms) {
    if (preset.has(p.id)) next.push(p.id)
  }
  editPermissions.value = next
}

function editCategoryActiveCount(categoryId) {
  return permissionsByCategory.value[categoryId].filter((p) => editPermissionsSet.value.has(p.id)).length
}

function toggleEditPermission(id, value) {
  if (value) {
    if (!editPermissionsSet.value.has(id)) editPermissions.value = [...editPermissions.value, id]
  } else {
    editPermissions.value = editPermissions.value.filter((p) => p !== id)
  }
}

function resetEditPermissionsToPreset() {
  editPermissions.value = combinedPresetFor(currentRoles.value)
}

function cancelPermissionsEdit() {
  hydratePermissions()
  permissionsDialog.value = false
}

async function persistPermissions() {
  if (!selfStore.item?.id) return false
  savingPermissions.value = true
  try {
    selfStore.item.permissions = [...editPermissions.value]
    messagesStore.add({ type: 'success', text: 'Permissions mises à jour' })
    return true
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour des permissions' })
    return false
  } finally {
    savingPermissions.value = false
  }
}

async function handleSavePermissions() {
  if (await persistPermissions()) permissionsDialog.value = false
}

watch(permissionsDialog, (open) => {
  if (open) hydratePermissions()
})

const required = (v) => !!v?.trim() || 'Ce champ est requis'
const { phoneNumberValidation } = useRules()

async function handleSaveGeneral() {
  const { valid } = await generalFormRef.value.validate()
  if (!valid) return
  savingGeneral.value = true
  try {
    const value = generalModel.value
    const updateData = {
      firstName: value.firstName,
      lastName: value.lastName,
      fullName: `${value.firstName} ${value.lastName}`.trim(),
      phoneNumber: value.phoneNumber,
    }
    Object.assign(selfStore.item, updateData)
    isEditing.value = false
    messagesStore.add({ type: 'success', text: 'Profil mis à jour avec succès' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
  } finally {
    savingGeneral.value = false
  }
}

function applyRoles(rolesArr) {
  if (!selfStore.item?.id) return
  selfStore.item.roles = [...rolesArr]
  selfStore.item.role = rolesArr[0]
  messagesStore.add({ type: 'success', text: 'Rôles mis à jour' })
}

function handleSaveRoles() {
  if (!selfStore.item?.id || !rolesDirty.value) return
  if (isCoordinator.value && !editRolesSet.value.has('coordinator')) {
    roleChangeDialog.value = true
    return
  }
  applyRoles(editRoles.value)
}

function cancelRoleEdit() {
  hydrateRoles()
}

function confirmRoleChange() {
  applyRoles(editRoles.value)
  roleChangeDialog.value = false
}

function cancelRoleChange() {
  roleChangeDialog.value = false
}

async function logOut() {
  try {
    selfStore.item = {}
    router.push({ name: 'Home' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la déconnexion' })
  }
}

const displayName = computed(() => {
  const fn = currentUser.value.firstName || ''
  const ln = currentUser.value.lastName || ''
  const full = `${fn} ${ln}`.trim()
  return full || 'Votre profil'
})

const initials = computed(() => {
  const fn = currentUser.value.firstName?.[0] ?? ''
  const ln = currentUser.value.lastName?.[0] ?? ''
  return `${fn}${ln}`.toUpperCase()
})
</script>

<template>
  <div>
    <v-row v-if="selfStore.item.id" justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">

        <!-- =================== PROFILE CARD (view + edit) =================== -->
        <v-card class="card-shadow hero-card pa-6 mb-4 rounded-15"
          :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">
          <!-- VIEW MODE -->
          <div v-if="!isEditing">
            <div class="d-flex justify-end">
              <v-btn :icon="mdiPencilOutline" variant="text" size="small" color="primary" @click="startEdit"
                aria-label="Modifier le profil" />
            </div>
            <div class="d-flex flex-column align-center text-center">
              <v-avatar color="primary" variant="tonal" size="96" class="mb-3">
                <v-img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" cover />
                <span v-else class="text-headline-small font-weight-bold">{{ initials }}</span>
              </v-avatar>
              <div class="text-headline-small font-weight-bold">{{ displayName }}</div>
              <div class="d-flex flex-wrap justify-center ga-2 mt-3">
                <v-chip v-for="r in currentRoles" :key="r" size="large" variant="flat" color="white"
                  class="border-light">
                  <template #prepend>
                    <img v-if="roleByValue[r]?.illustration" :src="roleByValue[r].illustration"
                      :alt="roleByValue[r]?.label" class="role-chip-img" />
                  </template>
                  {{ roleByValue[r]?.label || r }}
                </v-chip>
              </div>

              <div class="d-flex flex-column align-center ga-1 mt-4">
                <div v-if="currentUser.email" class="d-flex align-center ga-1 text-body-small text-medium-emphasis">
                  <v-icon :icon="mdiEmailOutline" size="18" />
                  <span>{{ currentUser.email }}</span>
                </div>
                <div v-if="currentUser.phoneNumber"
                  class="d-flex align-center ga-1 text-body-small text-medium-emphasis">
                  <v-icon :icon="mdiPhoneOutline" size="18" />
                  <span>{{ currentUser.phoneNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- EDIT MODE -->
          <v-form v-else ref="generalFormRef">
            <div class="text-headline-small font-weight-bold mb-4">Modifier mon profil</div>

            <v-row>
              <v-col cols="12" class="d-flex flex-column align-center">
                <Picture :docPath="`users/${selfStore.item.id}`" :storagePath="`users/${selfStore.item.id}`"
                  v-model:source="selfStore.item.avatarUrl" pictureName="avatar" :size="100" for="avatar"
                  :cover="true" />
                <div class="text-body-small text-medium-emphasis mt-2">Photo de profil</div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.trim="generalModel.firstName" label="Prénom" variant="outlined" rounded="lg"
                  :rules="[required]" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="generalModel.lastName" label="Nom" variant="outlined" rounded="lg"
                  :rules="[required]" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field :model-value="currentUser.email" label="Email" variant="outlined" rounded="lg" disabled />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="generalModel.phoneNumber" label="Téléphone professionnel" variant="outlined"
                  rounded="lg" inputmode="tel" :prepend-inner-icon="mdiPhoneOutline" :rules="[phoneNumberValidation]" />
              </v-col>
            </v-row>

            <div class="d-flex justify-end ga-2 mt-2">
              <v-btn variant="text" rounded="lg" size="small" class="text-none" :disabled="savingGeneral"
                @click="cancelEdit">
                Annuler
              </v-btn>
              <v-btn color="primary" rounded="lg" size="small" flat class="text-none" :loading="savingGeneral"
                @click="handleSaveGeneral">
                Enregistrer
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <v-row>

          <!-- =================== ROLE SWITCHER (coordinator only) =================== -->
          <v-col v-if="isCoordinator" cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold text-truncate">Mon rôle</span>
              </v-card-title>

              <v-card-text class="px-4 pt-4">
                <div class="text-body-small text-medium-emphasis mb-4">
                  En tant que coordinateur, vous pouvez modifier vos propres rôles. Sélectionnez un ou
                  plusieurs rôles.
                </div>

                <div class="role-picker mb-4">
                  <button v-for="opt in ROLE_OPTIONS" :key="opt.value" type="button" class="role-card"
                    :class="{ active: editRolesSet.has(opt.value) }" @click="toggleRoleSelection(opt.value)">
                    <img :src="opt.illustration" :alt="opt.label" class="role-card-img" />
                    <span class="role-card-label">{{ opt.label }}</span>
                  </button>
                </div>

                <div v-if="rolesDirty" class="d-flex justify-end ga-2">
                  <v-btn variant="text" rounded="lg" size="small" class="text-none" @click="cancelRoleEdit">
                    Annuler
                  </v-btn>
                  <v-btn color="primary" rounded="lg" size="small" flat class="text-none" @click="handleSaveRoles">
                    Enregistrer
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- =================== PERMISSIONS (read-only) =================== -->
          <v-col cols="12">
            <v-card class="card-shadow pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
                <span class="text-headline-small font-weight-bold text-truncate">Mes permissions</span>
                <v-spacer />
                <v-chip size="small" variant="tonal" color="primary" :prepend-icon="mdiShieldKeyOutline"
                  class="font-weight-bold">
                  {{ activeCount }} / {{ PERMISSIONS.length }}
                </v-chip>
              </v-card-title>

              <v-card-text class="px-4 pt-4">
                <div class="text-body-small text-medium-emphasis mb-4">
                  <template v-if="isCoordinator">
                    En tant que coordinateur, vous pouvez modifier vos propres permissions.
                  </template>
                  <template v-else>
                    Vos droits sont définis par le coordinateur de votre équipe. Contactez-le pour les modifier.
                  </template>
                </div>

                <div class="category-grid">
                  <button v-for="cat in PERMISSION_CATEGORIES" :key="cat.id" type="button" class="category-tile"
                    @click="openCategoryDialog(cat.id)">
                    <div class="category-tile-label">{{ cat.label }}</div>
                    <div class="category-tile-count">
                      <span class="category-tile-active">{{ categoryActiveCount(cat.id) }}</span>
                      <span class="category-tile-total">/ {{ permissionsByCategory[cat.id].length }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="permissionsByCategory[cat.id].length ? (categoryActiveCount(cat.id) / permissionsByCategory[cat.id].length) * 100 : 0"
                      color="primary" rounded height="4" class="mt-2" />
                  </button>
                </div>

                <button type="button" class="permissions-row mt-4" @click="permissionsDialog = true">
                  <v-icon :icon="mdiShieldKeyOutline" size="22" color="primary" class="mr-3" />
                  <div class="permissions-row-text">
                    <div class="permissions-row-label">Voir le détail des permissions</div>
                    <div class="permissions-row-sub">
                      {{ activeCount }} permission{{ activeCount > 1 ? 's' : '' }} active{{ activeCount > 1 ? 's' : ''
                      }}
                    </div>
                  </div>
                  <v-icon :icon="mdiChevronRight" size="22" color="medium-emphasis" />
                </button>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- =================== LOGOUT =================== -->
          <v-col cols="12">
            <v-row justify="center">
              <v-btn color="error" variant="outlined" class="text-none mt-6 mb-16" rounded="lg" @click="logOut">
                Se déconnecter
              </v-btn>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Loading skeleton -->
    <v-row v-else justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 9">
        <v-card class="mb-4 card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex flex-column align-center">
            <v-skeleton-loader type="avatar" class="mb-3" />
            <v-skeleton-loader type="heading" />
          </div>
        </v-card>
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-row>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- =================== PERMISSIONS DETAIL DIALOG =================== -->
    <v-dialog v-model="permissionsDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable
      :persistent="isCoordinator && editPermissionsDirty">
      <v-card :class="['permissions-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <v-row align="center" no-gutters>
            <v-col>
              <div class="text-headline-small font-weight-bold">Mes permissions</div>
              <div class="text-body-small text-medium-emphasis mt-1">
                {{ isCoordinator ? editActiveCount : activeCount }} / {{ PERMISSIONS.length }} actives
                · {{ currentRoles.length > 1 ? 'Rôles' : 'Rôle' }} {{ currentRolesLabel }}
              </div>
            </v-col>
            <v-col v-if="isCoordinator" cols="auto">
              <v-btn variant="text" rounded="lg" size="small" :prepend-icon="mdiRestore" class="text-none"
                @click="resetEditPermissionsToPreset">
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
                {{ isCoordinator ? editCategoryActiveCount(cat.id) : categoryActiveCount(cat.id) }} / {{ permissionsByCategory[cat.id].length }}
              </div>
            </div>

            <div v-for="perm in permissionsByCategory[cat.id]" :key="perm.id" class="permission-item"
              :class="{ 'permission-item-inactive': !isCoordinator && !permissionsSet.has(perm.id) }">
              <div class="permission-item-text">
                <div class="permission-item-label">{{ perm.label }}</div>
                <div class="permission-item-desc">{{ perm.description }}</div>
              </div>
              <v-switch v-if="isCoordinator" :model-value="editPermissionsSet.has(perm.id)" color="primary" hide-details
                density="compact" inset @update:model-value="(v) => toggleEditPermission(perm.id, v)" />
              <v-chip v-else size="x-small" variant="tonal"
                :color="permissionsSet.has(perm.id) ? 'success' : 'grey-darken-1'" class="font-weight-medium">
                {{ permissionsSet.has(perm.id) ? 'Activée' : 'Désactivée' }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <template v-if="isCoordinator">
            <v-btn variant="text" rounded="lg" class="text-none" :disabled="savingPermissions"
              @click="cancelPermissionsEdit">
              Annuler
            </v-btn>
            <v-btn color="primary" rounded="lg" flat class="text-none ml-2" :disabled="!editPermissionsDirty"
              :loading="savingPermissions" @click="handleSavePermissions">
              Enregistrer
            </v-btn>
          </template>
          <v-btn v-else color="primary" rounded="lg" flat class="text-none" @click="permissionsDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== CATEGORY PERMISSIONS DIALOG =================== -->
    <v-dialog v-model="categoryDialog" max-width="520" :fullscreen="$vuetify.display.mobile" scrollable
      :persistent="isCoordinator && editPermissionsDirty">
      <v-card v-if="selectedCategory" :class="['permissions-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <v-row align="center" no-gutters>
            <v-col>
              <div class="text-headline-small font-weight-bold">{{ selectedCategory.label }}</div>
              <div class="text-body-small text-medium-emphasis mt-1">
                {{ isCoordinator ? editCategoryActiveCount(selectedCategory.id) : categoryActiveCount(selectedCategory.id) }}
                / {{ permissionsByCategory[selectedCategory.id].length }} actives
              </div>
            </v-col>
            <v-col v-if="isCoordinator" cols="auto">
              <v-btn variant="text" rounded="lg" size="small" :prepend-icon="mdiRestore" class="text-none"
                @click="resetCategoryToPreset">
                Réinitialiser
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4" :class="{ 'permissions-scroll': !$vuetify.display.mobile }">
          <div v-for="perm in permissionsByCategory[selectedCategory.id]" :key="perm.id" class="permission-item"
            :class="{ 'permission-item-inactive': !isCoordinator && !permissionsSet.has(perm.id) }">
            <div class="permission-item-text">
              <div class="permission-item-label">{{ perm.label }}</div>
              <div class="permission-item-desc">{{ perm.description }}</div>
            </div>
            <v-switch v-if="isCoordinator" :model-value="editPermissionsSet.has(perm.id)" color="primary" hide-details
              density="compact" inset @update:model-value="(v) => toggleEditPermission(perm.id, v)" />
            <v-chip v-else size="x-small" variant="tonal"
              :color="permissionsSet.has(perm.id) ? 'success' : 'grey-darken-1'" class="font-weight-medium">
              {{ permissionsSet.has(perm.id) ? 'Activée' : 'Désactivée' }}
            </v-chip>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <template v-if="isCoordinator">
            <v-btn variant="text" rounded="lg" class="text-none" :disabled="savingPermissions"
              @click="cancelCategoryEdit">
              Annuler
            </v-btn>
            <v-btn color="primary" rounded="lg" flat class="text-none ml-2" :disabled="!editPermissionsDirty"
              :loading="savingPermissions" @click="handleSaveCategoryPermissions">
              Enregistrer
            </v-btn>
          </template>
          <v-btn v-else color="primary" rounded="lg" flat class="text-none" @click="categoryDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== ROLE CHANGE CONFIRMATION DIALOG =================== -->
    <v-dialog v-model="roleChangeDialog" max-width="480" persistent>
      <v-card :class="['pa-2', { 'rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2 text-headline-small font-weight-bold">
          Abandonner le rôle de coordinateur ?
        </v-card-title>
        <v-card-text class="px-6 pt-2 pb-4">
          <p class="text-body-medium mb-2">
            Vous êtes sur le point de retirer le rôle de <strong>coordinateur</strong> de votre profil.
          </p>
          <p class="text-body-small text-medium-emphasis">
            Une fois ce changement enregistré, vous ne pourrez plus modifier vos rôles vous-même.
            Seul un coordinateur pourra modifier vos rôles ou ceux des autres utilisateurs.
          </p>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="cancelRoleChange">
            Annuler
          </v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="confirmRoleChange">
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.role-chip {
  letter-spacing: 0.2px;
  font-weight: 600;
}

.role-chip-img {
  height: 22px;
  width: 22px;
  object-fit: contain;
  margin-right: 6px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.category-tile {
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  text-align: left;
  width: 100%;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.category-tile:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.category-tile:active {
  transform: scale(0.98);
}

.category-tile-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.55);
}

.category-tile-count {
  margin-top: 4px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.category-tile-active {
  font-size: 20px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.category-tile-total {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

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
</style>
