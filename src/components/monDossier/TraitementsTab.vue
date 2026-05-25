<script setup>
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { mdiCheck, mdiClose, mdiFileDocumentOutline, mdiPencil } from "@mdi/js"
import { ref } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const openPanels = ref([])

const editingMachine = ref(false)
const savingMachine = ref(false)
const machineFormRef = ref(null)

if (!selfStore.item.machine || typeof selfStore.item.machine !== 'object') {
  selfStore.item.machine = {}
}

const machineModel = ref({
  brand: '',
  model: '',
  serialNumber: '',
  pressure: '',
  mask: '',
  startDate: '',
})

function startEditMachine() {
  const m = selfStore.item.machine || {}
  machineModel.value = {
    brand: m.brand || '',
    model: m.model || '',
    serialNumber: m.serialNumber || '',
    pressure: m.pressure || '',
    mask: m.mask || '',
    startDate: m.startDate || '',
  }
  editingMachine.value = true
}

function cancelEditMachine() {
  editingMachine.value = false
}

async function saveMachine() {
  const { valid } = await machineFormRef.value.validate()
  if (!valid) return
  savingMachine.value = true
  try {
    selfStore.item.machine = { ...machineModel.value }
    messagesStore.add({ type: 'success', text: 'Données machine enregistrées' })
    editingMachine.value = false
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement" })
  } finally {
    savingMachine.value = false
  }
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow"
        :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <!-- Traitements par DAP -->
        <v-expansion-panel value="dap">
          <v-expansion-panel-title>
            <span class="panel-title">Traitements par DAP</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="d-flex flex-column align-center text-center pa-6 empty-state">
              <div class="empty-state-icon mb-3">
                <v-icon :icon="mdiFileDocumentOutline" size="32" />
              </div>
              <div class="text-title-medium font-weight-bold mb-1">Aucun traitement par DAP</div>
              <div class="text-body-small text-medium-emphasis">
                Vos demandes d'accord préalable apparaîtront ici.
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Données machine -->
        <v-expansion-panel value="machine">
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-grow-1">
              <span class="panel-title">Données machine</span>
              <v-spacer />
              <v-btn v-if="!editingMachine" :icon="mdiPencil" variant="text" size="small" density="comfortable"
                class="mr-2" @click.stop="startEditMachine" />
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- VIEW MODE -->
            <template v-if="!editingMachine">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="field-label">Marque</div>
                  <div class="field-value">{{ selfStore.item.machine?.brand || '-' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Modèle</div>
                  <div class="field-value">{{ selfStore.item.machine?.model || '-' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Numéro de série</div>
                  <div class="field-value">{{ selfStore.item.machine?.serialNumber || '-' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Pression</div>
                  <div class="field-value">{{ selfStore.item.machine?.pressure || '-' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Masque</div>
                  <div class="field-value">{{ selfStore.item.machine?.mask || '-' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="field-label">Date de mise en service</div>
                  <div class="field-value">{{ selfStore.item.machine?.startDate || '-' }}</div>
                </v-col>
              </v-row>
            </template>

            <!-- EDIT MODE -->
            <template v-else>
              <v-form ref="machineFormRef" @submit.prevent="saveMachine">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.brand" label="Marque" variant="outlined" rounded="lg"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.model" label="Modèle" variant="outlined" rounded="lg"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.serialNumber" label="Numéro de série" variant="outlined"
                      rounded="lg" hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.pressure" label="Pression" variant="outlined" rounded="lg"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.mask" label="Masque" variant="outlined" rounded="lg"
                      hide-details="auto" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="machineModel.startDate" label="Date de mise en service"
                      placeholder="JJ/MM/AAAA" variant="outlined" rounded="lg" hide-details="auto" />
                  </v-col>
                </v-row>
                <div class="d-flex justify-end ga-2 mt-4">
                  <v-btn variant="text" rounded="lg" class="text-none" :prepend-icon="mdiClose"
                    @click="cancelEditMachine">
                    Annuler
                  </v-btn>
                  <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :prepend-icon="mdiCheck"
                    :loading="savingMachine" @click="saveMachine">
                    Enregistrer
                  </v-btn>
                </div>
              </v-form>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>

      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

