<script setup>
import DateFieldFr from '@/components/DateFieldFr.vue'
import TimeFieldFr from '@/components/TimeFieldFr.vue'
import { useAppointmentsStore } from '@/stores/appointments'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { usePatientsStore } from '@/stores/patients'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountOutline,
  mdiCalendarBlankOutline,
  mdiCalendarClockOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClockOutline,
  mdiClose,
  mdiDomain,
  mdiMapMarkerOutline,
  mdiNotebookOutline,
  mdiPencilOutline,
  mdiPlus,
  mdiTrashCanOutline,
} from '@mdi/js'
import { computed, ref } from 'vue'

const selfStore = useSelfStore()
const appointmentsStore = useAppointmentsStore()
const patientsStore = usePatientsStore()
const messagesStore = useMessagesStore()
const organisationStore = useOrganisationStore()

const establishments = computed(() => organisationStore.item.establishments || [])
const establishmentOptions = computed(() =>
  establishments.value.map((e) => ({
    value: e.id,
    title: e.name,
    subtitle: e.location,
  })),
)

function establishmentFor(id) {
  if (!id) return null
  return establishments.value.find((e) => e.id === id) || null
}

const doctorId = computed(() => selfStore.item?.id || 'self')

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const weekStart = ref(startOfWeek(new Date()))

const weekDays = computed(() => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`
  }
  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()]} – ${last.getDate()} ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`
})

const todayISO = computed(() => toISODate(new Date()))

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function goToday() {
  weekStart.value = startOfWeek(new Date())
}

const mySlots = computed(() => appointmentsStore.slotsForDoctor(doctorId.value))

function slotsForDay(date) {
  const iso = toISODate(date)
  return mySlots.value
    .filter((s) => s.date === iso)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function dayLabel(date, idx) {
  return `${DAY_LABELS[idx]} ${date.getDate()}`
}

const slotDialog = ref(false)
const slotDraftId = ref(null)
const slotDraftDate = ref(toISODate(new Date()))
const slotDraftStart = ref('09:00')
const slotDraftEnd = ref('09:30')
const slotDraftEstablishmentId = ref(null)
const slotFormRef = ref(null)
const isEditingSlot = computed(() => !!slotDraftId.value)

function openCreateSlot(date) {
  slotDraftId.value = null
  slotDraftDate.value = date ? toISODate(date) : toISODate(new Date())
  slotDraftStart.value = '09:00'
  slotDraftEnd.value = '09:30'
  slotDraftEstablishmentId.value = establishments.value[0]?.id || null
  slotDialog.value = true
}

function openEditSlot(slot) {
  slotDraftId.value = slot.id
  slotDraftDate.value = slot.date
  slotDraftStart.value = slot.startTime
  slotDraftEnd.value = slot.endTime
  slotDraftEstablishmentId.value = slot.establishmentId || establishments.value[0]?.id || null
  slotDialog.value = true
}

const required = (v) => !!String(v ?? '').trim() || 'Champ requis'
const endAfterStart = () =>
  (slotDraftEnd.value > slotDraftStart.value) || 'L\'heure de fin doit être après le début'

async function saveSlot() {
  const { valid } = await slotFormRef.value.validate()
  if (!valid) return
  if (!slotDraftEstablishmentId.value) {
    messagesStore.add({ type: 'error', text: 'Sélectionnez un établissement' })
    return
  }
  if (isEditingSlot.value) {
    appointmentsStore.updateSlot(slotDraftId.value, {
      establishmentId: slotDraftEstablishmentId.value,
      date: slotDraftDate.value,
      startTime: slotDraftStart.value,
      endTime: slotDraftEnd.value,
    })
    messagesStore.add({ type: 'success', text: 'Créneau modifié' })
  } else {
    appointmentsStore.addSlot({
      doctorId: doctorId.value,
      establishmentId: slotDraftEstablishmentId.value,
      date: slotDraftDate.value,
      startTime: slotDraftStart.value,
      endTime: slotDraftEnd.value,
    })
    messagesStore.add({ type: 'success', text: 'Créneau ajouté' })
  }
  slotDialog.value = false
}

function editSelectedSlot() {
  if (!selectedSlot.value) return
  const slot = selectedSlot.value
  detailsDialog.value = false
  openEditSlot(slot)
}

const meetingDialog = ref(false)
const meetingDate = ref(toISODate(new Date()))
const meetingStart = ref('10:00')
const meetingEnd = ref('10:30')
const meetingPatientId = ref(null)
const meetingEstablishmentId = ref(null)
const meetingNotes = ref('')
const meetingFormRef = ref(null)

const patientOptions = computed(() =>
  patientsStore.items.map((p) => ({
    value: p.id,
    title: `${p.firstName} ${p.lastName}`,
    subtitle: p.email,
  })),
)

function openCreateMeeting(date) {
  meetingDate.value = date ? toISODate(date) : toISODate(new Date())
  meetingStart.value = '10:00'
  meetingEnd.value = '10:30'
  meetingPatientId.value = null
  meetingEstablishmentId.value = establishments.value[0]?.id || null
  meetingNotes.value = ''
  meetingDialog.value = true
}

async function saveMeeting() {
  const { valid } = await meetingFormRef.value.validate()
  if (!valid) return
  if (!meetingPatientId.value) {
    messagesStore.add({ type: 'error', text: 'Sélectionnez un patient' })
    return
  }
  if (!meetingEstablishmentId.value) {
    messagesStore.add({ type: 'error', text: 'Sélectionnez un établissement' })
    return
  }
  const patient = patientsStore.items.find((p) => p.id === meetingPatientId.value)
  if (!patient) return
  appointmentsStore.createAppointment({
    doctorId: doctorId.value,
    establishmentId: meetingEstablishmentId.value,
    patientId: patient.id,
    patientFullName: `${patient.firstName} ${patient.lastName}`,
    date: meetingDate.value,
    startTime: meetingStart.value,
    endTime: meetingEnd.value,
    notes: meetingNotes.value.trim(),
  })
  messagesStore.add({ type: 'success', text: 'Rendez-vous créé' })
  meetingDialog.value = false
}

const detailsDialog = ref(false)
const selectedSlot = ref(null)
const selectedAppointment = ref(null)

function openSlot(slot) {
  selectedSlot.value = slot
  selectedAppointment.value = appointmentsStore.getAppointmentForSlot(slot.id)
  detailsDialog.value = true
}

function removeSelectedSlot() {
  if (!selectedSlot.value) return
  appointmentsStore.removeSlot(selectedSlot.value.id)
  messagesStore.add({ type: 'success', text: 'Créneau supprimé' })
  detailsDialog.value = false
}

function cancelSelectedAppointment() {
  if (!selectedAppointment.value) return
  appointmentsStore.cancelAppointment(selectedAppointment.value.id)
  messagesStore.add({ type: 'success', text: 'Rendez-vous annulé' })
  detailsDialog.value = false
}

function slotIsBooked(slot) {
  return appointmentsStore.isSlotBooked(slot.id)
}

function appointmentForSlot(slot) {
  return appointmentsStore.getAppointmentForSlot(slot.id)
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Calendrier</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiCalendarClockOutline" size="18" class="mr-1" />
              Définissez vos disponibilités et créez des rendez-vous
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center ga-2">
            <v-btn variant="tonal" color="primary" rounded="lg" :prepend-icon="mdiPlus" class="text-none"
              @click="openCreateSlot(null)">
              {{ $vuetify.display.mobile ? 'Créneau' : 'Ajouter un créneau' }}
            </v-btn>
            <v-btn color="primary" rounded="lg" flat :prepend-icon="mdiPlus" class="text-none"
              @click="openCreateMeeting(null)">
              {{ $vuetify.display.mobile ? 'RDV' : 'Nouveau RDV' }}
            </v-btn>
          </v-col>
        </v-row>

        <v-card class="card-shadow pa-4 pa-md-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-4">
            <v-btn :icon="mdiChevronLeft" variant="text" size="small" @click="prevWeek" />
            <div class="flex-grow-1 text-center">
              <div class="text-title-medium font-weight-bold">{{ weekRangeLabel }}</div>
              <v-btn variant="text" size="x-small" color="primary" rounded="lg" class="text-none mt-1"
                @click="goToday">
                Cette semaine
              </v-btn>
            </div>
            <v-btn :icon="mdiChevronRight" variant="text" size="small" @click="nextWeek" />
          </div>

          <div class="week-grid">
            <div v-for="(day, idx) in weekDays" :key="idx" class="day-col"
              :class="{ 'day-col-today': toISODate(day) === todayISO }">
              <div class="day-header">
                <div class="day-header-label">{{ DAY_LABELS[idx] }}</div>
                <div class="day-header-num">{{ day.getDate() }}</div>
              </div>

              <div class="day-slots">
                <div v-if="slotsForDay(day).length === 0" class="day-empty">
                  <v-btn variant="text" size="x-small" color="primary" rounded="lg" class="text-none"
                    :prepend-icon="mdiPlus" @click="openCreateSlot(day)">
                    Ajouter
                  </v-btn>
                </div>

                <button v-for="slot in slotsForDay(day)" :key="slot.id" class="slot-pill"
                  :class="{ 'slot-pill-booked': slotIsBooked(slot) }" @click="openSlot(slot)">
                  <div class="slot-pill-time">
                    <v-icon :icon="mdiClockOutline" size="12" class="mr-1" />
                    {{ slot.startTime }} – {{ slot.endTime }}
                  </div>
                  <div v-if="slotIsBooked(slot)" class="slot-pill-patient">
                    <v-icon :icon="mdiAccountOutline" size="12" class="mr-1" />
                    {{ appointmentForSlot(slot)?.patientFullName }}
                  </div>
                  <div v-else class="slot-pill-status">Disponible</div>
                  <div v-if="establishmentFor(slot.establishmentId)" class="slot-pill-establishment">
                    <v-icon :icon="mdiDomain" size="12" class="mr-1" />
                    {{ establishmentFor(slot.establishmentId).name }}
                  </div>
                </button>

                <button v-if="slotsForDay(day).length > 0" class="day-add-btn" @click="openCreateSlot(day)">
                  <v-icon :icon="mdiPlus" size="14" />
                </button>
              </div>
            </div>
          </div>

          <div class="d-flex align-center justify-center ga-4 mt-4 calendar-legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot-available" />
              <span>Disponible</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot-booked" />
              <span>Réservé</span>
            </div>
          </div>
        </v-card>

      </v-col>
    </v-row>

    <!-- =================== ADD SLOT DIALOG =================== -->
    <v-dialog v-model="slotDialog" max-width="480" :fullscreen="$vuetify.display.mobile">
      <v-card :class="['pa-2', { 'rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">
              {{ isEditingSlot ? 'Modifier le créneau' : 'Nouveau créneau' }}
            </div>
            <div class="text-body-small text-medium-emphasis mt-1">
              {{ isEditingSlot
                ? 'Ajustez la date, l\'horaire ou l\'établissement.'
                : 'Ouvrez une plage disponible pour vos patients.' }}
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="slotDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-form ref="slotFormRef">
            <v-select v-model="slotDraftEstablishmentId" :items="establishmentOptions" item-title="title"
              item-value="value" label="Établissement" variant="outlined" rounded="lg" density="comfortable"
              :rules="[required]" :prepend-inner-icon="mdiDomain" class="mb-2">
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw?.subtitle" />
              </template>
            </v-select>
            <DateFieldFr v-model="slotDraftDate" label="Date" :rules="[required]" class="mb-2" />
            <v-row no-gutters class="ga-2">
              <v-col>
                <TimeFieldFr v-model="slotDraftStart" label="Début" :rules="[required]" />
              </v-col>
              <v-col>
                <TimeFieldFr v-model="slotDraftEnd" label="Fin" :rules="[required, endAfterStart]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="slotDialog = false">Annuler</v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="saveSlot">
            {{ isEditingSlot ? 'Enregistrer' : 'Créer le créneau' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== ADD MEETING DIALOG =================== -->
    <v-dialog v-model="meetingDialog" max-width="520" :fullscreen="$vuetify.display.mobile">
      <v-card :class="['pa-2', { 'rounded-15': !$vuetify.display.mobile }]">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Nouveau rendez-vous</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Planifiez une consultation avec un patient.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="meetingDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-form ref="meetingFormRef">
            <v-select v-model="meetingPatientId" :items="patientOptions" item-title="title" item-value="value"
              label="Patient" variant="outlined" rounded="lg" density="comfortable" :rules="[required]"
              :prepend-inner-icon="mdiAccountOutline" class="mb-2" />
            <v-select v-model="meetingEstablishmentId" :items="establishmentOptions" item-title="title"
              item-value="value" label="Établissement" variant="outlined" rounded="lg" density="comfortable"
              :rules="[required]" :prepend-inner-icon="mdiDomain" class="mb-2">
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw?.subtitle" />
              </template>
            </v-select>
            <DateFieldFr v-model="meetingDate" label="Date" :rules="[required]" class="mb-2" />
            <v-row no-gutters class="ga-2 mb-2">
              <v-col>
                <TimeFieldFr v-model="meetingStart" label="Début" :rules="[required]" />
              </v-col>
              <v-col>
                <TimeFieldFr v-model="meetingEnd" label="Fin" :rules="[required]" />
              </v-col>
            </v-row>
            <v-textarea v-model="meetingNotes" label="Notes (optionnel)" variant="outlined" rounded="lg" rows="2"
              auto-grow :prepend-inner-icon="mdiNotebookOutline" />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="meetingDialog = false">Annuler</v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="saveMeeting">Créer le RDV</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== SLOT DETAILS DIALOG =================== -->
    <v-dialog v-model="detailsDialog" max-width="440" :fullscreen="false">
      <v-card v-if="selectedSlot" class="pa-2 rounded-15">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">
              {{ selectedAppointment ? 'Rendez-vous' : 'Créneau disponible' }}
            </div>
            <div class="text-body-small text-medium-emphasis mt-1">
              {{ selectedSlot.date }} · {{ selectedSlot.startTime }} – {{ selectedSlot.endTime }}
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="detailsDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <template v-if="selectedAppointment">
            <div class="info-line">
              <v-icon :icon="mdiAccountOutline" size="18" class="mr-2" color="primary" />
              <strong>{{ selectedAppointment.patientFullName }}</strong>
            </div>
            <div v-if="selectedAppointment.notes" class="info-line align-start mt-2">
              <v-icon :icon="mdiNotebookOutline" size="18" class="mr-2 mt-1" color="medium-emphasis" />
              <span class="text-body-medium">{{ selectedAppointment.notes }}</span>
            </div>
          </template>
          <template v-else>
            <div class="text-body-medium text-medium-emphasis">
              Ce créneau est ouvert à la réservation par vos patients.
            </div>
          </template>
          <div v-if="establishmentFor(selectedSlot.establishmentId)" class="establishment-card mt-3">
            <v-icon :icon="mdiDomain" size="18" class="mr-2" color="primary" />
            <div>
              <div class="font-weight-bold text-body-medium">
                {{ establishmentFor(selectedSlot.establishmentId).name }}
              </div>
              <div v-if="establishmentFor(selectedSlot.establishmentId).location"
                class="text-body-small text-medium-emphasis d-flex align-center mt-1">
                <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" />
                {{ establishmentFor(selectedSlot.establishmentId).location }}
              </div>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn v-if="selectedAppointment" variant="text" color="error" rounded="lg"
            :prepend-icon="mdiTrashCanOutline" class="text-none" @click="cancelSelectedAppointment">
            Annuler le RDV
          </v-btn>
          <template v-else>
            <v-btn variant="text" color="error" rounded="lg" :prepend-icon="mdiTrashCanOutline"
              class="text-none" @click="removeSelectedSlot">
              Supprimer
            </v-btn>
            <v-btn variant="tonal" color="primary" rounded="lg" :prepend-icon="mdiPencilOutline"
              class="text-none ml-2" @click="editSelectedSlot">
              Modifier
            </v-btn>
          </template>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="detailsDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-col {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.015);
  min-height: 200px;
}

.day-col-today {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.04);
}

.day-header {
  text-align: center;
  padding: 10px 4px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.day-header-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.5);
}

.day-header-num {
  font-size: 18px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.85);
  margin-top: 2px;
}

.day-col-today .day-header-num {
  color: rgb(var(--v-theme-primary));
}

.day-slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 6px;
  flex-grow: 1;
}

.day-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  opacity: 0.6;
}

.slot-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slot-pill:hover {
  background: rgba(var(--v-theme-primary), 0.12);
  transform: translateY(-1px);
}

.slot-pill:active {
  transform: translateY(0);
}

.slot-pill-time {
  font-size: 11.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
}

.slot-pill-status {
  font-size: 10.5px;
  color: rgba(0, 0, 0, 0.55);
}

.slot-pill-patient {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
}

.slot-pill-establishment {
  font-size: 10.5px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.establishment-card {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.slot-pill-booked {
  border-color: rgba(var(--v-theme-success), 0.35);
  background: rgba(var(--v-theme-success), 0.08);
}

.slot-pill-booked .slot-pill-time {
  color: rgb(var(--v-theme-success));
}

.day-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  background: transparent;
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  transition: border-color 0.18s ease, color 0.18s ease;
}

.day-add-btn:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  color: rgb(var(--v-theme-primary));
}

.calendar-legend {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-dot-available {
  background: rgba(var(--v-theme-primary), 0.5);
}

.legend-dot-booked {
  background: rgba(var(--v-theme-success), 0.6);
}

.info-line {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

@media (max-width: 768px) {
  .week-grid {
    grid-template-columns: 1fr;
  }

  .day-col {
    min-height: 0;
  }
}
</style>
