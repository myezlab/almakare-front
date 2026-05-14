<script setup>
import doctorIllustration from '@/assets/illustrations/doctor.svg'
import teamIllustration from '@/assets/illustrations/team.svg'
import technicianIllustration from '@/assets/illustrations/technician.svg'
import Picture from '@/components/Picture.vue'
import {
  getPresetFor,
  PERMISSION_CATEGORIES,
  PERMISSIONS,
} from '@/data/permissions'
import { useRules } from '@/composables/useRules'
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
  mdiShieldKeyOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const router = useRouter()

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Médecin', icon: mdiDoctor, color: 'primary', illustration: doctorIllustration },
  { value: 'coordinator', label: 'Coordinateur', icon: mdiAccountGroupOutline, color: 'secondary', illustration: teamIllustration },
  { value: 'technician', label: 'Technicien', icon: mdiHeadset, color: 'info', illustration: technicianIllustration },
]

const roleByValue = computed(() =>
  Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r])),
)

const currentUser = computed(() => selfStore.item || {})

const currentRole = computed(() => currentUser.value.role || 'doctor')
const selectedRoleInfo = computed(() => roleByValue.value[currentRole.value] || ROLE_OPTIONS[0])

const generalFormRef = ref(null)
const savingGeneral = ref(false)
const permissionsDialog = ref(false)
const isEditing = ref(false)

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
  return getPresetFor(currentRole.value)
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
            <div class="hero-inner">
              <v-avatar :color="selectedRoleInfo.color" variant="tonal" size="96" class="hero-avatar mb-3">
                <v-img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" cover />
                <img v-else :src="selectedRoleInfo.illustration" :alt="selectedRoleInfo.label"
                  class="hero-avatar-img" />
              </v-avatar>
              <div class="text-headline-small font-weight-bold">{{ displayName }}</div>
              <div class="role-badge mt-3" :style="{ '--role-color': `rgb(var(--v-theme-${selectedRoleInfo.color}))` }">
                <img :src="selectedRoleInfo.illustration" :alt="selectedRoleInfo.label" class="role-badge-img" />
                <div class="role-badge-text">
                  <div class="role-badge-eyebrow">Rôle</div>
                  <div class="role-badge-label">{{ selectedRoleInfo.label }}</div>
                </div>
              </div>

              <div class="info-stack mt-4">
                <div v-if="currentUser.email" class="info-row">
                  <v-icon :icon="mdiEmailOutline" size="18" class="info-row-icon" />
                  <span>{{ currentUser.email }}</span>
                </div>
                <div v-if="currentUser.phoneNumber" class="info-row">
                  <v-icon :icon="mdiPhoneOutline" size="18" class="info-row-icon" />
                  <span>{{ currentUser.phoneNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- EDIT MODE -->
          <v-form v-else ref="generalFormRef">
            <div class="d-flex align-center mb-4">
              <span class="text-headline-small font-weight-bold">Modifier mon profil</span>
              <v-spacer />
              <v-btn variant="text" rounded="lg" size="small" class="text-none" @click="cancelEdit">
                Annuler
              </v-btn>
              <v-btn color="primary" rounded="lg" size="small" flat :loading="savingGeneral" class="ml-2"
                @click="handleSaveGeneral">
                Enregistrer
              </v-btn>
            </div>

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
                  rounded="lg" inputmode="tel" :prepend-inner-icon="mdiPhoneOutline"
                  :rules="[phoneNumberValidation]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card>

        <v-row>

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
                  Vos droits sont définis par le coordinateur de votre équipe. Contactez-le pour les modifier.
                </div>

                <div class="category-grid">
                  <div v-for="cat in PERMISSION_CATEGORIES" :key="cat.id" class="category-tile">
                    <div class="category-tile-label">{{ cat.label }}</div>
                    <div class="category-tile-count">
                      <span class="category-tile-active">{{ categoryActiveCount(cat.id) }}</span>
                      <span class="category-tile-total">/ {{ permissionsByCategory[cat.id].length }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="permissionsByCategory[cat.id].length ? (categoryActiveCount(cat.id) / permissionsByCategory[cat.id].length) * 100 : 0"
                      color="primary" rounded height="4" class="mt-2" />
                  </div>
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

    <!-- =================== PERMISSIONS DETAIL DIALOG (read-only) =================== -->
    <v-dialog v-model="permissionsDialog" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['permissions-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-6 pb-2">
          <v-row align="center" no-gutters>
            <v-col>
              <div class="text-headline-small font-weight-bold">Mes permissions</div>
              <div class="text-body-small text-medium-emphasis mt-1">
                {{ activeCount }} / {{ PERMISSIONS.length }} actives
                · Rôle {{ selectedRoleInfo.label.toLowerCase() }}
              </div>
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

            <div v-for="perm in permissionsByCategory[cat.id]" :key="perm.id" class="permission-item"
              :class="{ 'permission-item-inactive': !permissionsSet.has(perm.id) }">
              <div class="permission-item-text">
                <div class="permission-item-label">{{ perm.label }}</div>
                <div class="permission-item-desc">{{ perm.description }}</div>
              </div>
              <v-chip size="x-small" variant="tonal" :color="permissionsSet.has(perm.id) ? 'success' : 'grey-darken-1'"
                class="font-weight-medium">
                {{ permissionsSet.has(perm.id) ? 'Activée' : 'Désactivée' }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat class="text-none" @click="permissionsDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-avatar-img {
  height: 70%;
  width: 70%;
  object-fit: contain;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px 10px 12px;
  background: white;
  border: 1px solid color-mix(in srgb, var(--role-color) 25%, transparent);
  border-radius: 999px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--role-color) 18%, transparent);
}

.role-badge-img {
  height: 44px;
  width: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.role-badge-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.role-badge-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--role-color) 75%, black);
  opacity: 0.7;
}

.role-badge-label {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: color-mix(in srgb, var(--role-color) 80%, black);
  margin-top: 2px;
}

.info-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

.info-row-icon {
  opacity: 0.7;
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

.permissions-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.permissions-row:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.permissions-row:active {
  transform: scale(0.98);
}

.permissions-row-text {
  flex: 1;
  text-align: left;
}

.permissions-row-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.permissions-row-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
}

.permissions-scroll {
  max-height: 60vh;
}

.permissions-card {
  display: flex;
  flex-direction: column;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item-inactive .permission-item-label,
.permission-item-inactive .permission-item-desc {
  opacity: 0.55;
}

.permission-item-text {
  flex: 1;
  min-width: 0;
}

.permission-item-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.permission-item-desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
}
</style>
