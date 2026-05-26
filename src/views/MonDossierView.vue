<script setup>
import ActivitesTab from "@/components/monDossier/ActivitesTab.vue"
import DocumentsTab from "@/components/monDossier/DocumentsTab.vue"
import DonneesPatientTab from "@/components/monDossier/DonneesPatientTab.vue"
import PlaceholderTab from "@/components/monDossier/PlaceholderTab.vue"
import QuestionnairesTab from "@/components/monDossier/QuestionnairesTab.vue"
import TraitementsTab from "@/components/monDossier/TraitementsTab.vue"
import { ISOToShortenedDate } from "@/composables/useDates"
import { useSelfStore } from "@/stores/self"
import {
  mdiAccountOutline,
  mdiCalendarCheckOutline,
  mdiCalendarPlusOutline,
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
              <div class="text-headline-medium font-weight-bold">Mon dossier</div>
              <template v-if="medecinTraitantLabel">
                <div class="mt-1">
                  <a class="medecin-link text-title-medium font-weight-medium" @click="medecinDialogOpen = true">{{
                    medecinTraitantLabel }}</a>
                </div>
                <v-btn :prepend-icon="mdiCalendarPlusOutline" color="primary" variant="tonal" rounded="lg" size="small"
                  class="text-none mt-2" @click="router.push({ name: 'PrendreRendezVous' })">
                  Prendre rendez-vous
                </v-btn>
              </template>
            </div>
            <div v-if="!$vuetify.display.mobile" class="text-body-medium text-medium-emphasis mt-1">
              Gérez vos informations personnelles et médicales
            </div>
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class=" mb-4 px-6"
          :class="{ 'rounded-15 card-shadow ': !$vuetify.display.mobile, 'bg-transparent': $vuetify.display.mobile }"
          :flat="$vuetify.display.mobile">
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
        <ActivitesTab v-else-if="activeTab === 'activites'" />
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

    <!-- =================== MÉDECIN TRAITANT DETAILS DIALOG =================== -->
    <v-dialog v-model="medecinDialogOpen" max-width="560" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-title class="d-flex align-center pa-4">
          <span class="text-headline-small font-weight-bold">
            {{ medecinTraitant?.specialty ? ` ${medecinTraitant.specialty}` : '' }}
          </span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="text-title-medium font-weight-bold mb-3">Informations médecin partenaire</div>
          <v-row>
            <v-col cols="12" md="6">
              <div class="field-label">Prénom / Nom</div>
              <div class="field-value">
                {{ [medecinTraitant?.firstName, medecinTraitant?.lastName].filter(Boolean).join(' ') || '-' }}
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">Téléphone</div>
              <div class="field-value">{{ medecinTraitant?.phone || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">Email</div>
              <div class="field-value">{{ medecinTraitant?.email || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">Numéro Adeli</div>
              <div class="field-value">{{ medecinTraitant?.adeli || '-' }}</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="medecinDialogOpen = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.field-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.field-value {
  font-size: 0.95rem;
  font-weight: 500;
}

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
