<script setup>
import { useAppointmentsStore } from '@/stores/appointments'
import { useMessagesStore } from '@/stores/messages'
import { useOrganisationStore } from '@/stores/organisation'
import { useSelfStore } from '@/stores/self'
import { useTeamStore } from '@/stores/team'
import {
  mdiAlertOutline,
  mdiArrowLeft,
  mdiCalendarCheckOutline,
  mdiCalendarClockOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClockOutline,
  mdiClose,
  mdiCloseCircleOutline,
  mdiDoctor,
  mdiDotsVertical,
  mdiHospitalBuilding,
  mdiMapMarkerOutline,
  mdiNotebookOutline,
} from '@mdi/js'
import { computed, ref } from 'vue'

const teamStore = useTeamStore()
const appointmentsStore = useAppointmentsStore()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const organisationStore = useOrganisationStore()

const establishments = computed(() => organisationStore.item.establishments || [])
function establishmentFor(id) {
  if (!id) return null
  return establishments.value.find((e) => e.id === id) || null
}

const doctors = computed(() =>
  teamStore.items.filter((m) => {
    const roles = Array.isArray(m.roles) && m.roles.length > 0 ? m.roles : (m.role ? [m.role] : [])
    return roles.includes('doctor') && m.invitationStatus === 'accepted'
  }),
)

const selectedDoctor = ref(null)

function selectDoctor(doctor) {
  selectedDoctor.value = doctor
}

function clearDoctor() {
  selectedDoctor.value = null
}

function initials(person) {
  return `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase()
}

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
const todayISO = computed(() => toISODate(new Date()))

const weekDays = computed(() =>
  Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  }),
)

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`
  }
  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()]} – ${last.getDate()} ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`
})

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

const doctorSlots = computed(() => {
  if (!selectedDoctor.value) return []
  return appointmentsStore.slotsForDoctor(selectedDoctor.value.id)
})

function availableSlotsForDay(date) {
  const iso = toISODate(date)
  return doctorSlots.value
    .filter((s) => s.date === iso && !appointmentsStore.isSlotBooked(s.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function formatLongDate(date) {
  return `${DAY_LABELS[(date.getDay() === 0 ? 6 : date.getDay() - 1)]} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`
}

const confirmDialog = ref(false)
const confirmSlot = ref(null)
const confirmNotes = ref('')

function openConfirm(slot) {
  confirmSlot.value = slot
  confirmNotes.value = ''
  confirmDialog.value = true
}

function confirmBooking() {
  if (!confirmSlot.value || !selectedDoctor.value) return
  const patient = selfStore.item || {}
  const fullName = patient.fullName
    || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    || patient.email
    || 'Patient'
  const booked = appointmentsStore.bookSlot({
    slotId: confirmSlot.value.id,
    doctorId: selectedDoctor.value.id,
    patientId: patient.id,
    patientFullName: fullName,
    notes: confirmNotes.value.trim(),
  })
  if (!booked) {
    messagesStore.add({ type: 'error', text: 'Ce créneau n\'est plus disponible' })
    confirmDialog.value = false
    return
  }
  messagesStore.add({ type: 'success', text: 'Rendez-vous confirmé' })
  confirmDialog.value = false
  selectedDoctor.value = null
}

const cancelDialog = ref(false)
const appointmentToCancel = ref(null)

function askCancel(appointment) {
  appointmentToCancel.value = appointment
  cancelDialog.value = true
}

function closeCancel() {
  cancelDialog.value = false
  appointmentToCancel.value = null
}

function confirmCancel() {
  if (!appointmentToCancel.value) return
  appointmentsStore.cancelAppointment(appointmentToCancel.value.id)
  messagesStore.add({ type: 'success', text: 'Rendez-vous annulé' })
  closeCancel()
}

const myAppointments = computed(() => {
  const patient = selfStore.item || {}
  return appointmentsStore
    .appointmentsForPatient(patient.id)
    .map((a) => {
      const slot = appointmentsStore.slots.find((s) => s.id === a.slotId)
      const doctor = teamStore.items.find((m) => m.id === a.doctorId)
      return { ...a, slot, doctor }
    })
    .filter((a) => a.slot)
    .sort((a, b) => {
      const da = `${a.slot.date} ${a.slot.startTime}`
      const db = `${b.slot.date} ${b.slot.startTime}`
      return da.localeCompare(db)
    })
})
</script>

<template>
  <div>
    <v-row justify="center" class="mt-8 mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6" align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col cols="auto" v-if="selectedDoctor">
            <v-btn :icon="mdiArrowLeft" variant="text" @click="clearDoctor" aria-label="Retour" />
          </v-col>
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">
              {{ selectedDoctor ? 'Choisir un créneau' : 'Prendre rendez-vous' }}
            </div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiCalendarClockOutline" size="18" class="mr-1" />
              <template v-if="selectedDoctor">
                Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}
              </template>
              <template v-else>
                Choisissez un médecin de votre équipe pour voir ses disponibilités
              </template>
            </div>
          </v-col>
        </v-row>

        <!-- =================== UPCOMING APPOINTMENTS =================== -->
        <v-card v-if="!selectedDoctor && myAppointments.length > 0"
          class="card-shadow pa-6 mb-4" :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="text-title-medium font-weight-bold mb-3">
            <v-icon :icon="mdiCalendarCheckOutline" size="20" class="mr-2" color="primary" />
            Mes rendez-vous à venir
          </div>
          <div v-for="a in myAppointments" :key="a.id" class="appt-row">
            <div class="appt-row-icon">
              <v-icon :icon="mdiCalendarCheckOutline" size="22" color="primary" />
            </div>
            <div class="appt-row-main">
              <div class="appt-row-title">
                {{ a.slot.date }} · {{ a.slot.startTime }} – {{ a.slot.endTime }}
              </div>
              <div class="appt-row-sub">
                Dr {{ a.doctor?.firstName }} {{ a.doctor?.lastName }}
                <span v-if="a.notes" class="ml-1">· {{ a.notes }}</span>
              </div>
              <div v-if="establishmentFor(a.slot.establishmentId)" class="appt-row-establishment">
                <v-icon :icon="mdiHospitalBuilding" size="12" class="mr-1" />
                {{ establishmentFor(a.slot.establishmentId).name }}
                <span v-if="establishmentFor(a.slot.establishmentId).location" class="text-medium-emphasis">
                  · {{ establishmentFor(a.slot.establishmentId).location }}
                </span>
              </div>
            </div>
            <v-menu v-if="$vuetify.display.mobile" location="bottom end">
              <template #activator="{ props }">
                <v-btn :icon="mdiDotsVertical" variant="text" size="small" v-bind="props"
                  aria-label="Actions du rendez-vous" />
              </template>
              <v-list density="compact" class="rounded-15">
                <v-list-item :prepend-icon="mdiCloseCircleOutline" base-color="error" @click="askCancel(a)">
                  <v-list-item-title class="text-body-medium">Annuler le RDV</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn v-else variant="text" color="error" size="small" rounded="lg" class="text-none"
              :prepend-icon="mdiCloseCircleOutline" @click="askCancel(a)">
              Annuler
            </v-btn>
          </div>
        </v-card>

        <!-- =================== DOCTOR LIST =================== -->
        <v-card v-if="!selectedDoctor" class="card-shadow pa-6"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="text-title-medium font-weight-bold mb-3">
            Médecins de l'équipe
          </div>
          <div v-if="doctors.length === 0" class="text-body-small text-medium-emphasis text-center pa-6">
            Aucun médecin disponible pour le moment.
          </div>
          <div v-else class="doctor-grid">
            <button v-for="doc in doctors" :key="doc.id" class="doctor-card" @click="selectDoctor(doc)">
              <v-avatar color="primary" variant="tonal" size="64" class="mb-2">
                <v-img v-if="doc.avatarUrl" :src="doc.avatarUrl" cover />
                <span v-else class="text-title-small font-weight-bold">{{ initials(doc) }}</span>
              </v-avatar>
              <div class="doctor-card-name">Dr {{ doc.firstName }} {{ doc.lastName }}</div>
              <div v-if="doc.specialty" class="doctor-card-specialty">{{ doc.specialty }}</div>
              <div class="doctor-card-meta">
                <v-icon :icon="mdiDoctor" size="13" class="mr-1" />
                Médecin
              </div>
            </button>
          </div>
        </v-card>

        <!-- =================== DOCTOR CALENDAR =================== -->
        <v-card v-else class="card-shadow pa-4 pa-md-6"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <div class="d-flex align-center mb-3">
            <v-avatar color="primary" variant="tonal" size="56" class="mr-3">
              <v-img v-if="selectedDoctor.avatarUrl" :src="selectedDoctor.avatarUrl" cover />
              <span v-else class="text-title-small font-weight-bold">{{ initials(selectedDoctor) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-title-medium font-weight-bold">
                Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}
              </div>
              <div class="d-flex flex-wrap align-center ga-2 mt-1">
                <v-chip v-if="selectedDoctor.specialty" size="x-small" variant="tonal" color="primary"
                  class="font-weight-bold">
                  {{ selectedDoctor.specialty }}
                </v-chip>
                <span class="text-body-small text-medium-emphasis">{{ selectedDoctor.email }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedDoctor.description" class="doctor-description mb-4">
            {{ selectedDoctor.description }}
          </div>

          <v-divider class="mb-4" />

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

          <div class="patient-days">
            <div v-for="(day, idx) in weekDays" :key="idx" class="patient-day"
              :class="{ 'patient-day-today': toISODate(day) === todayISO }">
              <div class="patient-day-header">
                <div class="patient-day-name">{{ DAY_LABELS[idx] }}</div>
                <div class="patient-day-num">{{ day.getDate() }}</div>
                <div class="patient-day-month">{{ MONTH_LABELS[day.getMonth()].slice(0, 3) }}.</div>
              </div>
              <div class="patient-day-slots">
                <div v-if="availableSlotsForDay(day).length === 0" class="patient-day-empty">
                  Pas de disponibilité
                </div>
                <button v-for="slot in availableSlotsForDay(day)" :key="slot.id" class="patient-slot"
                  @click="openConfirm(slot)">
                  <div class="patient-slot-time">
                    <v-icon :icon="mdiClockOutline" size="13" class="mr-1" />
                    {{ slot.startTime }} – {{ slot.endTime }}
                  </div>
                  <div v-if="establishmentFor(slot.establishmentId)" class="patient-slot-establishment">
                    <v-icon :icon="mdiHospitalBuilding" size="11" class="mr-1" />
                    {{ establishmentFor(slot.establishmentId).name }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </v-card>

      </v-col>
    </v-row>

    <!-- =================== CONFIRMATION DIALOG =================== -->
    <v-dialog v-model="confirmDialog" max-width="460" :fullscreen="false">
      <v-card v-if="confirmSlot && selectedDoctor" class="pa-2 rounded-15">
        <v-card-title class="px-6 pt-5 pb-2 d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-headline-small font-weight-bold">Confirmer le rendez-vous</div>
            <div class="text-body-small text-medium-emphasis mt-1">
              Vous êtes sur le point de réserver ce créneau.
            </div>
          </div>
          <v-btn :icon="mdiClose" variant="text" size="small" @click="confirmDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <div class="confirm-banner mb-3">
            <div class="confirm-banner-time">
              {{ confirmSlot.startTime }} – {{ confirmSlot.endTime }}
            </div>
            <div class="confirm-banner-date">
              {{ formatLongDate(new Date(confirmSlot.date)) }}
            </div>
          </div>
          <div class="info-line mb-3">
            <v-icon :icon="mdiDoctor" size="18" class="mr-2" color="primary" />
            <strong>Dr {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</strong>
          </div>
          <div v-if="establishmentFor(confirmSlot.establishmentId)" class="establishment-card mb-3">
            <v-icon :icon="mdiHospitalBuilding" size="18" class="mr-2 mt-1" color="primary" />
            <div>
              <div class="font-weight-bold text-body-medium">
                {{ establishmentFor(confirmSlot.establishmentId).name }}
              </div>
              <div v-if="establishmentFor(confirmSlot.establishmentId).location"
                class="text-body-small text-medium-emphasis d-flex align-center mt-1">
                <v-icon :icon="mdiMapMarkerOutline" size="14" class="mr-1" />
                {{ establishmentFor(confirmSlot.establishmentId).location }}
              </div>
            </div>
          </div>
          <v-textarea v-model="confirmNotes" label="Motif (optionnel)" variant="outlined" rounded="lg"
            rows="2" auto-grow :prepend-inner-icon="mdiNotebookOutline" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="confirmDialog = false">Annuler</v-btn>
          <v-btn color="primary" rounded="lg" flat class="text-none ml-2" @click="confirmBooking">
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- =================== CANCEL APPOINTMENT DIALOG =================== -->
    <v-dialog v-model="cancelDialog" max-width="420" :fullscreen="false">
      <v-card v-if="appointmentToCancel" class="pa-2 rounded-15">
        <v-card-text class="px-6 pt-6 pb-2 text-center">
          <div class="cancel-icon-wrap mb-4">
            <v-icon :icon="mdiAlertOutline" size="40" color="error" />
          </div>
          <div class="text-headline-small font-weight-bold mb-2">Annuler ce rendez-vous ?</div>
          <div class="text-body-medium text-medium-emphasis">
            Le créneau du
            <strong>{{ appointmentToCancel.slot?.date }}</strong>
            à
            <strong>{{ appointmentToCancel.slot?.startTime }}</strong>
            avec
            <strong>Dr {{ appointmentToCancel.doctor?.firstName }} {{ appointmentToCancel.doctor?.lastName }}</strong>
            sera libéré.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-row class="ga-2" no-gutters>
            <v-col>
              <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="closeCancel">
                Garder
              </v-btn>
            </v-col>
            <v-col>
              <v-btn color="error" rounded="lg" flat size="large" block class="text-none"
                :prepend-icon="mdiCloseCircleOutline" @click="confirmCancel">
                Annuler le RDV
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.doctor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.doctor-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-2px);
}

.doctor-card:active {
  transform: translateY(0);
}

.doctor-card-name {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.3;
}

.doctor-card-specialty {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 10px;
  border-radius: 999px;
  line-height: 1.4;
}

.doctor-card-meta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
}

.doctor-description {
  font-size: 13.5px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.72);
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.patient-days {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-day {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
}

.patient-day-today {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.04);
}

.patient-day-header {
  flex-shrink: 0;
  width: 64px;
  text-align: center;
}

.patient-day-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: rgba(0, 0, 0, 0.5);
}

.patient-day-num {
  font-size: 22px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.1;
  margin-top: 2px;
}

.patient-day-today .patient-day-num {
  color: rgb(var(--v-theme-primary));
}

.patient-day-month {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  text-transform: lowercase;
  margin-top: 2px;
}

.patient-day-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  flex-grow: 1;
}

.patient-day-empty {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
}

.patient-slot {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  background: white;
  color: rgb(var(--v-theme-primary));
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.patient-slot-time {
  display: inline-flex;
  align-items: center;
}

.patient-slot-establishment {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.establishment-card {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.appt-row-establishment {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
}

.patient-slot:hover {
  background: rgba(var(--v-theme-primary), 0.12);
  transform: translateY(-1px);
}

.patient-slot:active {
  transform: translateY(0);
}

.confirm-banner {
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.confirm-banner-time {
  font-size: 22px;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.3px;
}

.confirm-banner-date {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 2px;
}

.info-line {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.appt-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.appt-row:last-child {
  border-bottom: none;
}

.appt-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  flex-shrink: 0;
}

.appt-row-main {
  flex: 1;
  min-width: 0;
}

.appt-row-title {
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.appt-row-sub {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.cancel-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), 0.12);
}
</style>
