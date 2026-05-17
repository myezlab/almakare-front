<script setup>
import Picture from '@/components/Picture.vue'
import { ISOToDDMMYYYY } from '@/composables/useDates'
import { LOG_ACTIONS } from '@/data/logs'
import { DEVICE_ICON, ORGANISATION_FIELDS } from '@/data/organisation'
import { useLogsStore } from '@/stores/logs'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { useSelfStore } from '@/stores/self'
import {
  mdiCalendarBlank,
  mdiCalendarCheckOutline,
  mdiClose,
  mdiDomain,
  mdiMapMarkerOutline,
  mdiPencilOutline,
  mdiPlus,
  mdiTrashCanOutline,
} from '@mdi/js'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const organisationStore = useOrganisationStore()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const logsStore = useLogsStore()

const establishment = computed(() =>
  organisationStore.findEstablishment(route.params.id),
)

const devices = computed(() => establishment.value?.devices || [])

const editing = ref(false)
const saving = ref(false)
const formRef = ref(null)

const TABS = ['materiel']
const DEFAULT_TAB = 'materiel'
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
  location: '',
})

function hydrateDraft() {
  const e = establishment.value || {}
  draft.value = {
    logoUrl: e.logoUrl || '',
    name: e.name || '',
    location: e.location || '',
  }
}

watch(establishment, (val) => {
  if (val?.id) hydrateDraft()
}, { immediate: true })

watch(
  () => route.params.id,
  () => {
    editing.value = false
  },
)

const required = (v) => !!String(v ?? '').trim() || 'Ce champ est requis'

const draftDirty = computed(() => {
  const e = establishment.value || {}
  return (
    (draft.value.logoUrl || '') !== (e.logoUrl || '') ||
    (draft.value.name || '').trim() !== (e.name || '') ||
    (draft.value.location || '').trim() !== (e.location || '')
  )
})

function startEdit() {
  hydrateDraft()
  editing.value = true
}

function cancelEdit() {
  hydrateDraft()
  editing.value = false
}

function logEstablishment(payload) {
  logsStore.add('organisationLogs', {
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
    const previous = establishment.value
    const patch = {
      logoUrl: draft.value.logoUrl || '',
      name: draft.value.name.trim(),
      location: draft.value.location.trim(),
    }
    const changes = []
    if (previous.name !== patch.name) {
      changes.push({ field: ORGANISATION_FIELDS.ESTABLISHMENT_NAME, from: previous.name, to: patch.name })
    }
    if (previous.location !== patch.location) {
      changes.push({ field: ORGANISATION_FIELDS.ESTABLISHMENT_LOCATION, from: previous.location, to: patch.location })
    }
    if ((previous.logoUrl || '') !== (patch.logoUrl || '')) {
      changes.push({ field: ORGANISATION_FIELDS.ESTABLISHMENT_LOGO, from: previous.logoUrl ? 'défini' : 'aucun', to: patch.logoUrl ? 'défini' : 'aucun' })
    }
    organisationStore.updateEstablishment(previous.id, patch)
    if (changes.length) {
      logEstablishment({
        type: 'info',
        action: LOG_ACTIONS.ESTABLISHMENT_UPDATED,
        params: { name: patch.name },
        changes,
      })
    }
    messagesStore.add({ type: 'success', text: 'Établissement mis à jour' })
    editing.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la mise à jour' })
  } finally {
    saving.value = false
  }
}

function backToOrganisation() {
  router.push({ name: 'Organisation', query: { tab: 'etablissements' } })
}

// =========== DEVICES / CALENDAR ============

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const today = computed(() => dayjs().startOf('day'))

function deviceCalendarDays(device) {
  const start = today.value.startOf('week')
  return Array.from({ length: 35 }, (_, i) => {
    const date = start.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const isPast = date.isBefore(today.value, 'day')
    const isToday = date.isSame(today.value, 'day')
    const booking = (device.bookings || []).find(
      (b) => dateStr >= b.startDate && dateStr <= b.endDate,
    )
    return {
      key: dateStr,
      day: date.date(),
      isPast,
      isToday,
      booked: !!booking,
      tooltip: booking
        ? `${ISOToDDMMYYYY(dateStr)} — ${booking.label || 'Réservé'}`
        : `${ISOToDDMMYYYY(dateStr)} — Disponible`,
    }
  })
}

function calendarMonthLabel(device) {
  const days = deviceCalendarDays(device)
  const first = dayjs(days[0].key)
  const last = dayjs(days[days.length - 1].key)
  if (first.month() === last.month()) {
    return first.format('MMMM YYYY')
  }
  return `${first.format('MMM')} – ${last.format('MMM YYYY')}`
}

function nextAvailability(device) {
  let cursor = today.value
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.format('YYYY-MM-DD')
    const booked = (device.bookings || []).some(
      (b) => dateStr >= b.startDate && dateStr <= b.endDate,
    )
    if (!booked) {
      if (i === 0) return { isToday: true, label: 'Disponible aujourd\'hui' }
      return { isToday: false, label: `Disponible à partir du ${cursor.format('D MMM')}` }
    }
    cursor = cursor.add(1, 'day')
  }
  return { isToday: false, label: 'Indisponible sur les 12 prochains mois' }
}

const deviceDialog = ref(false)
const deviceSaving = ref(false)
const deviceFormRef = ref(null)
const deviceDraft = ref({ name: '', acquiredAt: '' })

function openDeviceDialog() {
  deviceDraft.value = {
    name: '',
    acquiredAt: dayjs().format('YYYY-MM-DD'),
  }
  deviceDialog.value = true
}

async function saveDevice() {
  const { valid } = await deviceFormRef.value.validate()
  if (!valid) return
  deviceSaving.value = true
  try {
    const created = organisationStore.addDevice(establishment.value.id, {
      name: deviceDraft.value.name.trim(),
      acquiredAt: deviceDraft.value.acquiredAt,
    })
    logEstablishment({
      type: 'success',
      action: LOG_ACTIONS.DEVICE_CREATED,
      params: { name: created.name },
    })
    messagesStore.add({ type: 'success', text: `Matériel "${created.name}" ajouté` })
    deviceDialog.value = false
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de l\'ajout du matériel' })
  } finally {
    deviceSaving.value = false
  }
}

function removeDevice(device) {
  organisationStore.removeDevice(establishment.value.id, device.id)
  logEstablishment({
    type: 'warning',
    action: LOG_ACTIONS.DEVICE_REMOVED,
    params: { name: device.name },
  })
  messagesStore.add({ type: 'success', text: `Matériel "${device.name}" retiré` })
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">
              {{ establishment?.name || 'Établissement' }}
            </div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiDomain" size="18" class="mr-1" />
              Espace de gestion de l'établissement
            </div>
          </v-col>
        </v-row>

        <!-- =================== NOT FOUND =================== -->
        <v-card v-if="!establishment" class="card-shadow pa-8 text-center"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="text-title-medium font-weight-bold mb-2">Établissement introuvable</div>
          <div class="text-body-small text-medium-emphasis mb-4">
            Cet établissement n'existe pas ou a été supprimé.
          </div>
          <v-btn color="primary" rounded="lg" flat class="text-none" @click="backToOrganisation">
            Retour à l'organisation
          </v-btn>
        </v-card>

        <!-- =================== DETAILS CARD =================== -->
        <v-card v-else class="card-shadow pt-6 px-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <!-- VIEW MODE -->
          <div v-if="!editing">
            <div class="d-flex justify-end">
              <v-btn :icon="mdiPencilOutline" variant="text" size="small" color="primary" @click="startEdit"
                aria-label="Modifier l'établissement" />
            </div>

            <div class="d-flex flex-column align-center text-center pb-2">
              <v-avatar color="primary" variant="tonal" size="96" class="mb-3" rounded="15">
                <v-img v-if="establishment.logoUrl" :src="establishment.logoUrl" />
                <v-icon v-else :icon="mdiDomain" size="48" />
              </v-avatar>
              <div class="text-headline-small font-weight-bold">{{ establishment.name }}</div>
              <div class="text-body-medium text-medium-emphasis mt-2 d-flex align-center">
                <v-icon :icon="mdiMapMarkerOutline" size="16" class="mr-1" />
                {{ establishment.location || '—' }}
              </div>
            </div>

            <v-tabs v-model="activeTab" color="primary" align-tabs="center" class="mt-6 establishment-tabs">
              <v-tab value="materiel" class="text-none">Matériel</v-tab>
            </v-tabs>
          </div>

          <!-- EDIT MODE -->
          <v-form v-else ref="formRef">
            <div class="d-flex align-center mb-4">
              <div class="text-headline-small font-weight-bold flex-grow-1">Modifier l'établissement</div>
              <v-btn :icon="mdiClose" variant="text" size="small" :disabled="saving" @click="cancelEdit"
                aria-label="Fermer l'édition" />
            </div>

            <v-row>
              <v-col cols="12" class="d-flex flex-column align-center">
                <Picture :docPath="`organisations/main/establishments/${establishment.id}`"
                  :storagePath="`organisations/main/establishments/${establishment.id}`"
                  v-model:source="draft.logoUrl" pictureName="logo" :size="100"
                  :for="`establishment-logo-${establishment.id}`" :cover="false" />
                <div class="text-body-small text-medium-emphasis mt-2">Logo de l'établissement</div>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="draft.name" label="Nom de l'établissement" variant="outlined"
                  rounded="lg" density="comfortable" :rules="[required]" />
              </v-col>

              <v-col cols="12">
                <v-text-field v-model.trim="draft.location" label="Localisation"
                  :prepend-inner-icon="mdiMapMarkerOutline" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[required]" />
              </v-col>
            </v-row>

            <div v-if="draftDirty" class="d-flex justify-end ga-2 mt-2 pb-4">
              <v-btn variant="text" rounded="lg" class="text-none" :disabled="saving" @click="cancelEdit">
                Annuler
              </v-btn>
              <v-btn color="primary" rounded="lg" flat class="text-none" :loading="saving" @click="saveDetails">
                Enregistrer
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <!-- =================== MATERIEL TAB =================== -->
        <v-row v-if="establishment && activeTab === 'materiel'">
          <v-col cols="12">
            <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
              <div class="d-flex align-center mb-4">
                <div>
                  <div class="text-headline-small font-weight-bold">Matériel</div>
                  <div class="text-body-small text-medium-emphasis mt-1">
                    Visualisez les disponibilités de chaque appareil de l'établissement.
                  </div>
                </div>
                <v-spacer />
                <v-btn v-if="devices.length > 0" color="primary" rounded="lg" flat class="text-none"
                  :prepend-icon="mdiPlus" @click="openDeviceDialog">
                  Ajouter
                </v-btn>
              </div>

              <!-- Legend -->
              <div v-if="devices.length > 0" class="device-legend mb-4">
                <div class="device-legend-item">
                  <span class="device-legend-swatch device-legend-swatch-available" />
                  Disponible
                </div>
                <div class="device-legend-item">
                  <span class="device-legend-swatch device-legend-swatch-booked" />
                  Réservé
                </div>
                <div class="device-legend-item">
                  <span class="device-legend-swatch device-legend-swatch-today" />
                  Aujourd'hui
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="devices.length === 0"
                class="d-flex flex-column align-center text-center pa-8 device-empty">
                <div class="device-empty-icon mb-3">
                  <v-icon :icon="DEVICE_ICON" size="40" />
                </div>
                <div class="text-title-medium font-weight-bold mb-1">Aucun matériel</div>
                <div class="text-body-small text-medium-emphasis mb-4">
                  Ajoutez votre premier appareil pour suivre ses disponibilités.
                </div>
                <v-btn color="primary" rounded="lg" flat class="text-none" :prepend-icon="mdiPlus"
                  @click="openDeviceDialog">
                  Ajouter un appareil
                </v-btn>
              </div>

              <!-- Device grid -->
              <div v-else class="device-grid">
                <div v-for="device in devices" :key="device.id" class="device-card">
                  <div class="device-card-head">
                    <div class="device-icon">
                      <v-icon :icon="DEVICE_ICON" size="22" />
                    </div>
                    <div class="device-card-title-wrap">
                      <div class="device-card-title">{{ device.name }}</div>
                      <div class="device-card-meta">
                        <v-icon :icon="mdiCalendarBlank" size="13" class="mr-1" />
                        Acquis le {{ ISOToDDMMYYYY(device.acquiredAt) }}
                      </div>
                    </div>
                    <v-btn :icon="mdiTrashCanOutline" variant="text" size="small" color="error"
                      class="flex-shrink-0" @click="removeDevice(device)" aria-label="Retirer le matériel" />
                  </div>

                  <div class="device-calendar">
                    <div class="device-calendar-header">
                      <span class="device-calendar-month">{{ calendarMonthLabel(device) }}</span>
                    </div>
                    <div class="device-calendar-weekdays">
                      <span v-for="(d, i) in WEEKDAY_LABELS" :key="i">{{ d }}</span>
                    </div>
                    <div class="device-calendar-grid">
                      <v-tooltip v-for="cell in deviceCalendarDays(device)" :key="cell.key" location="top"
                        :text="cell.tooltip">
                        <template #activator="{ props }">
                          <div v-bind="props" class="day-cell" :class="{
                            'day-cell-past': cell.isPast,
                            'day-cell-today': cell.isToday,
                            'day-cell-booked': cell.booked && !cell.isPast,
                            'day-cell-available': !cell.booked && !cell.isPast,
                          }">
                            {{ cell.day }}
                          </div>
                        </template>
                      </v-tooltip>
                    </div>
                  </div>

                  <div class="device-card-footer" :class="{
                    'device-card-footer-now': nextAvailability(device).isToday,
                  }">
                    <v-icon :icon="mdiCalendarCheckOutline" size="14" class="mr-1" />
                    {{ nextAvailability(device).label }}
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
    </v-row>

    <!-- =================== ADD DEVICE DIALOG =================== -->
    <v-dialog v-model="deviceDialog" max-width="480" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card :class="['device-dialog', { 'pa-2 rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Nouveau matériel</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Renseignez le nom et la date d'acquisition.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" :disabled="deviceSaving"
            @click="deviceDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 py-4">
          <v-form ref="deviceFormRef">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model.trim="deviceDraft.name" label="Nom du matériel"
                  :prepend-inner-icon="DEVICE_ICON" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[required]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="deviceDraft.acquiredAt" label="Date d'acquisition" type="date"
                  :prepend-inner-icon="mdiCalendarBlank" variant="outlined" rounded="lg" density="comfortable"
                  :rules="[required]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" :disabled="deviceSaving"
            @click="deviceDialog = false">
            Annuler
          </v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" :loading="deviceSaving"
            @click="saveDevice">
            Ajouter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.establishment-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.device-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.device-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.device-legend-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.device-legend-swatch-available {
  background: rgba(var(--v-theme-success), 0.18);
  border-color: rgba(var(--v-theme-success), 0.35);
}

.device-legend-swatch-booked {
  background: rgba(var(--v-theme-error), 0.18);
  border-color: rgba(var(--v-theme-error), 0.4);
}

.device-legend-swatch-today {
  background: white;
  border: 2px solid rgb(var(--v-theme-primary));
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.device-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  transition:
    border-color 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.device-card:hover {
  border-color: rgba(0, 0, 0, 0.14);
}

.device-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.device-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.device-card-title-wrap {
  min-width: 0;
  flex: 1;
}

.device-card-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.device-card-meta {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
}

.device-calendar {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 10px 12px;
}

.device-calendar-header {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
  text-transform: capitalize;
  margin-bottom: 6px;
}

.device-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.device-calendar-weekdays span {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
}

.device-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  cursor: default;
  color: rgba(0, 0, 0, 0.65);
  border: 1px solid transparent;
  transition: transform 0.12s ease;
}

.day-cell:hover {
  transform: scale(1.08);
}

.day-cell-past {
  color: rgba(0, 0, 0, 0.25);
  background: rgba(0, 0, 0, 0.02);
}

.day-cell-available {
  background: rgba(var(--v-theme-success), 0.16);
  color: rgba(0, 0, 0, 0.75);
}

.day-cell-booked {
  background: rgba(var(--v-theme-error), 0.18);
  color: rgba(0, 0, 0, 0.85);
}

.day-cell-today {
  border-color: rgb(var(--v-theme-primary));
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}

.device-card-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}

.device-card-footer-now {
  color: rgb(var(--v-theme-success));
}

.device-empty {
  background: rgba(0, 0, 0, 0.025);
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
}

.device-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
