<script setup>
import { useUrlPanels } from "@/composables/useUrlPanels"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiCardAccountDetailsOutline,
  mdiCheck,
  mdiClose,
  mdiCreditCardOutline,
  mdiFileDocumentCheckOutline,
  mdiFileDocumentOutline,
  mdiFileDocumentPlusOutline,
  mdiFileSign,
  mdiFolderOutline,
  mdiPaperclip,
  mdiPlus,
  mdiShieldCheckOutline,
  mdiTrashCanOutline,
  mdiUploadOutline,
} from "@mdi/js"
import { computed, ref } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const openPanels = useUrlPanels("docPanels")

const REQUIRED_DOCS = [
  {
    key: 'idFront',
    title: "Carte d'identité",
    subtitle: 'Recto',
    icon: mdiCardAccountDetailsOutline,
    accept: 'image/*,application/pdf',
  },
  {
    key: 'idBack',
    title: "Carte d'identité",
    subtitle: 'Verso',
    icon: mdiCardAccountDetailsOutline,
    accept: 'image/*,application/pdf',
  },
  {
    key: 'carteVitale',
    title: 'Carte vitale',
    subtitle: 'Attestation de droits',
    icon: mdiCreditCardOutline,
    accept: 'image/*,application/pdf',
  },
  {
    key: 'mutuelle',
    title: 'Carte de mutuelle',
    subtitle: 'Complémentaire santé',
    icon: mdiShieldCheckOutline,
    accept: 'image/*,application/pdf',
  },
  {
    key: 'priseEnCharge',
    title: 'Prise en charge',
    subtitle: 'Notification organisme',
    icon: mdiFileDocumentCheckOutline,
    accept: 'image/*,application/pdf',
  },
]

const ORDONNANCES_DOCS = [
  {
    key: 'lettreAdressage',
    title: "Lettre d'adressage",
    subtitle: 'Médecin référent',
    icon: mdiFileDocumentOutline,
    accept: 'image/*,application/pdf',
  },
  {
    key: 'ordonnance',
    title: 'Ordonnance',
    subtitle: 'Prescription médicale',
    icon: mdiFileSign,
    accept: 'image/*,application/pdf',
  },
]

if (!selfStore.item.documents) selfStore.item.documents = {}
if (!selfStore.item.documents.other) selfStore.item.documents.other = []

const documents = computed(() => selfStore.item.documents || {})

const otherFiles = computed(() => documents.value.other || [])

const fileInputs = ref({})

function pickFile(key) {
  const input = fileInputs.value[key]
  if (input) input.click()
}

function handleUpload(key, event) {
  const file = event.target.files?.[0]
  if (!file) return
  selfStore.item.documents = {
    ...selfStore.item.documents,
    [key]: {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    },
  }
  messagesStore.add({ type: 'success', text: 'Document enregistré' })
  event.target.value = ''
}

function removeDoc(key) {
  const next = { ...(selfStore.item.documents || {}) }
  delete next[key]
  selfStore.item.documents = next
  messagesStore.add({ type: 'success', text: 'Document supprimé' })
}

function handleOtherUpload(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  const list = [...(selfStore.item.documents?.other || [])]
  for (const file of files) {
    list.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    })
  }
  selfStore.item.documents = { ...selfStore.item.documents, other: list }
  messagesStore.add({ type: 'success', text: 'Document(s) enregistré(s)' })
  event.target.value = ''
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
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">

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
                    @click="!documents[doc.key] && pickFile(doc.key)">

                    <input :ref="(el) => (fileInputs[doc.key] = el)" type="file" :accept="doc.accept"
                      style="display: none" @change="(e) => handleUpload(doc.key, e)" />

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

                      <div class="d-flex ga-1 mt-3">
                        <v-btn variant="text" size="x-small" color="primary" rounded="lg" class="text-none flex-grow-1"
                          :prepend-icon="mdiUploadOutline" @click.stop="pickFile(doc.key)">
                          Remplacer
                        </v-btn>
                        <v-btn :icon="mdiTrashCanOutline" variant="text" size="x-small" density="comfortable"
                          color="error" @click.stop="removeDoc(doc.key)" />
                      </div>
                    </template>

                    <!-- Missing CTA -->
                    <div v-else class="doc-card-cta mt-3">
                      <v-icon :icon="mdiUploadOutline" size="14" class="mr-1" />
                      Ajouter
                    </div>
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
                  :prepend-icon="mdiFileDocumentPlusOutline" @click="$refs.otherInput.click()">
                  Ajouter
                </v-btn>
                <input ref="otherInput" type="file" multiple accept="image/*,application/pdf" style="display: none"
                  @change="handleOtherUpload" />
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
                    @click="!documents[doc.key] && pickFile(doc.key)">

                    <input :ref="(el) => (fileInputs[doc.key] = el)" type="file" :accept="doc.accept"
                      style="display: none" @change="(e) => handleUpload(doc.key, e)" />

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

                      <div class="d-flex ga-1 mt-3">
                        <v-btn variant="text" size="x-small" color="primary" rounded="lg" class="text-none flex-grow-1"
                          :prepend-icon="mdiUploadOutline" @click.stop="pickFile(doc.key)">
                          Remplacer
                        </v-btn>
                        <v-btn :icon="mdiTrashCanOutline" variant="text" size="x-small" density="comfortable"
                          color="error" @click.stop="removeDoc(doc.key)" />
                      </div>
                    </template>

                    <div v-else class="doc-card-cta mt-3">
                      <v-icon :icon="mdiUploadOutline" size="14" class="mr-1" />
                      Ajouter
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card>
    </v-col>
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

.min-w-0 {
  min-width: 0;
}
</style>
