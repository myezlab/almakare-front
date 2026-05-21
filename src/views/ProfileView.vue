<script setup>
import Picture from "@/components/Picture.vue"
import ProfileDocumentsTab from "@/components/profile/ProfileDocumentsTab.vue"
import ProfileDonneesPatientTab from "@/components/profile/ProfileDonneesPatientTab.vue"
import ProfilePlaceholderTab from "@/components/profile/ProfilePlaceholderTab.vue"
import ProfileQuestionnairesTab from "@/components/profile/ProfileQuestionnairesTab.vue"
import ProfileTraitementsTab from "@/components/profile/ProfileTraitementsTab.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountCircleOutline,
  mdiAccountOutline,
  mdiCalendarOutline,
  mdiClipboardListOutline,
  mdiCogOutline,
  mdiDotsVertical,
  mdiEmailOutline,
  mdiFolderOutline,
  mdiLogoutVariant,
  mdiPill,
} from "@mdi/js"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }

const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const router = useRouter()
const route = useRoute()

const currentUser = computed(() => selfStore.item || {})

const TABS = [
  { value: 'donnees-patient', label: 'Données patient', icon: mdiAccountOutline },
  { value: 'traitements', label: 'Traitements', icon: mdiPill },
  { value: 'documents', label: 'Documents', icon: mdiFolderOutline },
  { value: 'questionnaires', label: 'Questionnaires', icon: mdiClipboardListOutline },
]
const TAB_VALUES = TABS.map((t) => t.value)
const DEFAULT_TAB = 'donnees-patient'

const activeTab = ref(TAB_VALUES.includes(route.query.tab) ? route.query.tab : DEFAULT_TAB)

watch(
  () => route.query.tab,
  (val) => {
    const next = TAB_VALUES.includes(val) ? val : DEFAULT_TAB
    if (next !== activeTab.value) activeTab.value = next
  },
)

watch(activeTab, (val) => {
  const target = TAB_VALUES.includes(val) ? val : DEFAULT_TAB
  if ((route.query.tab || DEFAULT_TAB) === target) return
  router.replace({ query: { ...route.query, tab: target } })
})

const tabPlaceholders = {}

const dobDisplay = computed(() => {
  const d = currentUser.value?.dob
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d
  return ISOToShortenedDate(date)
})

const genderLabel = computed(() => GENDER_LABELS[currentUser.value?.gender] || '')

const fullName = computed(() => {
  const u = currentUser.value || {}
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Mon profil'
})

async function logOut() {
  try {
    selfStore.item = {}
    router.push({ name: "Home" })
  } catch (error) {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la déconnexion' })
  }
}
</script>

<template>
  <div>
    <v-row v-if="selfStore.item.id" justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Mon profil</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiAccountCircleOutline" size="18" class="mr-1" />
              Gérez vos informations personnelles et médicales
            </div>
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class="card-shadow pt-6 px-6 mb-4 position-relative"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn :icon="mdiDotsVertical" variant="text" size="small" v-bind="props" class="profile-menu-btn"
                aria-label="Menu" />
            </template>
            <v-list density="comfortable" min-width="200" class="card-shadow rounded-lg">
              <v-list-item :prepend-icon="mdiCogOutline" title="Paramètres"
                @click="router.push({ name: 'Settings' })" />
              <v-list-item :prepend-icon="mdiLogoutVariant" title="Se déconnecter" base-color="error"
                @click="logOut" />
            </v-list>
          </v-menu>
          <div class="d-flex flex-column align-center text-center">
            <Picture :docPath="`users/${selfStore.item.id}`" :storagePath="`users/${selfStore.item.id}`"
              v-model:source="selfStore.item.avatarUrl" pictureName="avatar" :size="96" for="avatar" :cover="true" />
            <div class="text-headline-small font-weight-bold mt-3">{{ fullName }}</div>

            <div class="d-flex flex-wrap justify-center ga-2 mt-4">
              <v-chip v-if="genderLabel" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiAccountOutline">
                {{ genderLabel }}
              </v-chip>
              <v-chip v-if="dobDisplay" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiCalendarOutline">
                Né(e) le {{ dobDisplay }}
              </v-chip>
              <v-chip v-if="currentUser.email" size="small" variant="flat" color="white" class="border-light"
                :prepend-icon="mdiEmailOutline">
                {{ currentUser.email }}
              </v-chip>
            </div>
          </div>

          <v-tabs v-if="!$vuetify.display.mobile" v-model="activeTab" color="primary" align-tabs="center"
            :show-arrows="false" class="mt-6 profile-tabs">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" class="text-none">
              {{ t.label }}
            </v-tab>
          </v-tabs>
          <v-chip-group v-else v-model="activeTab" mandatory class="mt-2 profile-chips" column>
            <v-chip v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" variant="flat"
              :class="{ 'bg-primary': activeTab === t.value, 'bg-white border-light': activeTab !== t.value }"
              class="text-none ">
              {{ t.label }}
            </v-chip>
          </v-chip-group>
        </v-card>

        <!-- =================== TAB CONTENT =================== -->
        <ProfileDonneesPatientTab v-if="activeTab === 'donnees-patient'" />
        <ProfileTraitementsTab v-else-if="activeTab === 'traitements'" />
        <ProfileQuestionnairesTab v-else-if="activeTab === 'questionnaires'" />
        <ProfileDocumentsTab v-else-if="activeTab === 'documents'" />
        <ProfilePlaceholderTab v-else-if="tabPlaceholders[activeTab]" :title="tabPlaceholders[activeTab].title"
          :subtitle="tabPlaceholders[activeTab].subtitle" :icon="tabPlaceholders[activeTab].icon" />

        <!-- Log Out -->
        <v-row justify="center">
          <v-btn color="error" variant="outlined" class="text-none mt-6 mb-16" @click="logOut" rounded="lg">
            Se déconnecter
          </v-btn>
        </v-row>

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">
        <!-- Profile completion skeleton -->
        <v-card class="mb-4 card-shadow pa-4 rounded-15" :class="{ 'mx-6': $vuetify.display.xs }">
          <v-skeleton-loader type="heading" class="mb-2" />
          <v-skeleton-loader type="text@2" />
        </v-card>

        <!-- General section skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <div class="d-flex justify-center mb-4">
            <v-skeleton-loader type="avatar" />
          </div>
          <v-row>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
          </v-row>
        </v-card>

        <!-- Medical section skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-row>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12" md="6"><v-skeleton-loader type="text" /></v-col>
            <v-col cols="12"><v-skeleton-loader type="text@2" /></v-col>
          </v-row>
        </v-card>

        <!-- Settings skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-skeleton-loader type="list-item@3" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>


<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.profile-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.profile-menu-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.profile-chips :deep(.v-slide-group__container) {
  overflow: visible;
  contain: none;
}

.profile-chips :deep(.v-slide-group__content) {
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  white-space: normal;
}
</style>
