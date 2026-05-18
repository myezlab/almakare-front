<script setup>
import DateFieldFr from '@/components/DateFieldFr.vue'
import DialogLogs from '@/components/DialogLogs.vue'
import Picture from '@/components/Picture.vue'
import { useCurrency } from '@/composables/useCurrency'
import { ISOToDDMMYYYY } from '@/composables/useDates'
import { LOG_ACTIONS } from '@/data/logs'
import {
  ACTE_COLORS,
  ACTE_ICON,
  ALMAKARE_FREE_SERVICES,
  ALMAKARE_INVOICES_SEED,
  ALMAKARE_SERVICES,
  BILLING_TYPES,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  MACHINE_TYPES,
  ORGANISATION_DASHBOARD_ICON,
  ORGANISATION_FIELDS,
} from '@/data/organisation'
import { useLogsStore } from '@/stores/logs'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { useSelfStore } from '@/stores/self'
import TeamView from '@/views/TeamView.vue'
import {
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiCalendarOutline,
  mdiCheckCircleOutline,
  mdiClockOutline,
  mdiClose,
  mdiCurrencyEur,
  mdiDomain,
  mdiDownloadOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiFileDocumentOutline,
  mdiFolderOutline,
  mdiGiftOutline,
  mdiInformationOutline,
  mdiMapMarkerOutline,
  mdiOfficeBuildingOutline,
  mdiPencilOutline,
  mdiPlus,
  mdiReceiptTextOutline,
  mdiShieldCheckOutline,
  mdiTrashCanOutline
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const variantConfig = {
  defaultTitle: 'Organisation',
  subtitle: 'Espace de gestion de l\'organisation',
  editTitle: 'Modifier l\'organisation',
  editAriaLabel: 'Modifier les détails de l\'organisation',
  successMessage: 'Organisation mise à jour',
  logCollection: 'organisationLogs',
  logsTitle: 'Historique de l\'organisation',
  avatarIcon: mdiOfficeBuildingOutline,
  services: ALMAKARE_SERVICES,
  pictureFor: 'organisation-logo',
  pictureDocPath: 'organisations/main',
  pictureStoragePath: 'organisations/main',
  logoLabel: 'Logo de l\'organisation',
  nameLabel: 'Nom de l\'organisation',
  servicesHint: 'Activez ou désactivez les modules utilisés par votre organisation.',
  allActivatedHint: 'Tous les services Almakare sont activés pour votre organisation.',
  partnersHint: 'Offert par Almakare SAS à toutes les organisations partenaires.',
}

const organisationStore = useOrganisationStore()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const logsStore = useLogsStore()
const { formatCurrency } = useCurrency()
const route = useRoute()
const router = useRouter()

const organisation = computed(() => organisationStore.item || {})
const establishments = computed(() => organisation.value.establishments || [])

const editing = ref(false)
const saving = ref(false)
const formRef = ref(null)

const TABS = ['etablissements', 'equipe', 'actes', 'services']
const DEFAULT_TAB = 'etablissements'

const activeTab = ref(TABS.includes(route.query.tab) ? route.query.tab : DEFAULT_TAB)

watch(
  () => route.query.tab,
  (val) => {
    const next = TABS.includes(val) ? val : DEFAULT_TAB
    if (next !== activeTab.value) activeTab.value = next
  },
)

watch(activeTab, (val) => {
  const target = TABS.includes(val) ? val : DEFAULT_TAB
  if ((route.query.tab || DEFAULT_TAB) === target) return
  router.replace({ query: { ...route.query, tab: target } })
})

const draft = ref({
  logoUrl: '',
  name: '',
  description: '',
  createdAt: '',
})

function hydrateDraft() {
  draft.value = {
    logoUrl: organisation.value.logoUrl || '',
    name: organisation.value.name || '',
    description: organisation.value.description || '',
    createdAt: organisation.value.createdAt || '',
  }
}

watch(organisation, (val) => {
  if (val?.id) hydrateDraft()
}, { immediate: true })

function startEdit() {
  hydrateDraft()
  editing.value = true
}

function cancelEdit() {
  hydrateDraft()
  editing.value = false
}

const required = (v) => !!String(v ?? '').trim() || 'Ce champ est requis'

const draftDirty = computed(() => {
  const o = organisation.value
  return (
    (draft.value.logoUrl || '') !== (o.logoUrl || '') ||
    (draft.value.name || '').trim() !== (o.name || '') ||
    (draft.value.description || '').trim() !== (o.description || '') ||
    (draft.value.createdAt || '') !== (o.createdAt || '')
  )
})

function logOrganisation(payload) {
  logsStore.add(variantConfig.logCollection, {
    adminId: selfStore.item?.id,
    adminFullName: selfStore.item?.fullName,
    ...payload,
  })
}

async function saveDetails() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const previous = organisation.value
    const patch = {
      logoUrl: draft.value.logoUrl || '',
      name: draft.value.name.trim(),
      description: draft.value.description.trim(),
      createdAt: draft.value.createdAt,
    }
    const changes = []
    if (previous.name !== patch.name) {
      changes.push({ field: ORGANISATION_FIELDS.NAME, from: previous.name, to: patch.name })
    }
    if (previous.description !== patch.description) {
      changes.push({ field: ORGANISATION_FIELDS.DESCRIPTION, from: previous.description, to: patch.description })
    }
    if (previous.createdAt !== patch.createdAt) {
      changes.push({ field: ORGANISATION_FIELDS.CREATED_AT, from: previous.createdAt, to: patch.createdAt })
    }
    if ((previous.logoUrl || '') !== (patch.logoUrl || '')) {
      changes.push({ field: ORGANISATION_FIELDS.LOGO, from: previous.logoUrl ? 'défini' : 'aucun', to: patch.logoUrl ? 'défini' : 'aucun' })
    }
    organisationStore.update(patch)
    if (changes.length) {
      logOrganisation({ type: 'info', action: LOG_ACTIONS.ORGANISATION_UPDATED, changes })
    }
    messagesStore.add({ type: 'success', text: variantConfig.successMessage })
    editing.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour' })
  } finally {
    saving.value = false
  }
}

const selectedSet = computed(() => new Set(organisation.value.selectedServiceIds || []))

const selectedServices = computed(() =>
  variantConfig.services.filter((s) => selectedSet.value.has(s.id)),
)
const availableServices = computed(() =>
  variantConfig.services.filter((s) => !selectedSet.value.has(s.id)),
)

const monthlyTotal = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + s.price, 0),
)
const annualTotal = computed(() => monthlyTotal.value * 12)

function toggleService(service) {
  const current = new Set(organisation.value.selectedServiceIds || [])
  const isActive = current.has(service.id)
  if (isActive) {
    current.delete(service.id)
    logOrganisation({
      type: 'warning',
      action: LOG_ACTIONS.ORGANISATION_SERVICE_REMOVED,
      params: { name: service.name },
    })
    messagesStore.add({ type: 'success', text: `Service "${service.name}" désactivé` })
  } else {
    current.add(service.id)
    logOrganisation({
      type: 'success',
      action: LOG_ACTIONS.ORGANISATION_SERVICE_ADDED,
      params: { name: service.name },
    })
    messagesStore.add({ type: 'success', text: `Service "${service.name}" activé` })
  }
  organisationStore.update({ selectedServiceIds: [...current] })
}

const formattedCreatedAt = computed(() => ISOToDDMMYYYY(organisation.value.createdAt))

const serviceDialog = ref(false)
const selectedService = ref(null)
const selectedServiceIsFree = ref(false)

const selectedServiceActive = computed(() => {
  if (!selectedService.value || selectedServiceIsFree.value) return false
  return selectedSet.value.has(selectedService.value.id)
})

function openServiceDetails(service, { free = false } = {}) {
  selectedService.value = service
  selectedServiceIsFree.value = free
  serviceDialog.value = true
}

function handleDialogToggle() {
  if (!selectedService.value || selectedServiceIsFree.value) return
  toggleService(selectedService.value)
  serviceDialog.value = false
}

const invoicesDialog = ref(false)
const invoices = computed(() => [...ALMAKARE_INVOICES_SEED])

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function formatPeriod(period) {
  if (!period) return ''
  const [year, month] = period.split('-')
  const idx = Number(month) - 1
  return `${MONTH_LABELS[idx] || ''} ${year}`
}

const STATUS_META = {
  [INVOICE_STATUS.PAID]: { color: 'success', icon: mdiCheckCircleOutline },
  [INVOICE_STATUS.PENDING]: { color: 'warning', icon: mdiClockOutline },
  [INVOICE_STATUS.OVERDUE]: { color: 'error', icon: mdiAlertCircleOutline },
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META[INVOICE_STATUS.PENDING]
}

const totalPaid = computed(() =>
  invoices.value
    .filter((i) => i.status === INVOICE_STATUS.PAID)
    .reduce((sum, i) => sum + i.amount, 0),
)
const totalOutstanding = computed(() =>
  invoices.value
    .filter((i) => i.status !== INVOICE_STATUS.PAID)
    .reduce((sum, i) => sum + i.amount, 0),
)

function downloadInvoice(invoice) {
  messagesStore.add({ type: 'success', text: `Téléchargement de la facture ${invoice.number}` })
}

const establishmentDialog = ref(false)
const establishmentSaving = ref(false)
const establishmentFormRef = ref(null)
const establishmentDraft = ref({
  logoUrl: '',
  name: '',
  location: '',
})

function openEstablishmentDialog() {
  establishmentDraft.value = { logoUrl: '', name: '', location: '' }
  establishmentDialog.value = true
}

async function saveEstablishment() {
  const { valid } = await establishmentFormRef.value.validate()
  if (!valid) return
  establishmentSaving.value = true
  try {
    const created = organisationStore.addEstablishment({
      name: establishmentDraft.value.name.trim(),
      location: establishmentDraft.value.location.trim(),
      logoUrl: establishmentDraft.value.logoUrl || '',
    })
    logOrganisation({
      type: 'success',
      action: LOG_ACTIONS.ESTABLISHMENT_CREATED,
      params: { name: created.name },
    })
    messagesStore.add({ type: 'success', text: `Établissement "${created.name}" créé` })
    establishmentDialog.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la création de l\'établissement' })
  } finally {
    establishmentSaving.value = false
  }
}

function openEstablishment(establishment) {
  router.push({ name: 'Establishment', params: { id: establishment.id } })
}

// =========== ACTES ============

const actes = computed(() => {
  const list = [...(organisation.value.actes || [])]
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return list
})

const MACHINE_TYPE_LABEL = computed(() =>
  Object.fromEntries(MACHINE_TYPES.map((m) => [m.value, m.label])),
)
const BILLING_TYPE_LABEL = computed(() =>
  Object.fromEntries(BILLING_TYPES.map((b) => [b.value, b.label])),
)

function defaultActeDraft() {
  return {
    id: null,
    label: '',
    internalCode: '',
    externalCode: '',
    visibleOnOnlineAgenda: false,
    sendPlanningEmail: false,
    price: 0,
    agendaColor: ACTE_COLORS[0],
    billingType: 'hourly',
    billableByDoctor: true,
    machineTypes: [],
    billAssociatedGhs: false,
    linkedActeId: '',
    concurrentAppointments: 1,
    averageDurationMinutes: 0,
    visible: true,
    order: (organisation.value.actes?.length || 0) + 1,
    specificDirectory: '',
  }
}

const acteDialog = ref(false)
const acteSaving = ref(false)
const acteFormRef = ref(null)
const acteDraft = ref(defaultActeDraft())
const editingActeId = ref(null)

const linkedActeOptions = computed(() =>
  actes.value.filter((a) => a.id !== editingActeId.value),
)

function openCreateActeDialog() {
  editingActeId.value = null
  acteDraft.value = defaultActeDraft()
  acteDialog.value = true
}

function openEditActeDialog(acte) {
  editingActeId.value = acte.id
  acteDraft.value = {
    id: acte.id,
    label: acte.label || '',
    internalCode: acte.internalCode || '',
    externalCode: acte.externalCode || '',
    visibleOnOnlineAgenda: !!acte.visibleOnOnlineAgenda,
    sendPlanningEmail: !!acte.sendPlanningEmail,
    price: Number(acte.price) || 0,
    agendaColor: acte.agendaColor || ACTE_COLORS[0],
    billingType: acte.billingType || 'hourly',
    billableByDoctor: !!acte.billableByDoctor,
    machineTypes: Array.isArray(acte.machineTypes) ? [...acte.machineTypes] : [],
    billAssociatedGhs: !!acte.billAssociatedGhs,
    linkedActeId: acte.linkedActeId || '',
    concurrentAppointments: Number(acte.concurrentAppointments) || 1,
    averageDurationMinutes: Number(acte.averageDurationMinutes) || 0,
    visible: acte.visible !== undefined ? !!acte.visible : true,
    order: Number(acte.order) || 1,
    specificDirectory: acte.specificDirectory || '',
  }
  acteDialog.value = true
}

const nonNegativeNumber = (v) => {
  const n = Number(v)
  return (!Number.isNaN(n) && n >= 0) || 'Valeur invalide'
}
const positiveInteger = (v) => {
  const n = Number(v)
  return (Number.isInteger(n) && n >= 1) || 'Valeur invalide'
}

async function saveActe() {
  const { valid } = await acteFormRef.value.validate()
  if (!valid) return
  acteSaving.value = true
  try {
    const payload = {
      label: acteDraft.value.label.trim(),
      internalCode: acteDraft.value.internalCode.trim(),
      externalCode: acteDraft.value.externalCode.trim(),
      visibleOnOnlineAgenda: acteDraft.value.visibleOnOnlineAgenda,
      sendPlanningEmail: acteDraft.value.sendPlanningEmail,
      price: Number(acteDraft.value.price) || 0,
      agendaColor: acteDraft.value.agendaColor,
      billingType: acteDraft.value.billingType,
      billableByDoctor: acteDraft.value.billableByDoctor,
      machineTypes: [...acteDraft.value.machineTypes],
      billAssociatedGhs: acteDraft.value.billAssociatedGhs,
      linkedActeId: acteDraft.value.linkedActeId || '',
      concurrentAppointments: Number(acteDraft.value.concurrentAppointments) || 1,
      averageDurationMinutes: Number(acteDraft.value.averageDurationMinutes) || 0,
      visible: acteDraft.value.visible,
      order: Number(acteDraft.value.order) || 1,
      specificDirectory: acteDraft.value.specificDirectory.trim(),
    }
    if (editingActeId.value) {
      organisationStore.updateActe(editingActeId.value, payload)
      logOrganisation({
        type: 'info',
        action: LOG_ACTIONS.ACTE_UPDATED,
        params: { name: payload.label },
      })
      messagesStore.add({ type: 'success', text: `Acte "${payload.label}" mis à jour` })
    } else {
      const created = organisationStore.addActe(payload)
      logOrganisation({
        type: 'success',
        action: LOG_ACTIONS.ACTE_CREATED,
        params: { name: created.label },
      })
      messagesStore.add({ type: 'success', text: `Acte "${created.label}" créé` })
    }
    acteDialog.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de l\'enregistrement de l\'acte' })
  } finally {
    acteSaving.value = false
  }
}

const acteDeleteDialog = ref(false)
const acteToDelete = ref(null)
const acteDeleting = ref(false)

function askDeleteActe(acte) {
  acteToDelete.value = acte
  acteDeleteDialog.value = true
}

async function confirmDeleteActe() {
  if (!acteToDelete.value) return
  acteDeleting.value = true
  try {
    const target = acteToDelete.value
    organisationStore.removeActe(target.id)
    logOrganisation({
      type: 'warning',
      action: LOG_ACTIONS.ACTE_REMOVED,
      params: { name: target.label },
    })
    messagesStore.add({ type: 'success', text: `Acte "${target.label}" supprimé` })
    acteDeleteDialog.value = false
    acteToDelete.value = null
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la suppression' })
  } finally {
    acteDeleting.value = false
  }
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">{{ organisation.name || variantConfig.defaultTitle }}
            </div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="ORGANISATION_DASHBOARD_ICON" size="18" class="mr-1" />
              {{ variantConfig.subtitle }}
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <DialogLogs :collectionName="variantConfig.logCollection" :title="variantConfig.logsTitle" />
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class="card-shadow pt-6 px-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <!-- VIEW MODE -->
          <div v-if="!editing">
            <div class="d-flex justify-end">
              <v-btn :icon="mdiPencilOutline" variant="text" size="small" color="primary" @click="startEdit"
                :aria-label="variantConfig.editAriaLabel" />
            </div>

            <div class="d-flex flex-column align-center text-center">
              <v-avatar color="primary" variant="tonal" size="96" class="mb-3" rounded="15">
                <v-img v-if="organisation.logoUrl" :src="organisation.logoUrl" />
                <v-icon v-else :icon="variantConfig.avatarIcon" size="48" />
              </v-avatar>
              <div class="text-headline-small font-weight-bold">{{ organisation.name }}</div>
              <div class="text-body-medium text-medium-emphasis mt-3 organisation-description">
                {{ organisation.description }}
              </div>

              <div class="d-flex flex-wrap justify-center ga-2 mt-4">
                <v-chip size="small" variant="flat" color="white" class="border-light"
                  :prepend-icon="mdiCalendarOutline">
                  Créé le {{ formattedCreatedAt }}
                </v-chip>
                <v-chip size="small" variant="flat" color="white" class="border-light"
                  :prepend-icon="mdiShieldCheckOutline">
                  Almakare SAS
                </v-chip>
              </div>
            </div>

            <v-tabs v-model="activeTab" color="primary" align-tabs="center" class="mt-6 organisation-tabs">
              <v-tab value="etablissements" class="text-none">Établissements</v-tab>
              <v-tab value="equipe" class="text-none">Équipe</v-tab>
              <v-tab value="actes" class="text-none">Actes</v-tab>
              <v-tab value="services" class="text-none">Services</v-tab>
            </v-tabs>
          </div>

          <!-- EDIT MODE -->
          <v-form v-else ref="formRef">
            <div class="d-flex align-center mb-4">
              <div class="text-headline-small font-weight-bold flex-grow-1">{{ variantConfig.editTitle }}</div>
              <v-btn :icon="mdiClose" variant="text" size="small" :disabled="saving" @click="cancelEdit"
                aria-label="Fermer l'édition" />
            </div>

            <v-row>
              <v-col cols="12" class="d-flex flex-column align-center">
                <Picture :docPath="variantConfig.pictureDocPath" :storagePath="variantConfig.pictureStoragePath"
                  v-model:source="draft.logoUrl" pictureName="logo" :size="100" :for="variantConfig.pictureFor"
                  :cover="false" />
                <div class="text-body-small text-medium-emphasis mt-2">{{ variantConfig.logoLabel }}</div>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="draft.name" :label="variantConfig.nameLabel" variant="outlined" rounded="lg"
                  density="comfortable" :rules="[required]" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="draft.description" label="Description" variant="outlined" rounded="lg" rows="4"
                  auto-grow :rules="[required]" />
              </v-col>

              <v-col cols="12" md="6">
                <DateFieldFr v-model="draft.createdAt" label="Date de création" :rules="[required]" />
              </v-col>
            </v-row>

            <div v-if="draftDirty" class="d-flex justify-end ga-2 mt-2">
              <v-btn variant="text" rounded="lg" class="text-none" :disabled="saving" @click="cancelEdit">
                Annuler
              </v-btn>
              <v-btn color="primary" rounded="lg" flat class="text-none" :loading="saving" @click="saveDetails">
                Enregistrer
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <!-- =================== ETABLISSEMENTS TAB =================== -->
        <v-row v-if="activeTab === 'etablissements'">
          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex align-center mb-4">
                <div>
                  <div class="text-headline-small font-weight-bold">Établissements</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    Les établissements rattachés à votre organisation.
                  </div>
                </div>
                <v-spacer />
                <v-btn v-if="establishments.length > 0" color="primary" rounded="lg" flat class="text-none"
                  :prepend-icon="mdiPlus" @click="openEstablishmentDialog">
                  Ajouter
                </v-btn>
              </div>

              <div v-if="establishments.length === 0"
                class="d-flex flex-column align-center text-center pa-8 establishment-empty">
                <div class="establishment-empty-icon mb-3">
                  <v-icon :icon="mdiDomain" size="40" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun établissement</div>
                <div class="text-body-small text-medium-emphasis mb-4">
                  Créez votre premier établissement pour démarrer.
                </div>
                <v-btn color="primary" rounded="lg" flat class="text-none" :prepend-icon="mdiPlus"
                  @click="openEstablishmentDialog">
                  Créer un établissement
                </v-btn>
              </div>

              <div v-else class="establishment-grid">
                <div v-for="e in establishments" :key="e.id" class="establishment-card" @click="openEstablishment(e)">
                  <v-avatar color="primary" variant="tonal" size="56" rounded="12" class="flex-shrink-0">
                    <v-img v-if="e.logoUrl" :src="e.logoUrl" />
                    <v-icon v-else :icon="mdiDomain" size="28" />
                  </v-avatar>
                  <div class="establishment-card-body">
                    <div class="establishment-card-title">{{ e.name }}</div>
                    <div class="establishment-card-location">
                      <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" />
                      {{ e.location || '—' }}
                    </div>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- =================== ÉQUIPE TAB =================== -->
        <div v-if="activeTab === 'equipe'" class="organisation-team-tab">
          <TeamView />
        </div>

        <!-- =================== ACTES TAB =================== -->
        <v-row v-if="activeTab === 'actes'">
          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex align-center mb-4">
                <div>
                  <div class="text-headline-small font-weight-bold">Actes</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    Procédures préenregistrées sélectionnables lors de la programmation d'un rendez-vous.
                  </div>
                </div>
                <v-spacer />
                <v-btn v-if="actes.length > 0" color="primary" rounded="lg" flat class="text-none"
                  :prepend-icon="mdiPlus" @click="openCreateActeDialog">
                  Créer un acte
                </v-btn>
              </div>

              <div v-if="actes.length === 0" class="d-flex flex-column align-center text-center pa-8 acte-empty">
                <div class="acte-empty-icon mb-3">
                  <v-icon :icon="ACTE_ICON" size="40" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun acte</div>
                <div class="text-body-small text-medium-emphasis mb-4">
                  Créez votre premier acte pour le rendre disponible lors d'un rendez-vous.
                </div>
                <v-btn color="primary" rounded="lg" flat class="text-none" :prepend-icon="mdiPlus"
                  @click="openCreateActeDialog">
                  Créer un acte
                </v-btn>
              </div>

              <div v-else class="acte-grid">
                <div v-for="a in actes" :key="a.id" class="acte-card" @click="openEditActeDialog(a)">
                  <div class="acte-card-head">
                    <span class="acte-color-dot" :style="{ backgroundColor: a.agendaColor }" />
                    <div class="acte-card-title-wrap">
                      <div class="acte-card-title">
                        {{ a.label }}
                        <v-icon v-if="!a.visible" :icon="mdiEyeOffOutline" size="14"
                          class="ml-1 text-medium-emphasis" />
                      </div>
                      <div class="acte-card-codes">
                        <span v-if="a.internalCode" class="acte-code">{{ a.internalCode }}</span>
                        <span v-if="a.externalCode" class="acte-code acte-code-ext">{{ a.externalCode }}</span>
                      </div>
                    </div>
                    <v-btn :icon="mdiTrashCanOutline" variant="text" size="small" color="error" class="flex-shrink-0"
                      @click.stop="askDeleteActe(a)" aria-label="Supprimer l'acte" />
                  </div>

                  <div class="acte-card-meta">
                    <div class="acte-meta-item">
                      <v-icon :icon="mdiCurrencyEur" size="14" class="mr-1" />
                      {{ formatCurrency(a.price) }}
                      <span class="text-medium-emphasis ml-1">
                        · {{ BILLING_TYPE_LABEL[a.billingType] || a.billingType }}
                      </span>
                    </div>
                    <div class="acte-meta-item">
                      <v-icon :icon="mdiClockOutline" size="14" class="mr-1" />
                      {{ a.averageDurationMinutes || 0 }} min
                      <span class="text-medium-emphasis ml-1">· × {{ a.concurrentAppointments || 1 }}</span>
                    </div>
                    <div v-if="a.machineTypes?.length" class="acte-machine-chips">
                      <v-chip v-for="t in a.machineTypes" :key="t" size="x-small" variant="tonal" color="primary"
                        class="font-weight-bold">
                        {{ MACHINE_TYPE_LABEL[t] || t }}
                      </v-chip>
                    </div>
                  </div>

                  <div class="acte-card-footer">
                    <v-chip v-if="a.visibleOnOnlineAgenda" size="x-small" variant="tonal" color="primary"
                      :prepend-icon="mdiEyeOutline" class="font-weight-bold">
                      Agenda en ligne
                    </v-chip>
                    <v-chip v-if="a.billableByDoctor" size="x-small" variant="tonal" color="success"
                      class="font-weight-bold">
                      Facturable médecin
                    </v-chip>
                    <v-chip v-if="a.billAssociatedGhs" size="x-small" variant="tonal" color="info"
                      class="font-weight-bold">
                      GHS associé
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="activeTab === 'services'">
          <!-- =================== MONTHLY PAYMENT SUMMARY =================== -->
          <v-col cols="12" md="4">
            <v-card class="card-shadow pa-6 payment-card sticky-card"
              :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="text-title-small text-uppercase font-weight-bold text-medium-emphasis mb-2">
                Abonnement mensuel
              </div>
              <div class="payment-amount">
                {{ formatCurrency(monthlyTotal) }}
                <span class="payment-period">/ mois</span>
              </div>
              <div class="text-body-small text-medium-emphasis mb-4">
                Soit {{ formatCurrency(annualTotal) }} par an, hors taxes.
              </div>

              <v-divider class="my-3" />

              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-body-small text-medium-emphasis">Services actifs</span>
                <span class="text-body-medium font-weight-bold">{{ selectedServices.length }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-small text-medium-emphasis">Services disponibles</span>
                <span class="text-body-medium font-weight-bold">{{ availableServices.length }}</span>
              </div>

              <div v-if="selectedServices.length > 0" class="mt-4">
                <div class="text-body-small text-medium-emphasis mb-2">Répartition</div>
                <div v-for="s in selectedServices" :key="s.id" class="payment-line">
                  <span class="payment-line-name text-truncate">{{ s.name }}</span>
                  <span class="payment-line-price">{{ formatCurrency(s.price) }}</span>
                </div>
              </div>

              <div v-else class="d-flex align-center text-body-small text-medium-emphasis mt-4">
                <v-icon :icon="mdiInformationOutline" size="16" class="mr-1" />
                Aucun service activé — sélectionnez-en pour démarrer.
              </div>

              <div class="payment-footer">
                <v-icon :icon="mdiShieldCheckOutline" size="14" class="mr-1" />
                Facturation par Almakare SAS
              </div>

              <v-btn variant="tonal" color="primary" rounded="lg" size="small" block class="text-none mt-3"
                :prepend-icon="mdiReceiptTextOutline" @click="invoicesDialog = true">
                Voir les dernières factures
              </v-btn>
            </v-card>
          </v-col>

          <!-- =================== SERVICES (selected + available) =================== -->
          <v-col cols="12" md="8">
            <v-card class="card-shadow pa-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex align-center mb-4">
                <div>
                  <div class="text-headline-small font-weight-bold">Services Almakare</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    {{ variantConfig.servicesHint }}
                  </div>
                </div>
                <v-spacer />
                <v-chip size="small" variant="tonal" color="primary" :prepend-icon="mdiCheckCircleOutline"
                  class="font-weight-bold">
                  {{ selectedServices.length }} / {{ variantConfig.services.length }}
                </v-chip>
              </div>

              <!-- ACTIVE -->
              <div class="text-title-small text-medium-emphasis text-uppercase font-weight-bold mb-2">
                Services utilisés
              </div>
              <div v-if="selectedServices.length === 0"
                class="text-body-small text-medium-emphasis pa-4 text-center service-empty">
                Aucun service actif pour le moment.
              </div>
              <div class="service-grid mb-5">
                <div v-for="s in selectedServices" :key="s.id" class="service-card service-card-active"
                  @click="openServiceDetails(s)">
                  <div class="service-card-head">
                    <div class="service-icon service-icon-active">
                      <v-icon :icon="s.icon" size="22" />
                    </div>
                    <div class="service-card-title-wrap">
                      <div class="service-card-title">{{ s.name }}</div>
                      <div class="service-card-price">{{ formatCurrency(s.price) }} <span>/ mois</span></div>
                    </div>
                  </div>
                  <div class="service-card-desc">{{ s.description }}</div>
                  <v-btn variant="text" color="error" rounded="lg" size="small" class="text-none mt-2"
                    @click.stop="toggleService(s)">
                    Désactiver
                  </v-btn>
                </div>
              </div>

              <v-divider class="my-2" />

              <!-- AVAILABLE -->
              <div class="text-title-small text-medium-emphasis text-uppercase font-weight-bold mt-4 mb-2">
                Services disponibles
              </div>
              <div v-if="availableServices.length === 0"
                class="text-body-small text-medium-emphasis pa-4 text-center service-empty">
                {{ variantConfig.allActivatedHint }}
              </div>
              <div class="service-grid">
                <div v-for="s in availableServices" :key="s.id" class="service-card service-card-inactive"
                  @click="openServiceDetails(s)">
                  <div class="service-card-head">
                    <div class="service-icon service-icon-inactive">
                      <v-icon :icon="s.icon" size="22" />
                    </div>
                    <div class="service-card-title-wrap">
                      <div class="service-card-title">{{ s.name }}</div>
                      <div class="service-card-price service-card-price-muted">
                        {{ formatCurrency(s.price) }} <span>/ mois</span>
                      </div>
                    </div>
                  </div>
                  <div class="service-card-desc">{{ s.description }}</div>
                  <v-btn variant="tonal" color="primary" rounded="lg" size="small" class="text-none mt-2"
                    @click.stop="toggleService(s)">
                    Activer
                  </v-btn>
                </div>
              </div>
            </v-card>

            <!-- =================== FREE SERVICES =================== -->
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex align-center mb-4">
                <div>
                  <div class="text-headline-small font-weight-bold">Inclus gratuitement</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    {{ variantConfig.partnersHint }}
                  </div>
                </div>
                <v-spacer />
                <v-chip size="small" variant="tonal" color="success" :prepend-icon="mdiGiftOutline"
                  class="font-weight-bold">
                  Gratuit
                </v-chip>
              </div>

              <div class="service-grid">
                <div v-for="s in ALMAKARE_FREE_SERVICES" :key="s.id" class="service-card service-card-free"
                  @click="openServiceDetails(s, { free: true })">
                  <div class="service-card-head">
                    <div class="service-icon service-icon-free">
                      <v-icon :icon="s.icon" size="22" />
                    </div>
                    <div class="service-card-title-wrap">
                      <div class="service-card-title">{{ s.name }}</div>
                      <div class="service-card-price service-card-price-free">Inclus</div>
                    </div>
                  </div>
                  <div class="service-card-desc">{{ s.description }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <!-- =================== INVOICES DIALOG =================== -->
    <v-dialog v-model="invoicesDialog" max-width="640" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['invoices-card', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Factures Almakare</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              État de paiement des derniers mois
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="invoicesDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4 invoices-scroll">
          <v-row no-gutters class="invoices-summary mb-4">
            <v-col cols="6" class="invoices-summary-cell">
              <div class="invoices-summary-label">Total payé</div>
              <div class="invoices-summary-value text-success">{{ formatCurrency(totalPaid) }}</div>
            </v-col>
            <v-col cols="6" class="invoices-summary-cell">
              <div class="invoices-summary-label">En attente</div>
              <div class="invoices-summary-value"
                :class="totalOutstanding > 0 ? 'text-warning' : 'text-medium-emphasis'">
                {{ formatCurrency(totalOutstanding) }}
              </div>
            </v-col>
          </v-row>

          <div v-if="invoices.length === 0" class="text-center text-body-small text-medium-emphasis py-6">
            <v-icon :icon="mdiFileDocumentOutline" size="40" color="medium-emphasis" class="mb-2" />
            <div>Aucune facture pour le moment.</div>
          </div>

          <div v-else>
            <div v-for="inv in invoices" :key="inv.id" class="invoice-row">
              <div class="invoice-icon">
                <v-icon :icon="mdiFileDocumentOutline" size="22" color="primary" />
              </div>
              <div class="invoice-main">
                <div class="invoice-period">{{ formatPeriod(inv.period) }}</div>
                <div class="invoice-number">
                  {{ inv.number }}
                  <span class="invoice-dot">·</span>
                  <template v-if="inv.status === INVOICE_STATUS.PAID && inv.paidAt">
                    Payée le {{ ISOToDDMMYYYY(inv.paidAt) }}
                  </template>
                  <template v-else-if="inv.dueAt">
                    Échéance {{ ISOToDDMMYYYY(inv.dueAt) }}
                  </template>
                  <template v-else>
                    Émise le {{ ISOToDDMMYYYY(inv.issuedAt) }}
                  </template>
                </div>
              </div>
              <div class="invoice-side">
                <div class="invoice-amount">{{ formatCurrency(inv.amount) }}</div>
                <v-chip size="x-small" variant="tonal" :color="statusMeta(inv.status).color"
                  :prepend-icon="statusMeta(inv.status).icon" class="font-weight-bold mt-1">
                  {{ INVOICE_STATUS_LABELS[inv.status] }}
                </v-chip>
              </div>
              <v-btn :icon="mdiDownloadOutline" variant="text" size="small" color="primary" class="invoice-download"
                @click="downloadInvoice(inv)" aria-label="Télécharger la facture" />
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <div class="text-body-small text-medium-emphasis d-flex align-center">
            <v-icon :icon="mdiShieldCheckOutline" size="14" class="mr-1" />
            Almakare SAS · TVA non applicable
          </div>
          <v-spacer />
          <v-btn color="primary" rounded="lg" flat class="text-none" @click="invoicesDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== CREATE ESTABLISHMENT DIALOG =================== -->
    <v-dialog v-model="establishmentDialog" max-width="520" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['establishment-dialog', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Nouvel établissement</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Renseignez les informations de l'établissement.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" :disabled="establishmentSaving"
            @click="establishmentDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4">
          <v-form ref="establishmentFormRef">
            <v-row>
              <v-col cols="12" class="d-flex flex-column align-center">
                <Picture docPath="organisations/main/establishments/new"
                  storagePath="organisations/main/establishments/new" v-model:source="establishmentDraft.logoUrl"
                  pictureName="logo" :size="100" for="establishment-logo" :cover="false" />
                <div class="text-body-small text-medium-emphasis mt-2">Logo de l'établissement</div>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="establishmentDraft.name" label="Nom de l'établissement" variant="outlined"
                  rounded="lg" density="comfortable" :rules="[required]" />
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="establishmentDraft.location" label="Localisation"
                  :prepend-inner-icon="mdiMapMarkerOutline" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[required]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" :disabled="establishmentSaving"
            @click="establishmentDialog = false">
            Annuler
          </v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" :loading="establishmentSaving"
            @click="saveEstablishment">
            Créer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== ACTE CREATE / EDIT DIALOG =================== -->
    <v-dialog v-model="acteDialog" max-width="720" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['acte-dialog', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">
              {{ editingActeId ? 'Modifier l\'acte' : 'Créer un acte' }}
            </div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Définissez les paramètres de cet acte pour la programmation et la facturation.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" :disabled="acteSaving" @click="acteDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4 acte-dialog-scroll">
          <v-form ref="acteFormRef">
            <v-row density="comfortable">
              <v-col cols="12">
                <v-text-field v-model.trim="acteDraft.label" label="Libellé" variant="outlined" rounded="lg"
                  density="comfortable" :rules="[required]" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.trim="acteDraft.internalCode" label="Code interne" variant="outlined" rounded="lg"
                  density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="acteDraft.externalCode" label="Code externe" variant="outlined" rounded="lg"
                  density="comfortable" />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch v-model="acteDraft.visibleOnOnlineAgenda" color="primary" hide-details density="compact"
                  label="Visible sur agenda en ligne" />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="acteDraft.sendPlanningEmail" color="primary" hide-details density="compact"
                  label="Envoyer un mail de planification" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="acteDraft.price" label="Tarif" type="number" min="0" step="1"
                  :prepend-inner-icon="mdiCurrencyEur" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[nonNegativeNumber]" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="acteDraft.billingType" :items="BILLING_TYPES" item-title="label" item-value="value"
                  label="Type de facturation" variant="outlined" rounded="lg" density="comfortable" />
              </v-col>

              <v-col cols="12">
                <div class="text-body-small text-medium-emphasis mb-2">Couleur rendez-vous agenda</div>
                <div class="acte-color-picker">
                  <button v-for="c in ACTE_COLORS" :key="c" type="button" class="acte-color-swatch"
                    :class="{ 'acte-color-swatch-selected': acteDraft.agendaColor === c }"
                    :style="{ backgroundColor: c }" :aria-label="`Couleur ${c}`" @click="acteDraft.agendaColor = c" />
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch v-model="acteDraft.billableByDoctor" color="primary" hide-details density="compact"
                  label="Facturable par le médecin" />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="acteDraft.billAssociatedGhs" color="primary" hide-details density="compact"
                  label="Facturer le GHS associé (si machine associée)" />
              </v-col>

              <v-col cols="12">
                <v-select v-model="acteDraft.machineTypes" :items="MACHINE_TYPES" item-title="label" item-value="value"
                  label="Type machine" placeholder="Sélectionnez un ou plusieurs types" multiple chips closable-chips
                  variant="outlined" rounded="lg" density="comfortable" />
              </v-col>

              <v-col cols="12">
                <v-select v-model="acteDraft.linkedActeId" :items="linkedActeOptions" item-title="label" item-value="id"
                  label="Acte lié" placeholder="Sélectionnez un acte lié (facturation)" clearable variant="outlined"
                  rounded="lg" density="comfortable" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="acteDraft.concurrentAppointments" label="Nombre de soins / RDV simultanés"
                  type="number" min="1" step="1" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[positiveInteger]" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="acteDraft.averageDurationMinutes" label="Durée moyenne (minutes)"
                  type="number" min="0" step="5" :prepend-inner-icon="mdiClockOutline" variant="outlined" rounded="lg"
                  density="comfortable" :rules="[nonNegativeNumber]" />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch v-model="acteDraft.visible" color="primary" hide-details density="compact" label="Visible" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="acteDraft.order" label="Ordre d'apparition" type="number" min="1" step="1"
                  variant="outlined" rounded="lg" density="comfortable" :rules="[positiveInteger]" />
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="acteDraft.specificDirectory"
                  label="Répertoire spécifique (si upload fichier métier)" :prepend-inner-icon="mdiFolderOutline"
                  variant="outlined" rounded="lg" density="comfortable" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" :disabled="acteSaving" @click="acteDialog = false">
            Annuler
          </v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" :loading="acteSaving" @click="saveActe">
            {{ editingActeId ? 'Enregistrer' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== ACTE DELETE DIALOG =================== -->
    <v-dialog v-model="acteDeleteDialog" max-width="420">
      <v-card v-if="acteToDelete" class="pa-2 rounded-15">
        <v-card-text class="px-6 pt-6 pb-2 text-center">
          <div class="acte-delete-icon-wrap mb-4">
            <v-icon :icon="mdiAlertOutline" size="40" color="error" />
          </div>
          <div class="text-headline-small font-weight-bold mb-2">Supprimer cet acte ?</div>
          <div class="text-body-medium text-medium-emphasis">
            L'acte <strong>{{ acteToDelete.label }}</strong> sera supprimé définitivement.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-row class="ga-2" no-gutters>
            <v-col>
              <v-btn variant="text" rounded="lg" size="large" block class="text-none" :disabled="acteDeleting"
                @click="acteDeleteDialog = false">
                Annuler
              </v-btn>
            </v-col>
            <v-col>
              <v-btn color="error" rounded="lg" flat size="large" block class="text-none"
                :prepend-icon="mdiTrashCanOutline" :loading="acteDeleting" @click="confirmDeleteActe">
                Supprimer
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== SERVICE DETAILS DIALOG =================== -->
    <v-dialog v-model="serviceDialog" max-width="540" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card v-if="selectedService" :class="['service-dialog', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1 d-flex align-center ga-3">
            <div class="service-icon" :class="{
              'service-icon-free': selectedServiceIsFree,
              'service-icon-active': !selectedServiceIsFree && selectedServiceActive,
              'service-icon-inactive': !selectedServiceIsFree && !selectedServiceActive,
            }">
              <v-icon :icon="selectedService.icon" size="22" />
            </div>
            <div class="min-w-0">
              <div class="text-headline-small font-weight-bold text-truncate">{{ selectedService.name }}</div>
              <div class="text-body-small text-medium-emphasis">{{ selectedService.description }}</div>
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="serviceDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4">
          <!-- Price / status banner -->
          <div class="service-dialog-banner" :class="{
            'service-dialog-banner-free': selectedServiceIsFree,
            'service-dialog-banner-active': !selectedServiceIsFree && selectedServiceActive,
            'service-dialog-banner-inactive': !selectedServiceIsFree && !selectedServiceActive,
          }">
            <template v-if="selectedServiceIsFree">
              <div class="service-dialog-banner-value">Inclus</div>
              <div class="service-dialog-banner-meta">
                <v-icon :icon="mdiGiftOutline" size="14" class="mr-1" />
                Offert par Almakare SAS
              </div>
            </template>
            <template v-else>
              <div class="service-dialog-banner-value">
                {{ formatCurrency(selectedService.price) }}
                <span class="service-dialog-banner-period">/ mois</span>
              </div>
              <div class="service-dialog-banner-meta">
                <v-icon :icon="selectedServiceActive ? mdiCheckCircleOutline : mdiInformationOutline" size="14"
                  class="mr-1" />
                {{ selectedServiceActive ? 'Service actuellement activé' : 'Service non activé' }}
              </div>
            </template>
          </div>

          <!-- Long description -->
          <div v-if="selectedService.details" class="service-dialog-details">
            {{ selectedService.details }}
          </div>

          <!-- Features list -->
          <template v-if="selectedService.features?.length">
            <div class="text-title-small text-medium-emphasis text-uppercase font-weight-bold mt-5 mb-2">
              Ce qui est inclus
            </div>
            <div class="service-feature" v-for="(feat, i) in selectedService.features" :key="i">
              <v-icon :icon="mdiCheckCircleOutline" size="18" :color="selectedServiceIsFree ? 'success' : 'primary'"
                class="mr-2 flex-shrink-0" />
              <span>{{ feat }}</span>
            </div>
          </template>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="serviceDialog = false">
            Fermer
          </v-btn>
          <template v-if="!selectedServiceIsFree">
            <v-btn v-if="selectedServiceActive" variant="text" color="error" rounded="lg" class="text-none ml-2"
              @click="handleDialogToggle">
              Désactiver
            </v-btn>
            <v-btn v-else color="primary" rounded="lg" flat class="text-none ml-2" @click="handleDialogToggle">
              Activer
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.organisation-description {
  max-width: 640px;
  line-height: 1.6;
}

.organisation-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sticky-card {
  position: sticky;
  top: 24px;
}

.payment-card {
  background: linear-gradient(160deg, rgba(var(--v-theme-primary), 0.06), rgba(var(--v-theme-primary), 0.01));
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.payment-amount {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.1;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.5px;
}

.payment-period {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
  margin-left: 4px;
}

.payment-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.07);
}

.payment-line:last-child {
  border-bottom: none;
}

.payment-line-name {
  color: rgba(0, 0, 0, 0.75);
  margin-right: 8px;
  max-width: 70%;
}

.payment-line-price {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  flex-shrink: 0;
}

.payment-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.service-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.service-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 0, 0, 0.14);
}

.service-card:active {
  transform: translateY(0);
}

.service-card-active {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
}

.service-card-inactive {
  background: rgba(0, 0, 0, 0.02);
}

.service-card-free {
  border-color: rgba(var(--v-theme-success), 0.35);
  background: rgba(var(--v-theme-success), 0.05);
}

.service-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.service-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.service-icon-active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.service-icon-inactive {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.55);
}

.service-icon-free {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.service-card-title-wrap {
  min-width: 0;
  flex: 1;
}

.service-card-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.service-card-price {
  margin-top: 2px;
  font-weight: 700;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
}

.service-card-price span {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
  font-size: 11px;
}

.service-card-price-muted {
  color: rgba(0, 0, 0, 0.7);
}

.service-card-price-free {
  color: rgb(var(--v-theme-success));
}

.service-card-desc {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.5;
  flex-grow: 1;
}

.service-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.min-w-0 {
  min-width: 0;
}

.service-dialog-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  margin-bottom: 18px;
}

.service-dialog-banner-active {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.service-dialog-banner-inactive {
  background: rgba(0, 0, 0, 0.035);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.service-dialog-banner-free {
  background: rgba(var(--v-theme-success), 0.08);
  border: 1px solid rgba(var(--v-theme-success), 0.22);
}

.service-dialog-banner-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  color: rgba(0, 0, 0, 0.88);
  letter-spacing: -0.3px;
}

.service-dialog-banner-free .service-dialog-banner-value {
  color: rgb(var(--v-theme-success));
}

.service-dialog-banner-active .service-dialog-banner-value {
  color: rgb(var(--v-theme-primary));
}

.service-dialog-banner-period {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 2px;
}

.service-dialog-banner-meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
}

.service-dialog-details {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(0, 0, 0, 0.78);
}

.service-feature {
  display: flex;
  align-items: flex-start;
  padding: 6px 0;
  font-size: 13.5px;
  color: rgba(0, 0, 0, 0.8);
  line-height: 1.5;
}

.invoices-scroll {
  max-height: 60vh;
}

.invoices-summary {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.invoices-summary-cell {
  padding: 14px 16px;
}

.invoices-summary-cell+.invoices-summary-cell {
  border-left: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.invoices-summary-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 4px;
}

.invoices-summary-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.invoice-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.invoice-row:last-child {
  border-bottom: none;
}

.invoice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  flex-shrink: 0;
}

.invoice-main {
  flex: 1;
  min-width: 0;
}

.invoice-period {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.invoice-number {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
}

.invoice-dot {
  margin: 0 4px;
}

.invoice-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.invoice-amount {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.invoice-download {
  flex-shrink: 0;
}

.establishment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.establishment-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.establishment-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.03);
}

.establishment-card:active {
  transform: translateY(0);
}

.establishment-card-body {
  min-width: 0;
  flex: 1;
}

.establishment-card-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.establishment-card-location {
  margin-top: 4px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
}

.establishment-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
}

.organisation-team-tab :deep(> div > .v-row) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

.organisation-team-tab :deep(> div > .v-row > .v-col) {
  flex: 0 0 100%;
  max-width: 100%;
  padding: 0;
}

.establishment-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.acte-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.acte-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.acte-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.acte-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.acte-color-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.04);
}

.acte-card-title-wrap {
  flex: 1;
  min-width: 0;
}

.acte-card-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
  display: flex;
  align-items: center;
}

.acte-card-codes {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.acte-code {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.7);
  text-transform: uppercase;
}

.acte-code-ext {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.acte-card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.75);
}

.acte-meta-item {
  display: flex;
  align-items: center;
}

.acte-machine-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.acte-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.acte-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
}

.acte-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.acte-dialog-scroll {
  max-height: 70vh;
}

.acte-color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.acte-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.acte-color-swatch:hover {
  transform: scale(1.1);
}

.acte-color-swatch-selected {
  border-color: white;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.acte-delete-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), 0.12);
}
</style>
