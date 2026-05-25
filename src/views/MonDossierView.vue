<script setup>
import DocumentsTab from "@/components/monDossier/DocumentsTab.vue"
import DonneesPatientTab from "@/components/monDossier/DonneesPatientTab.vue"
import PlaceholderTab from "@/components/monDossier/PlaceholderTab.vue"
import QuestionnairesTab from "@/components/monDossier/QuestionnairesTab.vue"
import TraitementsTab from "@/components/monDossier/TraitementsTab.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountOutline,
  mdiClipboardListOutline,
  mdiEmailOutline,
  mdiFileMultipleOutline,
  mdiPill
} from "@mdi/js"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }

const selfStore = useSelfStore()
const router = useRouter()
const route = useRoute()

const currentUser = computed(() => selfStore.item || {})

const TABS = [
  { value: 'donnees-patient', label: 'Données patient', icon: mdiAccountOutline },
  { value: 'traitements', label: 'Traitements', icon: mdiPill },
  { value: 'documents', label: 'Documents', icon: mdiFileMultipleOutline },
  { value: 'questionnaires', label: 'Questionnaires', icon: mdiClipboardListOutline },
  { value: 'messagerie', label: 'Messagerie', icon: mdiEmailOutline },
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

const tabPlaceholders = {
  messagerie: {
    title: 'Messagerie',
    subtitle: 'Échangez avec votre praticien en toute sécurité.',
    icon: mdiEmailOutline,
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

</script>

<template>
  <div>
    <v-row v-if="selfStore.item.id" justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Mon dossier</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              Gérez vos informations personnelles et médicales
            </div>
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class="card-shadow mb-4 px-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-tabs v-if="!$vuetify.display.mobile" v-model="activeTab" color="primary" :show-arrows="false">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" class="text-none">
              {{ t.label }}
            </v-tab>
          </v-tabs>
          <v-chip-group v-else v-model="activeTab" mandatory class="mt-2 profile-chips" column>
            <v-chip v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" variant="flat"
              :class="{ 'bg-primary': activeTab === t.value, 'bg-white border-light': activeTab !== t.value }"
              class="text-none px-4">
              {{ t.label }}
            </v-chip>
          </v-chip-group>
        </v-card>

        <!-- =================== TAB CONTENT =================== -->
        <DonneesPatientTab v-if="activeTab === 'donnees-patient'" />
        <TraitementsTab v-else-if="activeTab === 'traitements'" />
        <QuestionnairesTab v-else-if="activeTab === 'questionnaires'" />
        <DocumentsTab v-else-if="activeTab === 'documents'" />
        <PlaceholderTab v-else-if="tabPlaceholders[activeTab]" :title="tabPlaceholders[activeTab].title"
          :subtitle="tabPlaceholders[activeTab].subtitle" :icon="tabPlaceholders[activeTab].icon" />

      </v-col>
    </v-row>
    <v-row v-else justify="center" class="mb-16 pb-10 pt-6">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">
        <!--  completion skeleton -->
        <v-card class="mb-4 card-shadow pa-4 rounded-15" :class="{ 'mx-6': $vuetify.display.xs }">
          <v-skeleton-loader type="heading" class="mb-2" />
          <v-skeleton-loader type="text@2" />
        </v-card>

        <!-- General section skeleton -->
        <v-card class="mb-4 card-shadow pa-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-skeleton-loader type="heading" class="mb-4" />
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
.profile-chips :deep(.v-slide-group__container) {
  overflow: visible;
  contain: none;
}

.profile-chips :deep(.v-slide-group__content) {
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  white-space: normal;
}
</style>
