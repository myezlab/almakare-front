<script setup>
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { getAvailability } from "@/data/doctorAvailability"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiArrowLeft,
  mdiCalendarCheckOutline,
  mdiCheckCircleOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiMapMarkerOutline,
  mdiStethoscope
} from "@mdi/js"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const router = useRouter()
const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { mobile } = useDisplay()

const medecinTraitant = computed(() => selfStore.item?.medecinTraitant || null)
const doctorName = computed(() => {
  const d = medecinTraitant.value
  if (!d) return ''
  return `Dr. ${[d.firstName, d.lastName].filter(Boolean).join(' ').trim()}`
})
const cabinetAddress = computed(() => {
  const d = medecinTraitant.value
  if (!d) return ''
  return `Cabinet ${doctorName.value} — ${d.city || ''}`.trim()
})

const availability = ref(getAvailability(21))

// Pagination — show 3 days at once on desktop, 1 on mobile
const pageSize = computed(() => (mobile.value ? 1 : 3))
const pageIndex = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(availability.value.length / pageSize.value)))
const visibleDays = computed(() => {
  const start = pageIndex.value * pageSize.value
  return availability.value.slice(start, start + pageSize.value)
})

function prevPage() {
  if (pageIndex.value > 0) pageIndex.value--
}
function nextPage() {
  if (pageIndex.value < totalPages.value - 1) pageIndex.value++
}

const selected = ref(null) // { date, time }

function selectSlot(date, slot) {
  if (!slot.available) return
  selected.value = { date, time: slot.time }
}

function isSelected(date, time) {
  return selected.value && selected.value.date === date && selected.value.time === time
}

const confirmDialogOpen = ref(false)
const booking = ref(false)

function openConfirm() {
  if (!selected.value) return
  confirmDialogOpen.value = true
}

async function confirmBooking() {
  booking.value = true
  try {
    // Fake booking — just success then redirect
    await new Promise((r) => setTimeout(r, 400))
    messagesStore.add({
      type: 'success',
      text: `Rendez-vous confirmé le ${ISOToDDMMYYYY(selected.value.date)} à ${selected.value.time}`,
    })
    confirmDialogOpen.value = false
    router.push({ path: '/mon-dossier', query: { tab: 'activites' } })
  } finally {
    booking.value = false
  }
}

function goBack() {
  router.push({ path: '/mon-dossier' })
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-6 mb-16 pb-10" :class="{ 'mx-6': !$vuetify.display.mobile }">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <!-- =================== HEADER =================== -->
        <div class="d-flex align-center mb-2" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-btn :icon="mdiArrowLeft" variant="text" size="small" class="mr-2" aria-label="Retour" @click="goBack" />
          <div>
            <div class="text-headline-medium font-weight-bold">Prendre rendez-vous</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              Choisissez un créneau disponible dans l'agenda de votre médecin
            </div>
          </div>
        </div>

        <!-- =================== EMPTY STATE — NO DOCTOR =================== -->
        <v-card v-if="!medecinTraitant" class="mt-6 pa-6 card-shadow text-center"
          :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">
          <v-icon :icon="mdiStethoscope" size="48" class="text-medium-emphasis mb-3" />
          <div class="text-title-medium font-weight-bold mb-1">Aucun médecin traitant sélectionné</div>
          <div class="text-body-medium text-medium-emphasis mb-4">
            Sélectionnez d'abord un médecin traitant depuis votre dossier patient.
          </div>
          <v-btn color="primary" variant="flat" rounded="lg" class="text-none" @click="goBack">
            Retour à mon dossier
          </v-btn>
        </v-card>

        <template v-else>

          <!-- =================== DOCTOR CARD =================== -->
          <v-card class="mt-4 pa-5 card-shadow"
            :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">
            <div class="d-flex align-center ga-3 mb-2">
              <v-icon :icon="mdiStethoscope" color="primary" size="24" />
              <div>
                <div class="text-title-medium font-weight-bold">{{ doctorName }}</div>
                <div v-if="medecinTraitant?.specialty" class="text-body-small text-medium-emphasis">
                  {{ medecinTraitant.specialty }}
                </div>
              </div>
            </div>
            <v-alert type="info" variant="tonal" :icon="mdiMapMarkerOutline" density="comfortable" rounded="lg"
              class="mt-3">
              <div class="text-body-medium font-weight-medium">{{ cabinetAddress }}</div>
              <div class="text-body-small text-medium-emphasis">Type consultation : Cabinet</div>
            </v-alert>
          </v-card>

          <!-- =================== AVAILABILITY =================== -->
          <v-card class="mt-4 pa-5 card-shadow"
            :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">

            <div class="d-flex align-center justify-space-between mb-4">
              <div class="text-title-medium font-weight-bold">Créneaux disponibles</div>
              <div class="d-flex align-center ga-1">
                <v-btn :icon="mdiChevronLeft" variant="text" size="small" :disabled="pageIndex === 0"
                  aria-label="Précédent" @click="prevPage" />
                <span class="text-body-small text-medium-emphasis px-1">
                  {{ pageIndex + 1 }} / {{ totalPages }}
                </span>
                <v-btn :icon="mdiChevronRight" variant="text" size="small"
                  :disabled="pageIndex >= totalPages - 1" aria-label="Suivant" @click="nextPage" />
              </div>
            </div>

            <v-row v-if="visibleDays.length">
              <v-col v-for="day in visibleDays" :key="day.date" cols="12" :md="12 / pageSize">
                <div class="day-header">
                  <div class="text-title-small font-weight-bold text-capitalize">{{ day.weekday }}</div>
                  <div class="text-body-small text-medium-emphasis text-capitalize">{{ day.label }}</div>
                </div>
                <div class="slots-grid mt-3">
                  <v-btn v-for="slot in day.slots" :key="day.date + slot.time"
                    :color="isSelected(day.date, slot.time) ? 'primary' : undefined"
                    :variant="isSelected(day.date, slot.time) ? 'flat' : 'outlined'"
                    :disabled="!slot.available" rounded="lg" size="small" class="text-none slot-btn"
                    @click="selectSlot(day.date, slot)">
                    {{ slot.time }}
                  </v-btn>
                </div>
              </v-col>
            </v-row>

            <div v-else class="text-center text-medium-emphasis pa-4">
              Aucun créneau disponible
            </div>
          </v-card>

          <!-- =================== CONFIRM BAR =================== -->
          <v-card class="mt-4 pa-4 card-shadow d-flex flex-wrap align-center ga-3"
            :class="{ 'rounded-15': !$vuetify.display.mobile, 'mx-6': $vuetify.display.mobile }">
            <div class="flex-grow-1">
              <div v-if="selected" class="d-flex align-center ga-2">
                <v-icon :icon="mdiCheckCircleOutline" color="success" />
                <div>
                  <div class="text-body-medium font-weight-bold">Créneau sélectionné</div>
                  <div class="text-body-small text-medium-emphasis text-capitalize">
                    {{ ISOToDDMMYYYY(selected.date) }} à {{ selected.time }}
                  </div>
                </div>
              </div>
              <div v-else class="text-body-medium text-medium-emphasis">
                Sélectionnez un créneau pour continuer
              </div>
            </div>
            <v-btn :prepend-icon="mdiCalendarCheckOutline" color="primary" variant="flat" rounded="lg" size="large"
              class="text-none" :disabled="!selected" @click="openConfirm">
              Confirmer le rendez-vous
            </v-btn>
          </v-card>

        </template>

      </v-col>
    </v-row>

    <!-- =================== CONFIRM DIALOG =================== -->
    <v-dialog v-model="confirmDialogOpen" max-width="440">
      <v-card class="card-shadow rounded-15">
        <v-card-title class="pa-4 text-title-large font-weight-bold">
          Confirmer le rendez-vous
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="text-body-medium mb-3">
            Vous êtes sur le point de prendre rendez-vous avec :
          </div>
          <div class="text-body-medium font-weight-bold">{{ doctorName }}</div>
          <div v-if="selected" class="text-body-medium text-capitalize mt-1">
            Le {{ ISOToDDMMYYYY(selected.date) }} à {{ selected.time }}
          </div>
          <div class="text-body-small text-medium-emphasis mt-3">
            {{ cabinetAddress }}
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" rounded="lg" class="text-none" @click="confirmDialogOpen = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="booking"
            @click="confirmBooking">
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.day-header {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.slot-btn {
  min-width: 0 !important;
}
</style>
