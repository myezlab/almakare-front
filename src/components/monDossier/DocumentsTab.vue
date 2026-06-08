<script setup>
import DocumentDialog from "@/components/DocumentDialog.vue"
import RapportDialog from "@/components/RapportDialog.vue"
import { ISOToDDMMYYYY } from "@/composables/useDates"
import { useUrlPanels } from "@/composables/useUrlPanels"
import { ORDONNANCE_DOCUMENTS as ORDONNANCES_DOCS, REQUIRED_DOCUMENTS as REQUIRED_DOCS } from "@/data/documents"
import { RAPPORTS } from "@/data/rapports"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiCheck,
  mdiClose,
  mdiFileChartOutline,
  mdiFileDocumentOutline,
  mdiFileDocumentPlusOutline,
  mdiFolderOutline,
  mdiOpenInNew,
  mdiPaperclip,
  mdiPlus,
} from "@mdi/js"
import { computed, ref } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const openPanels = useUrlPanels("docPanels")

if (!selfStore.item.documents) selfStore.item.documents = {}
if (!selfStore.item.documents.other) selfStore.item.documents.other = []

const documents = computed(() => selfStore.item.documents || {})

const otherFiles = computed(() => documents.value.other || [])

// Synthetic document definition so "Autres documents" reuses the shared
// DocumentDialog (camera / gallery / browse) exactly like the other documents.
const OTHER_DOC = {
  title: 'Autre document',
  subtitle: 'Document complémentaire',
  icon: mdiFolderOutline,
  capture: { shape: 'page', guide: 'Cadrez votre document dans le cadre' },
}

// Every document card opens the shared DocumentDialog (same interface as the
// requested documents in ActivitesTab), keeping the whole app consistent.
const docDialogOpen = ref(false)
const activeDoc = ref(null)
const savingDoc = ref(false)

const activeDocFile = computed(() =>
  activeDoc.value ? documents.value[activeDoc.value.key] || null : null
)

function openDocDialog(doc) {
  activeDoc.value = doc
  docDialogOpen.value = true
}

function handleDocumentSubmit(file) {
  const doc = activeDoc.value
  if (!doc) return
  savingDoc.value = true
  try {
    selfStore.item.documents = { ...(selfStore.item.documents || {}), [doc.key]: file }
    docDialogOpen.value = false
    messagesStore.add({ type: 'success', text: 'Document enregistré' })
  } finally {
    savingDoc.value = false
  }
}

function handleDocumentRemove() {
  const doc = activeDoc.value
  if (!doc) return
  const next = { ...(selfStore.item.documents || {}) }
  delete next[doc.key]
  selfStore.item.documents = next
  messagesStore.add({ type: 'success', text: 'Document supprimé' })
}

const otherDialogOpen = ref(false)
const savingOther = ref(false)

function openOtherDialog() {
  otherDialogOpen.value = true
}

// The shared DocumentUploadCard returns one file's metadata { name, size,
// type, uploadedAt } — append it to the "other" list as a new entry.
function handleOtherSubmit(file) {
  savingOther.value = true
  try {
    const list = [...(selfStore.item.documents?.other || [])]
    list.push({
      id: `${file.uploadedAt}-${list.length}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: file.uploadedAt,
    })
    selfStore.item.documents = { ...selfStore.item.documents, other: list }
    otherDialogOpen.value = false
    messagesStore.add({ type: 'success', text: 'Document enregistré' })
  } finally {
    savingOther.value = false
  }
}

function removeOther(id) {
  const list = (selfStore.item.documents?.other || []).filter((f) => f.id !== id)
  selfStore.item.documents = { ...selfStore.item.documents, other: list }
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// =================== RAPPORTS ===================
// Read-only medical reports produced by the doctor after each past activity
// (seeded from activities.json). Patients retrieve them here; the same dialog
// is reachable from each past activity's "Rapport" card in the Activités tab.
const rapports = computed(() => RAPPORTS)

const rapportDialogOpen = ref(false)
const activeRapport = ref(null)

function openRapport(rapport) {
  activeRapport.value = rapport
  rapportDialogOpen.value = true
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow mb-16" :class="{ 'rounded-15': !$vuetify.display.mobile }">

        <v-expansion-panels v-model="openPanels" flat multiple variant="accordion" class="card-shadow pa-2"
          :class="{ 'rounded-15': !$vuetify.display.mobile }">

          <!-- =================== DOCUMENTS =================== -->
          <v-expansion-panel value="documents">
            <v-expansion-panel-title>
              <span class="panel-title">Documents</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-small text-medium-emphasis mb-4">
                Déposez vos pièces administratives pour faciliter votre prise en charge.
              </div>

              <!-- =================== REQUIRED DOCS GRID =================== -->
              <v-row>
                <v-col v-for="doc in REQUIRED_DOCS" :key="doc.key" cols="12" sm="6" md="4">
                  <div class="doc-card"
                    :class="{ 'doc-card--uploaded': documents[doc.key], 'doc-card--missing': !documents[doc.key] }"
                    role="button" tabindex="0" @click="openDocDialog(doc)" @keydown.enter.prevent="openDocDialog(doc)"
                    @keydown.space.prevent="openDocDialog(doc)">

                    <!-- Status badge -->
                    <div class="doc-card-badge"
                      :class="documents[doc.key] ? 'doc-card-badge--ok' : 'doc-card-badge--todo'">
                      <v-icon :icon="documents[doc.key] ? mdiCheck : mdiPlus" size="14" />
                    </div>

                    <!-- Icon -->
                    <div class="doc-card-icon"
                      :class="documents[doc.key] ? 'doc-card-icon--ok' : 'doc-card-icon--todo'">
                      <v-icon :icon="doc.icon" size="26" />
                    </div>

                    <!-- Title -->
                    <div class="text-title-small font-weight-bold mt-3">{{ doc.title }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ doc.subtitle }}</div>

                    <!-- Uploaded info -->
                    <template v-if="documents[doc.key]">
                      <div class="doc-card-filename mt-2">
                        <v-icon :icon="mdiPaperclip" size="13" class="mr-1" />
                        <span class="text-truncate">{{ documents[doc.key].name }}</span>
                      </div>
                    </template>
                  </div>
                </v-col>
              </v-row>

              <!-- =================== AUTRE (OPTIONNEL) =================== -->
              <v-divider class="my-6" />

              <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
                <div>
                  <div class="text-title-medium font-weight-bold d-flex align-center">
                    <v-icon :icon="mdiFolderOutline" size="18" class="mr-2" />
                    Autres documents
                    <v-chip size="x-small" variant="tonal" class="ml-2 font-weight-medium">
                      {{ otherFiles.length }}
                    </v-chip>
                  </div>
                  <div class="text-body-small text-medium-emphasis">
                    Tout document complémentaire utile à votre dossier.
                  </div>
                </div>
                <v-btn color="primary" variant="tonal" rounded="lg" size="small" class="text-none"
                  :prepend-icon="mdiFileDocumentPlusOutline" @click="openOtherDialog">
                  Ajouter
                </v-btn>
              </div>

              <div v-if="otherFiles.length" class="d-flex flex-column ga-2">
                <div v-for="file in otherFiles" :key="file.id" class="other-row">
                  <div class="other-row-icon">
                    <v-icon :icon="mdiFileDocumentOutline" size="20" />
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="text-body-medium font-weight-medium text-truncate">{{ file.name }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ formatSize(file.size) }}</div>
                  </div>
                  <v-btn :icon="mdiClose" variant="text" size="x-small" density="comfortable"
                    @click="removeOther(file.id)" />
                </div>
              </div>

              <div v-else class="empty-state d-flex align-center pa-4">
                <v-icon :icon="mdiFolderOutline" size="22" class="mr-2 text-medium-emphasis" />
                <span class="text-body-small text-medium-emphasis">Aucun document supplémentaire pour le moment.</span>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- =================== ORDONNANCES =================== -->
          <v-expansion-panel value="ordonnances">
            <v-expansion-panel-title>
              <span class="panel-title">Ordonnances</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col v-for="doc in ORDONNANCES_DOCS" :key="doc.key" cols="12" sm="6" md="4">
                  <div class="doc-card"
                    :class="{ 'doc-card--uploaded': documents[doc.key], 'doc-card--missing': !documents[doc.key] }"
                    role="button" tabindex="0" @click="openDocDialog(doc)" @keydown.enter.prevent="openDocDialog(doc)"
                    @keydown.space.prevent="openDocDialog(doc)">

                    <div class="doc-card-badge"
                      :class="documents[doc.key] ? 'doc-card-badge--ok' : 'doc-card-badge--todo'">
                      <v-icon :icon="documents[doc.key] ? mdiCheck : mdiPlus" size="14" />
                    </div>

                    <div class="doc-card-icon"
                      :class="documents[doc.key] ? 'doc-card-icon--ok' : 'doc-card-icon--todo'">
                      <v-icon :icon="doc.icon" size="26" />
                    </div>

                    <div class="text-title-small font-weight-bold mt-3">{{ doc.title }}</div>
                    <div class="text-body-small text-medium-emphasis">{{ doc.subtitle }}</div>

                    <template v-if="documents[doc.key]">
                      <div class="doc-card-filename mt-2">
                        <v-icon :icon="mdiPaperclip" size="13" class="mr-1" />
                        <span class="text-truncate">{{ documents[doc.key].name }}</span>
                      </div>
                    </template>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- =================== RAPPORTS =================== -->
          <v-expansion-panel value="rapports">
            <v-expansion-panel-title>
              <span class="panel-title">Rapports</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-small text-medium-emphasis mb-4">
                Les rapports rédigés par votre médecin après chaque rendez-vous.
              </div>

              <div v-if="rapports.length" class="d-flex flex-column ga-2">
                <div v-for="rapport in rapports" :key="rapport.id" class="rapport-row" role="button" tabindex="0"
                  @click="openRapport(rapport)" @keydown.enter.prevent="openRapport(rapport)"
                  @keydown.space.prevent="openRapport(rapport)">
                  <div class="rapport-row-icon">
                    <v-icon :icon="mdiFileChartOutline" size="20" />
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="text-body-medium font-weight-medium text-truncate">{{ rapport.title }}</div>
                    <div class="text-body-small text-medium-emphasis text-truncate">
                      {{ rapport.doctor }} — {{ ISOToDDMMYYYY(rapport.date) }}
                    </div>
                  </div>
                  <v-btn color="primary" variant="tonal" rounded="lg" size="small" class="text-none flex-shrink-0"
                    :prepend-icon="mdiOpenInNew" @click.stop="openRapport(rapport)">
                    Ouvrir
                  </v-btn>
                </div>
              </div>

              <div v-else class="empty-state d-flex align-center pa-4">
                <v-icon :icon="mdiFileChartOutline" size="22" class="mr-2 text-medium-emphasis" />
                <span class="text-body-small text-medium-emphasis">Aucun rapport disponible pour le moment.</span>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>

    <DocumentDialog v-model="docDialogOpen" :document="activeDoc" :existing="activeDocFile" :loading="savingDoc"
      @submit="handleDocumentSubmit" @remove="handleDocumentRemove" />

    <!-- Same upload experience for free-form "Autres documents" -->
    <DocumentDialog v-model="otherDialogOpen" :document="OTHER_DOC" :existing="null" :loading="savingOther"
      @submit="handleOtherSubmit" />

    <!-- Rapport preview / download dialog -->
    <RapportDialog v-model="rapportDialogOpen" :rapport="activeRapport" />
  </v-row>
</template>

<style scoped>
.doc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 16px 14px;
  border-radius: 14px;
  background: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.doc-card--missing {
  border: 1.5px dashed rgba(0, 0, 0, 0.16);
  cursor: pointer;
}

.doc-card--missing:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.03);
  transform: translateY(-1px);
}

.doc-card--uploaded {
  border: 1px solid rgba(var(--v-theme-success), 0.35);
  background: rgba(var(--v-theme-success), 0.04);
}

.doc-card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.doc-card-badge--ok {
  background: rgb(var(--v-theme-success));
}

.doc-card-badge--todo {
  background: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.55);
}

.doc-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.doc-card-icon--todo {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.55);
}

.doc-card-icon--ok {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.doc-card-cta {
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  margin-top: auto;
}

.doc-card-filename {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 6px 8px;
  max-width: 100%;
}

.other-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.other-row-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.rapport-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rapport-row:hover,
.rapport-row:focus-visible {
  background: rgba(var(--v-theme-warning), 0.06);
  border-color: rgba(var(--v-theme-warning), 0.35);
  outline: none;
}

.rapport-row-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-warning), 0.12);
  color: rgb(var(--v-theme-warning));
  flex-shrink: 0;
}

.min-w-0 {
  min-width: 0;
}
</style>
