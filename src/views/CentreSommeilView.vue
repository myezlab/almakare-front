<script setup>
import Picture from '@/components/Picture.vue'
import DialogLogs from '@/components/DialogLogs.vue'
import { useCurrency } from '@/composables/useCurrency'
import { ISOToDDMMYYYY } from '@/composables/useDates'
import {
  ALMAKARE_FREE_SERVICES,
  ALMAKARE_INVOICES_SEED,
  ALMAKARE_SERVICES,
  CENTRE_DASHBOARD_ICON,
  CENTRE_FIELDS,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
} from '@/data/centre-sommeil'
import { LOG_ACTIONS } from '@/data/logs'
import { useCentreStore } from '@/stores/centre'
import { useLogsStore } from '@/stores/logs'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import {
  mdiAlertCircleOutline,
  mdiCalendarOutline,
  mdiCheckCircleOutline,
  mdiClockOutline,
  mdiClose,
  mdiCloseCircleOutline,
  mdiDownloadOutline,
  mdiFileDocumentOutline,
  mdiGiftOutline,
  mdiInformationOutline,
  mdiOfficeBuildingOutline,
  mdiPencilOutline,
  mdiReceiptTextOutline,
  mdiShieldCheckOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'

const centreStore = useCentreStore()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const logsStore = useLogsStore()
const { formatCurrency } = useCurrency()

const centre = computed(() => centreStore.item || {})

const editing = ref(false)
const saving = ref(false)
const formRef = ref(null)

const draft = ref({
  logoUrl: '',
  name: '',
  description: '',
  createdAt: '',
})

function hydrateDraft() {
  draft.value = {
    logoUrl: centre.value.logoUrl || '',
    name: centre.value.name || '',
    description: centre.value.description || '',
    createdAt: centre.value.createdAt || '',
  }
}

watch(centre, (val) => {
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
  const c = centre.value
  return (
    (draft.value.logoUrl || '') !== (c.logoUrl || '') ||
    (draft.value.name || '').trim() !== (c.name || '') ||
    (draft.value.description || '').trim() !== (c.description || '') ||
    (draft.value.createdAt || '') !== (c.createdAt || '')
  )
})

function logCentre(payload) {
  logsStore.add('centreLogs', {
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
    const previous = centre.value
    const patch = {
      logoUrl: draft.value.logoUrl || '',
      name: draft.value.name.trim(),
      description: draft.value.description.trim(),
      createdAt: draft.value.createdAt,
    }
    const changes = []
    if (previous.name !== patch.name) {
      changes.push({ field: CENTRE_FIELDS.NAME, from: previous.name, to: patch.name })
    }
    if (previous.description !== patch.description) {
      changes.push({ field: CENTRE_FIELDS.DESCRIPTION, from: previous.description, to: patch.description })
    }
    if (previous.createdAt !== patch.createdAt) {
      changes.push({ field: CENTRE_FIELDS.CREATED_AT, from: previous.createdAt, to: patch.createdAt })
    }
    if ((previous.logoUrl || '') !== (patch.logoUrl || '')) {
      changes.push({ field: CENTRE_FIELDS.LOGO, from: previous.logoUrl ? 'défini' : 'aucun', to: patch.logoUrl ? 'défini' : 'aucun' })
    }
    centreStore.update(patch)
    if (changes.length) {
      logCentre({ type: 'info', action: LOG_ACTIONS.CENTRE_UPDATED, changes })
    }
    messagesStore.add({ type: 'success', text: 'Centre mis à jour' })
    editing.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour' })
  } finally {
    saving.value = false
  }
}

const selectedSet = computed(() => new Set(centre.value.selectedServiceIds || []))

const selectedServices = computed(() =>
  ALMAKARE_SERVICES.filter((s) => selectedSet.value.has(s.id)),
)
const availableServices = computed(() =>
  ALMAKARE_SERVICES.filter((s) => !selectedSet.value.has(s.id)),
)

const monthlyTotal = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + s.price, 0),
)
const annualTotal = computed(() => monthlyTotal.value * 12)

function toggleService(service) {
  const current = new Set(centre.value.selectedServiceIds || [])
  const isActive = current.has(service.id)
  if (isActive) {
    current.delete(service.id)
    logCentre({
      type: 'warning',
      action: LOG_ACTIONS.CENTRE_SERVICE_REMOVED,
      params: { name: service.name },
    })
    messagesStore.add({ type: 'success', text: `Service "${service.name}" désactivé` })
  } else {
    current.add(service.id)
    logCentre({
      type: 'success',
      action: LOG_ACTIONS.CENTRE_SERVICE_ADDED,
      params: { name: service.name },
    })
    messagesStore.add({ type: 'success', text: `Service "${service.name}" activé` })
  }
  centreStore.update({ selectedServiceIds: [...current] })
}

const formattedCreatedAt = computed(() => ISOToDDMMYYYY(centre.value.createdAt))

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
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">{{ centre.name || 'Centre du sommeil' }}</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="CENTRE_DASHBOARD_ICON" size="18" class="mr-1" />
              Espace de gestion du centre
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <DialogLogs collectionName="centreLogs" title="Historique du centre" />
          </v-col>
        </v-row>

        <!-- =================== HERO / DETAILS CARD =================== -->
        <v-card class="card-shadow hero-card pa-6 mb-4"
          :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">

          <!-- VIEW MODE -->
          <div v-if="!editing">
            <div class="d-flex justify-end">
              <v-btn :icon="mdiPencilOutline" variant="text" size="small" color="primary" @click="startEdit"
                aria-label="Modifier les détails du centre" />
            </div>

            <div class="d-flex flex-column align-center text-center">
              <v-avatar color="primary" variant="tonal" size="96" class="mb-3" rounded="15">
                <v-img v-if="centre.logoUrl" :src="centre.logoUrl" />
                <v-icon v-else :icon="mdiOfficeBuildingOutline" size="48" />
              </v-avatar>
              <div class="text-headline-small font-weight-bold">{{ centre.name }}</div>
              <div class="text-body-medium text-medium-emphasis mt-3 centre-description">
                {{ centre.description }}
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
          </div>

          <!-- EDIT MODE -->
          <v-form v-else ref="formRef">
            <div class="d-flex align-center mb-4">
              <div class="text-headline-small font-weight-bold flex-grow-1">Modifier le centre</div>
              <v-btn :icon="mdiClose" variant="text" size="small" :disabled="saving" @click="cancelEdit"
                aria-label="Fermer l'édition" />
            </div>

            <v-row>
              <v-col cols="12" class="d-flex flex-column align-center">
                <Picture docPath="centres/main" storagePath="centres/main" v-model:source="draft.logoUrl"
                  pictureName="logo" :size="100" for="centre-logo" :cover="false" />
                <div class="text-body-small text-medium-emphasis mt-2">Logo du centre</div>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="draft.name" label="Nom du centre" variant="outlined" rounded="lg"
                  density="comfortable" :rules="[required]" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="draft.description" label="Description" variant="outlined" rounded="lg" rows="4"
                  auto-grow :rules="[required]" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="draft.createdAt" label="Date de création" type="date" variant="outlined"
                  rounded="lg" density="comfortable" :rules="[required]" />
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

        <v-row>
          <!-- =================== MONTHLY PAYMENT SUMMARY =================== -->
          <v-col cols="12" md="4">
            <v-card class="card-shadow pa-6 payment-card sticky-card" :class="{ 'rounded-15': !$vuetify.display.mobile }">
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

              <v-btn variant="tonal" color="primary" rounded="lg" size="small" block
                class="text-none mt-3" :prepend-icon="mdiReceiptTextOutline" @click="invoicesDialog = true">
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
                    Activez ou désactivez les modules utilisés par votre centre.
                  </div>
                </div>
                <v-spacer />
                <v-chip size="small" variant="tonal" color="primary" :prepend-icon="mdiCheckCircleOutline"
                  class="font-weight-bold">
                  {{ selectedServices.length }} / {{ ALMAKARE_SERVICES.length }}
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
                Tous les services Almakare sont activés pour votre centre.
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
                    Offert par Almakare SAS à tous les centres partenaires.
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
              <div class="invoices-summary-value" :class="totalOutstanding > 0 ? 'text-warning' : 'text-medium-emphasis'">
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
              <v-btn :icon="mdiDownloadOutline" variant="text" size="small" color="primary"
                class="invoice-download" @click="downloadInvoice(inv)" aria-label="Télécharger la facture" />
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

    <!-- =================== SERVICE DETAILS DIALOG =================== -->
    <v-dialog v-model="serviceDialog" max-width="540" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card v-if="selectedService" :class="['service-dialog', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1 d-flex align-center ga-3">
            <div class="service-icon"
              :class="{
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
          <div class="service-dialog-banner"
            :class="{
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
              <v-icon :icon="mdiCheckCircleOutline" size="18"
                :color="selectedServiceIsFree ? 'success' : 'primary'" class="mr-2 flex-shrink-0" />
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
            <v-btn v-else color="primary" rounded="lg" flat class="text-none ml-2"
              @click="handleDialogToggle">
              Activer
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.centre-description {
  max-width: 640px;
  line-height: 1.6;
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

.invoices-summary-cell + .invoices-summary-cell {
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
</style>
