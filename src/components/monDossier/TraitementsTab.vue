<script setup>
import PpcTrackingChart from "@/components/monDossier/PpcTrackingChart.vue"
import { useUrlPanels } from "@/composables/useUrlPanels"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { mdiPencil } from "@mdi/js"
import { ref, watch } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const openPanels = useUrlPanels("trPanels")

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

watch(() => selfStore.item?.machine, (m) => {
  const src = m || {}
  machineModel.value = {
    brand: src.brand || '',
    model: src.model || '',
    serialNumber: src.serialNumber || '',
    pressure: src.pressure || '',
    mask: src.mask || '',
    startDate: src.startDate || '',
  }
}, { immediate: true, deep: true })

function startEditMachine() {
  editingMachine.value = true
  if (!openPanels.value.includes('machine')) openPanels.value.push('machine')
}

function cancelEditMachine(cancel) {
  cancel()
  editingMachine.value = false
}

async function handleSaveMachine(proxyModel, confirmSave) {
  const { valid } = await machineFormRef.value.validate()
  if (!valid) return
  savingMachine.value = true
  try {
    confirmSave()
    selfStore.item.machine = { ...proxyModel.value }
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
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow pa-2"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <!-- Traitements par DAP -->
          <v-expansion-panel value="dap">
            <v-expansion-panel-title>
              <span class="panel-title">Traitements par DAP</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-title-medium font-weight-bold mb-1">Suivi du traitement par PPC</div>
              <div class="text-body-small text-medium-emphasis mb-4">
                30 derniers jours · utilisation nocturne et index d'apnées-hypopnées (IAH).
              </div>
              <PpcTrackingChart />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Données machine -->
          <v-expansion-panel value="machine">
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-grow-1">
                <span class="panel-title">Données machine</span>
                <v-spacer />
                <v-btn v-if="!editingMachine" :icon="mdiPencil" color="primary" variant="text" size="small"
                  density="comfortable" class="mr-2" @click.stop="startEditMachine" />
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
              <v-confirm-edit v-else v-model="machineModel" hide-actions>
                <template #default="{ model: proxyModel, save: confirmSave, cancel, isPristine }">
                  <v-form ref="machineFormRef">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.brand" label="Marque" variant="outlined"
                          rounded="lg" hide-details="auto" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.model" label="Modèle" variant="outlined"
                          rounded="lg" hide-details="auto" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.serialNumber" label="Numéro de série"
                          variant="outlined" rounded="lg" hide-details="auto" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.pressure" label="Pression" variant="outlined"
                          rounded="lg" hide-details="auto" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.mask" label="Masque" variant="outlined"
                          rounded="lg" hide-details="auto" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model.trim="proxyModel.value.startDate" label="Date de mise en service"
                          placeholder="JJ/MM/AAAA" variant="outlined" rounded="lg" hide-details="auto" />
                      </v-col>
                    </v-row>
                    <div v-if="!isPristine" class="d-flex justify-end ga-2 mt-4">
                      <v-btn variant="text" rounded="lg" size="small" class="text-none"
                        @click="cancelEditMachine(cancel)">
                        Annuler
                      </v-btn>
                      <v-btn color="primary" variant="flat" size="small" rounded="lg" class="text-none"
                        :loading="savingMachine" @click="handleSaveMachine(proxyModel, confirmSave)">
                        Enregistrer
                      </v-btn>
                    </div>
                  </v-form>
                </template>
              </v-confirm-edit>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>
  </v-row>
</template>
