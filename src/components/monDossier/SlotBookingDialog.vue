<script setup>
// Lets the patient book the établissement + créneau for an acte performed away
// from the doctor's cabinet (e.g. a polygraphie ventilatoire nocturne at a sleep
// lab). Reuses the exact building blocks of the "Prendre rendez-vous" page — the
// same getAvailability() agenda and the paginated slots grid.
//
// Flow: pick a "Lieu du rendez-vous" from a v-menu of établissements → the
// availability grid appears → pick a slot → "Valider le créneau" emits the
// booking to the parent (which then surfaces the Lieu / Date cards in the panel).
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { getSleepRecordingSlots } from "@/data/doctorAvailability"
import {
  mdiCalendarCheckOutline,
  mdiCheckCircleOutline,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiMapMarkerOutline
} from "@mdi/js"
import { computed, ref, watch } from "vue"
import { useDisplay } from "vuetify"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  establishments: { type: Array, default: () => [] },
  // Pre-fill when re-opening to edit a booking already made: { establishmentId, date, time }.
  booking: { type: Object, default: null }
})

const emit = defineEmits(["update:modelValue", "confirm"])

const { mobile } = useDisplay()

const selectedEstablishment = ref(null)
const selected = ref(null) // { date, time }

const availability = ref(getSleepRecordingSlots(21))

// Desktop paginates 3 days at a time behind chevrons; mobile drops pagination
// entirely and shows every day in one scrollable list (the dialog is fullscreen
// + scrollable there), so the patient just scrolls to the day they want.
const pageSize = 3
const pageIndex = ref(0)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(availability.value.length / pageSize))
)
const visibleDays = computed(() => {
  if (mobile.value) return availability.value
  const start = pageIndex.value * pageSize
  return availability.value.slice(start, start + pageSize)
})

function prevPage() {
  if (pageIndex.value > 0) pageIndex.value--
}
function nextPage() {
  if (pageIndex.value < totalPages.value - 1) pageIndex.value++
}

// Restore (or reset) the selection every time the dialog opens.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    pageIndex.value = 0
    const b = props.booking
    selectedEstablishment.value = b
      ? props.establishments.find((e) => e.id === b.establishmentId) || null
      : null
    selected.value = b ? { date: b.date, time: b.time } : null
  },
  { immediate: true }
)

function pickEstablishment(establishment) {
  selectedEstablishment.value = establishment
}

function selectSlot(date, slot) {
  if (!slot.available) return
  selected.value = { date, time: slot.time }
}

function isSelected(date, time) {
  return selected.value && selected.value.date === date && selected.value.time === time
}

// LocationCard wants a single string; DateCard wants an ISO start.
const locationName = computed(() =>
  selectedEstablishment.value
    ? `${selectedEstablishment.value.name} — ${selectedEstablishment.value.address}`
    : ""
)
const selectedStartAt = computed(() =>
  selected.value ? `${selected.value.date}T${selected.value.time}:00` : ""
)

const ready = computed(() => !!selectedEstablishment.value && !!selected.value)

function close() {
  emit("update:modelValue", false)
}

function confirm() {
  if (!ready.value) return
  emit("confirm", {
    establishmentId: selectedEstablishment.value.id,
    establishmentName: selectedEstablishment.value.name,
    locationName: locationName.value,
    date: selected.value.date,
    time: selected.value.time,
    startAt: selectedStartAt.value
  })
}
</script>

<template>
  <v-dialog :model-value="modelValue" :fullscreen="mobile" :max-width="mobile ? undefined : 720" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card class="card-shadow" :class="{ 'rounded-15': !mobile }">
      <v-card-item class="pa-4">
        <template #prepend>
          <div class="slot-icon" aria-hidden="true">
            <v-icon :icon="mdiCalendarCheckOutline" size="24" />
          </div>
        </template>
        <v-card-title class="text-headline-small font-weight-bold text-wrap">
          Sélectionner un créneau
        </v-card-title>
        <v-card-subtitle class="text-body-medium text-medium-emphasis text-wrap mt-1">
          Choisissez l'établissement du sommeil puis un créneau disponible.
        </v-card-subtitle>
        <template #append>
          <v-btn :icon="mdiClose" variant="text" density="comfortable" aria-label="Fermer" @click="close" />
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text class="pa-4">

        <!-- =================== LIEU DU RENDEZ-VOUS (v-menu) =================== -->
        <div class="text-title-small font-weight-bold mb-2">Lieu du rendez-vous</div>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" variant="outlined" rounded="lg" block size="large"
              class="text-none establishment-btn">
              <!-- Icons live inside the default slot (not #prepend/#append) so the
                   chevron stays within the button bounds on narrow screens. -->
              <div class="d-flex align-center w-100">
                <v-icon :icon="mdiMapMarkerOutline" class="mr-2 flex-shrink-0" />
                <span class="text-truncate flex-grow-1 text-start">
                  {{ selectedEstablishment ? selectedEstablishment.name : "Sélectionnez un établissement" }}
                </span>
                <v-icon :icon="mdiChevronDown" class="ml-2 flex-shrink-0" />
              </div>
            </v-btn>
          </template>
          <v-list density="comfortable" rounded="lg" class="card-shadow">
            <v-list-item v-for="establishment in establishments" :key="establishment.id"
              :active="selectedEstablishment?.id === establishment.id" :prepend-icon="mdiMapMarkerOutline"
              @click="pickEstablishment(establishment)">
              <v-list-item-title class="font-weight-medium">{{ establishment.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ establishment.address }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- =================== AVAILABILITY (shown once a lieu is chosen) =================== -->
        <template v-if="selectedEstablishment">
          <div class="d-flex align-center justify-space-between mt-6 mb-3">
            <div class="text-title-small font-weight-bold">Créneaux disponibles</div>
            <div v-if="!mobile" class="d-flex align-center ga-1">
              <v-btn :icon="mdiChevronLeft" variant="text" size="small" :disabled="pageIndex === 0"
                aria-label="Précédent" @click="prevPage" />
              <span class="text-body-small text-medium-emphasis px-1">{{ pageIndex + 1 }} / {{ totalPages }}</span>
              <v-btn :icon="mdiChevronRight" variant="text" size="small" :disabled="pageIndex >= totalPages - 1"
                aria-label="Suivant" @click="nextPage" />
            </div>
          </div>

          <v-row v-if="visibleDays.length">
            <v-col v-for="day in visibleDays" :key="day.date" cols="12" :md="12 / pageSize">
              <div class="day-header">
                <div class="text-title-small font-weight-bold text-capitalize">{{ day.weekday }}</div>
                <div class="text-body-small text-medium-emphasis text-capitalize">{{ day.label }}</div>
              </div>
              <div class="slots-grid mt-3">
                <v-btn v-for="slot in day.slots" :key="day.date + slot.time" block
                  :color="isSelected(day.date, slot.time) ? 'primary' : undefined"
                  :variant="isSelected(day.date, slot.time) ? 'flat' : 'outlined'" :disabled="!slot.available"
                  rounded="lg" class="text-none slot-btn" @click="selectSlot(day.date, slot)">
                  {{ slot.label }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
          <div v-else class="text-center text-medium-emphasis pa-4">Aucun créneau disponible</div>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <div v-if="ready" class="d-flex align-center ga-2">
          <v-icon :icon="mdiCheckCircleOutline" color="success" />
          <div class="text-body-small text-medium-emphasis text-capitalize">
            {{ ISOToDDMMYYYY(selected.date) }} à {{ selected.time }}
          </div>
        </div>
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn :prepend-icon="mdiCalendarCheckOutline" color="primary" variant="flat" rounded="lg" class="text-none"
          :disabled="!ready" @click="confirm">
          Valider le créneau
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.slot-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
}

.establishment-btn :deep(.v-btn__content) {
  width: 100%;
}

.day-header {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.slots-grid {
  display: grid;
  /* Sleep-recording slots carry wide range labels (e.g. "20h00 → 07h00"),
     so cells need room — one per row when the column is narrow. */
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.slot-btn {
  min-width: 0 !important;
}
</style>
