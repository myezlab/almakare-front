<script setup>
import Picture from "@/components/Picture.vue"
import ProfileDocumentsTab from "@/components/profile/ProfileDocumentsTab.vue"
import ProfileDonneesPatientTab from "@/components/profile/ProfileDonneesPatientTab.vue"
import ProfilePlaceholderTab from "@/components/profile/ProfilePlaceholderTab.vue"
import ProfileQuestionnairesTab from "@/components/profile/ProfileQuestionnairesTab.vue"
import ProfileSyntheseTab from "@/components/profile/ProfileSyntheseTab.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountCircleOutline,
  mdiAccountOutline,
  mdiCalendarOutline,
  mdiClipboardListOutline,
  mdiEmailOutline,
  mdiFolderOutline,
  mdiPill,
  mdiPulse,
  mdiViewDashboardOutline,
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
  { value: 'synthese', label: 'Synthèse', icon: mdiViewDashboardOutline },
  { value: 'donnees-patient', label: 'Données patient', icon: mdiAccountOutline },
  { value: 'activites', label: 'Activités', icon: mdiPulse },
  { value: 'traitements', label: 'Traitements', icon: mdiPill },
  { value: 'documents', label: 'Documents', icon: mdiFolderOutline },
  { value: 'questionnaires', label: 'Questionnaires', icon: mdiClipboardListOutline },
]
const TAB_VALUES = TABS.map((t) => t.value)
const DEFAULT_TAB = 'synthese'

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

const tabPlaceholders = {
  'activites': {
    title: 'Activités',
    subtitle: 'Suivez l\'historique de vos activités et soins.',
    icon: mdiPulse,
  },
  'traitements': {
    title: 'Traitements',
    subtitle: 'Consultez vos traitements en cours et passés.',
    icon: mdiPill,
  },
}

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
        <v-card class="card-shadow pt-6 px-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
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

          <v-tabs v-model="activeTab" color="primary" align-tabs="center" :show-arrows="false"
            class="mt-6 profile-tabs">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" class="text-none">
              {{ t.label }}
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- =================== TAB CONTENT =================== -->
        <ProfileSyntheseTab v-if="activeTab === 'synthese'" />
        <ProfileDonneesPatientTab v-else-if="activeTab === 'donnees-patient'" />
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
</style>
