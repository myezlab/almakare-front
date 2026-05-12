<script setup>
import patientsData from '@/data/patients.json'
import { useSelfStore } from '@/stores/self'
import {
  mdiAccountSearchOutline,
  mdiChevronRight,
  mdiMagnify,
  mdiStethoscope,
} from '@mdi/js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

dayjs.locale('fr')

const router = useRouter()
const selfStore = useSelfStore()

const HOSPITALIZATION_TOTAL_STEPS = 8
const search = ref('')

const filteredPatients = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return patientsData
  return patientsData.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q),
  )
})

function age(birthDate) {
  return dayjs().diff(dayjs(birthDate), 'year')
}

function progress(step) {
  return Math.round((step / HOSPITALIZATION_TOTAL_STEPS) * 100)
}

function epworthColor(score) {
  if (score == null) return 'grey'
  if (score <= 10) return 'success'
  if (score <= 15) return 'warning'
  return 'error'
}

function genderInitial(gender) {
  return gender === 'female' ? 'Mme' : 'M.'
}

function openPatient(patient) {
  router.push({ name: 'DoctorPatientJourney', params: { id: patient.id } })
}
</script>

<template>
  <div>
    <v-row v-if="selfStore.item.id" justify="center" class="mt-8  mb-16 pb-10">
      <v-col :cols="$vuetify.display.mobile ? 12 : 10">

        <v-row class="mb-6 " align="center" :class="{ 'mx-6': $vuetify.display.mobile }">
          <v-col align-self="center">
            <div class="text-headline-medium font-weight-bold">Tableau de bord</div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              <v-icon :icon="mdiStethoscope" size="18" class="mr-1" />
              Espace médecin
            </div>
          </v-col>
        </v-row>

        <v-card class="pa-6 card-shadow " :class="{ 'rounded-15': !$vuetify.display.mobile }">
          <v-row align="center" class="mb-2">
            <v-col>
              <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
                Mes patients
              </div>
              <div class="text-body-medium text-medium-emphasis">
                {{ filteredPatients.length }} patient{{ filteredPatients.length > 1 ? 's' : '' }}
                en cours de suivi
              </div>
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field v-model="search" :prepend-inner-icon="mdiMagnify" placeholder="Rechercher un patient"
                variant="outlined" rounded="lg" density="comfortable" hide-details clearable />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-list lines="three" class="pa-0">
            <template v-for="(patient, idx) in filteredPatients" :key="patient.id">
              <v-list-item class="px-2 py-3 rounded-lg patient-item" @click="openPatient(patient)">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="48" class="mr-3">
                    <span class="text-title-small font-weight-bold">
                      {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">
                  {{ genderInitial(patient.gender) }} {{ patient.firstName }} {{ patient.lastName }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-body-small text-medium-emphasis mt-1">
                  {{ age(patient.birthDate) }} ans · Dernière visite
                  {{ dayjs(patient.lastVisit).format('DD MMM YYYY') }}
                </v-list-item-subtitle>

                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip size="x-small" variant="tonal" color="primary">
                    Étape {{ patient.hospitalizationStep }} / {{ HOSPITALIZATION_TOTAL_STEPS }}
                  </v-chip>
                  <v-chip v-if="patient.epworthScore != null" size="x-small" variant="tonal"
                    :color="epworthColor(patient.epworthScore)">
                    Epworth {{ patient.epworthScore }}
                  </v-chip>
                </div>

                <template #append>
                  <div class="d-flex align-center ga-3">
                    <v-progress-circular :model-value="progress(patient.hospitalizationStep)" color="primary" size="42"
                      width="4">
                      <span class="text-body-small font-weight-bold">
                        {{ patient.hospitalizationStep }}
                      </span>
                    </v-progress-circular>
                    <v-icon :icon="mdiChevronRight" color="medium-emphasis" />
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="idx < filteredPatients.length - 1" />
            </template>

            <v-list-item v-if="filteredPatients.length === 0" class="py-8 text-center">
              <v-icon :icon="mdiAccountSearchOutline" size="48" color="medium-emphasis" class="mb-3" />
              <div class="text-body-medium text-medium-emphasis">
                Aucun patient ne correspond à votre recherche.
              </div>
            </v-list-item>
          </v-list>
        </v-card>

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.rounded-15 {
  border-radius: 15px !important;
}

.patient-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.patient-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>
