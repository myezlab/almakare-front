<script setup>
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiClockOutline,
  mdiPencil,
  mdiPill,
  mdiPlus,
  mdiTrashCanOutline,
} from "@mdi/js"
import { computed, nextTick, ref, watch } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const FREQUENCY_OPTIONS = [
  { value: 'morning', label: 'Matin' },
  { value: 'noon', label: 'Midi' },
  { value: 'evening', label: 'Soir' },
  { value: 'bedtime', label: 'Au coucher' },
  { value: 'asNeeded', label: 'Au besoin' },
]
const FREQUENCY_LABELS = Object.fromEntries(FREQUENCY_OPTIONS.map(f => [f.value, f.label]))

if (!Array.isArray(selfStore.item.treatments)) selfStore.item.treatments = []

const treatments = computed(() => selfStore.item.treatments || [])
const hasTreatments = computed(() => selfStore.item.hasTreatments ?? null)

const dialogOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref(null)
const nameInputRef = ref(null)

const form = ref({ name: '', dosage: '', frequency: [] })

const dialogTitle = computed(() => editingId.value ? 'Modifier le traitement' : 'Ajouter un traitement')

function setHasTreatments(value) {
  selfStore.item.hasTreatments = value
}

function openAdd() {
  editingId.value = null
  form.value = { name: '', dosage: '', frequency: [] }
  dialogOpen.value = true
  nextTick(() => nameInputRef.value?.focus?.())
}

function openEdit(treatment) {
  editingId.value = treatment.id
  form.value = {
    name: treatment.name || '',
    dosage: treatment.dosage || '',
    frequency: Array.isArray(treatment.frequency) ? [...treatment.frequency] : [],
  }
  dialogOpen.value = true
  nextTick(() => nameInputRef.value?.focus?.())
}

function closeDialog() {
  dialogOpen.value = false
  editingId.value = null
}

async function handleSave() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      dosage: form.value.dosage.trim(),
      frequency: [...form.value.frequency],
    }
    const list = [...(selfStore.item.treatments || [])]
    if (editingId.value) {
      const idx = list.findIndex(t => t.id === editingId.value)
      if (idx >= 0) list[idx] = { ...list[idx], ...payload }
      selfStore.item.treatments = list
      messagesStore.add({ type: 'success', text: 'Traitement mis à jour' })
    } else {
      list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...payload,
      })
      selfStore.item.treatments = list
      if (selfStore.item.hasTreatments !== true) selfStore.item.hasTreatments = true
      messagesStore.add({ type: 'success', text: 'Traitement ajouté' })
    }
    closeDialog()
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement" })
  } finally {
    saving.value = false
  }
}

function removeTreatment(id) {
  selfStore.item.treatments = (selfStore.item.treatments || []).filter(t => t.id !== id)
  messagesStore.add({ type: 'success', text: 'Traitement supprimé' })
}

watch(dialogOpen, (open) => {
  if (!open) editingId.value = null
})

function formatFrequency(list) {
  if (!list?.length) return ''
  return list.map(v => FREQUENCY_LABELS[v] || v).join(' · ')
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow pa-6" :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <!-- =================== HEADER =================== -->
        <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <div class="text-headline-small font-weight-bold">Mes traitements</div>
            <div class="text-body-small text-medium-emphasis">
              Listez les traitements que vous prenez actuellement.
            </div>
          </div>
          <v-btn v-if="hasTreatments !== false" color="primary" variant="flat" rounded="lg" size="small"
            class="text-none" :prepend-icon="mdiPlus" @click="openAdd">
            Ajouter un traitement
          </v-btn>
        </div>

        <!-- =================== HAS-TREATMENTS QUESTION =================== -->
        <div v-if="hasTreatments == null && treatments.length === 0" class="prompt-card">
          <v-icon :icon="mdiPill" size="22" class="prompt-card-icon" />
          <div class="flex-grow-1">
            <div class="text-body-medium font-weight-medium">Suivez-vous un traitement en cours&nbsp;?</div>
            <div class="text-body-small text-medium-emphasis">
              Indiquez-le pour compléter votre dossier médical.
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="outlined" rounded="lg" size="small" class="text-none"
              @click="setHasTreatments(false)">
              Non
            </v-btn>
            <v-btn color="primary" variant="flat" rounded="lg" size="small" class="text-none"
              @click="setHasTreatments(true); openAdd()">
              Oui, en ajouter
            </v-btn>
          </div>
        </div>

        <!-- =================== "NO TREATMENTS" STATE =================== -->
        <div v-else-if="hasTreatments === false && treatments.length === 0" class="no-treatments">
          <div class="d-flex align-center">
            <v-icon :icon="mdiPill" size="22" class="mr-3 text-medium-emphasis" />
            <div class="flex-grow-1">
              <div class="text-body-medium font-weight-medium">Aucun traitement déclaré</div>
              <div class="text-body-small text-medium-emphasis">
                Vous avez indiqué ne suivre aucun traitement actuellement.
              </div>
            </div>
            <v-btn variant="text" rounded="lg" size="small" class="text-none" @click="setHasTreatments(null)">
              Modifier
            </v-btn>
          </div>
        </div>

        <!-- =================== EMPTY STATE (yes but none added yet) =================== -->
        <div v-else-if="treatments.length === 0" class="empty-state">
          <v-icon :icon="mdiPill" size="28" class="mb-2 text-medium-emphasis" />
          <div class="text-body-medium font-weight-medium">Aucun traitement pour le moment</div>
          <div class="text-body-small text-medium-emphasis mb-3">
            Ajoutez votre premier traitement pour commencer.
          </div>
          <v-btn color="primary" variant="tonal" rounded="lg" size="small" class="text-none"
            :prepend-icon="mdiPlus" @click="openAdd">
            Ajouter un traitement
          </v-btn>
        </div>

        <!-- =================== LIST =================== -->
        <div v-else class="d-flex flex-column ga-2">
          <div v-for="t in treatments" :key="t.id" class="treatment-row">
            <div class="treatment-row-icon">
              <v-icon :icon="mdiPill" size="22" />
            </div>
            <div class="flex-grow-1 min-w-0">
              <div class="text-body-medium font-weight-bold text-truncate">{{ t.name }}</div>
              <div v-if="t.dosage" class="text-body-small text-medium-emphasis text-truncate">
                {{ t.dosage }}
              </div>
              <div v-if="t.frequency?.length" class="d-flex flex-wrap ga-1 mt-1">
                <v-chip v-for="f in t.frequency" :key="f" size="x-small" variant="tonal" color="primary"
                  :prepend-icon="mdiClockOutline">
                  {{ FREQUENCY_LABELS[f] || f }}
                </v-chip>
              </div>
            </div>
            <div class="d-flex ga-1">
              <v-btn :icon="mdiPencil" variant="text" size="small" density="comfortable" @click="openEdit(t)" />
              <v-btn :icon="mdiTrashCanOutline" variant="text" size="small" density="comfortable" color="error"
                @click="removeTreatment(t.id)" />
            </div>
          </div>
        </div>

      </v-card>
    </v-col>

    <!-- =================== ADD / EDIT DIALOG =================== -->
    <v-dialog v-model="dialogOpen" max-width="500" :fullscreen="$vuetify.display.mobile" scrollable>
      <v-card class="pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
        <v-card-title class="d-flex align-center px-4 pt-4 pb-0">
          <span class="text-headline-small font-weight-bold">{{ dialogTitle }}</span>
        </v-card-title>
        <v-card-text class="px-4 pt-4">
          <v-form ref="formRef" @submit.prevent="handleSave">
            <v-text-field ref="nameInputRef" v-model.trim="form.name" label="Nom du traitement"
              placeholder="Ex. Donormyl" variant="outlined" rounded="lg"
              :rules="[v => !!v?.trim() || 'Ce champ est requis']" class="mb-2" />
            <v-text-field v-model.trim="form.dosage" label="Posologie (optionnel)"
              placeholder="Ex. 10 mg, 1 comprimé" variant="outlined" rounded="lg" class="mb-2" />
            <div class="field-label mb-2">Moment(s) de prise</div>
            <v-chip-group v-model="form.frequency" multiple column selected-class="chip-selected">
              <v-chip v-for="opt in FREQUENCY_OPTIONS" :key="opt.value" :value="opt.value" variant="outlined"
                rounded="lg" filter>
                {{ opt.label }}
              </v-chip>
            </v-chip-group>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="text-none" @click="closeDialog">Annuler</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="saving"
            @click="handleSave">
            {{ editingId ? 'Enregistrer' : 'Ajouter' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.prompt-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  flex-wrap: wrap;
}

.prompt-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.no-treatments {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 16px;
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
}

.treatment-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.treatment-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.02);
}

.treatment-row-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
}

.min-w-0 {
  min-width: 0;
}
</style>
