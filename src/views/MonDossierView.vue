<script setup>
import DoctorDialog from "@/components/DoctorDialog.vue"
import ActivitesTab from "@/components/monDossier/ActivitesTab.vue"
import ChatTab from "@/components/monDossier/ChatTab.vue"
import DocumentsTab from "@/components/monDossier/DocumentsTab.vue"
import DonneesPatientTab from "@/components/monDossier/DonneesPatientTab.vue"
import QuestionnairesTab from "@/components/monDossier/QuestionnairesTab.vue"
import TraitementsTab from "@/components/monDossier/TraitementsTab.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useChatStore } from "@/stores/chat"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountOutline,
  mdiCalendarCheckOutline,
  mdiCalendarPlusOutline,
  mdiChatOutline,
  mdiClipboardListOutline,
  mdiFileMultipleOutline,
  mdiPill
} from "@mdi/js"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const GENDER_LABELS = { male: 'Homme', female: 'Femme', other: 'Autre' }

const selfStore = useSelfStore()
const chatStore = useChatStore()
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()

const currentUser = computed(() => selfStore.item || {})

const medecinTraitant = computed(() => currentUser.value?.medecinTraitant || null)
const medecinTraitantLabel = computed(() => {
  const d = medecinTraitant.value
  if (!d) return ''
  const name = [d.firstName, d.lastName].filter(Boolean).join(' ').trim()
  return name ? `Dr. ${name}` : ''
})

const medecinDialogOpen = ref(false)

const TABS = [
  { value: 'donnees-patient', label: 'Données patient', icon: mdiAccountOutline },
  { value: 'activites', label: 'Activités', icon: mdiCalendarCheckOutline },
  { value: 'traitements', label: 'Traitements', icon: mdiPill },
  { value: 'documents', label: 'Documents', icon: mdiFileMultipleOutline },
  { value: 'questionnaires', label: 'Questionnaires', icon: mdiClipboardListOutline },
  { value: 'chat', label: 'Chat', icon: mdiChatOutline },
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

// Mobile uses a "hub" grid: a section is open only when ?tab= is in the URL.
const mobileTabActive = computed(() => TAB_VALUES.includes(route.query.tab))
const activeTabMeta = computed(() => TABS.find((t) => t.value === activeTab.value))

// On mobile the Chat tab is a full-screen conversation (no section title, header
// under the app bar, composer pinned to the bottom).
const isMobileChat = computed(() => mobile.value && mobileTabActive.value && activeTab.value === 'chat')

function openTab(value) {
  activeTab.value = value
  if (route.query.tab !== value) router.replace({ query: { ...route.query, tab: value } })
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
    <!-- Mobile: full-screen chat, rendered outside the standard layout -->
    <ChatTab v-if="selfStore.item.id && isMobileChat" fullscreen />

    <v-row v-else-if="selfStore.item.id" justify="center" class="mt-8 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-2" align="center"
          :class="{ 'mx-6 ': $vuetify.display.mobile, 'mb-6': !$vuetify.display.mobile }">
          <v-col align-self="center">
            <!-- Desktop layout: inline -->
            <div v-if="!$vuetify.display.mobile"
              class="text-headline-medium font-weight-bold d-flex flex-wrap align-center">
              <span>Mon dossier</span>
              <template v-if="medecinTraitantLabel">
                <span class="mx-2 text-medium-emphasis">|</span>
                <a class="medecin-link" @click="medecinDialogOpen = true">{{ medecinTraitantLabel }}</a>
                <v-btn :prepend-icon="mdiCalendarPlusOutline" color="primary" variant="tonal" rounded="lg" size="small"
                  class="text-none ml-3" @click="router.push({ name: 'PrendreRendezVous' })">
                  Prendre rendez-vous
                </v-btn>
              </template>
            </div>
            <!-- Mobile layout: stacked -->
            <div v-else>
              <!-- Hub: full header -->
              <template v-if="!mobileTabActive">
                <div class="text-headline-medium font-weight-bold">Mon dossier</div>
                <template v-if="medecinTraitantLabel">
                  <div class="mt-1">
                    <a class="medecin-link text-title-medium font-weight-medium" @click="medecinDialogOpen = true">{{
                      medecinTraitantLabel }}</a>
                  </div>
                  <v-btn :prepend-icon="mdiCalendarPlusOutline" color="primary" variant="tonal" rounded="lg"
                    size="small" class="text-none mt-2" @click="router.push({ name: 'PrendreRendezVous' })">
                    Prendre rendez-vous
                  </v-btn>
                </template>
              </template>
              <!-- Section: title only (back lives in the app bar) -->
              <div v-else class="text-headline-medium font-weight-bold">{{ activeTabMeta?.label }}</div>
            </div>
            <div v-if="!$vuetify.display.mobile" class="text-body-medium text-medium-emphasis mt-1">
              Gérez vos informations personnelles et médicales
            </div>
          </v-col>
        </v-row>

        <!-- =================== DESKTOP TABS =================== -->
        <v-card v-if="!$vuetify.display.mobile" class="mb-4 px-6 rounded-15 card-shadow">
          <v-tabs v-model="activeTab" color="primary" :show-arrows="false">
            <v-tab v-for="t in TABS" :key="t.value" :value="t.value" :prepend-icon="t.icon" class="text-none">
              {{ t.label }}
              <v-badge v-if="t.value === 'chat' && chatStore.unreadCount" color="error" :content="chatStore.unreadCount"
                inline />
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- =================== MOBILE HUB GRID =================== -->
        <v-row v-else-if="!mobileTabActive" density="comfortable" class="mx-4 mt-4">
          <v-col v-for="t in TABS" :key="t.value" cols="6">
            <v-card
              class="rounded-15 card-shadow d-flex flex-column align-center justify-center text-center pa-5 fill-height"
              @click="openTab(t.value)">
              <v-badge :model-value="t.value === 'chat' && chatStore.unreadCount > 0" color="error"
                :content="chatStore.unreadCount" offset-x="4" offset-y="4" class="mb-3">
                <v-avatar color="primary" variant="tonal" size="56">
                  <v-icon :icon="t.icon" size="28" />
                </v-avatar>
              </v-badge>
              <div class="text-body-medium font-weight-medium">{{ t.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- =================== TAB CONTENT =================== -->
        <template v-if="!$vuetify.display.mobile || mobileTabActive">
          <DonneesPatientTab v-if="activeTab === 'donnees-patient'" />
          <ActivitesTab v-else-if="activeTab === 'activites'" />
          <TraitementsTab v-else-if="activeTab === 'traitements'" />
          <QuestionnairesTab v-else-if="activeTab === 'questionnaires'" />
          <DocumentsTab v-else-if="activeTab === 'documents'" />
          <ChatTab v-else-if="activeTab === 'chat'" />
        </template>

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

    <!-- =================== MÉDECIN TRAITANT DETAILS DIALOG =================== -->
    <DoctorDialog v-model="medecinDialogOpen" :doctor="medecinTraitant" :name="medecinTraitantLabel" />
  </div>
</template>


<style scoped>
.medecin-link {
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-decoration: none;
}

.medecin-link:hover {
  text-decoration: underline;
}
</style>
