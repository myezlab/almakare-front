<script setup>
// Upload / replace / remove a single document inside a dialog.
//
// Thin wrapper around DocumentUploadCard so every document across the app
// (dossier grid + requested documents in ActivitesTab) shares the same upload
// experience: camera / gallery / browse, preview, progress and clear states.
//
// Driven by a document definition (from src/data/documents.js) and the file
// already stored for it (if any). A successful upload emits `submit` with the
// file metadata { name, size, type, uploadedAt }; the parent persists it.
// `remove` asks the parent to drop the stored file.
import DocumentUploadCard from "@/components/DocumentUploadCard.vue"
import { mdiClose } from "@mdi/js"
import { useDisplay } from "vuetify"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  document: { type: Object, default: null },
  existing: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "submit", "remove"])

const { mobile } = useDisplay()

function close() {
  emit("update:modelValue", false)
}

// The card emits the new metadata on success, or null when the file is removed.
function onChange(meta) {
  if (meta) emit("submit", meta)
  else emit("remove")
}
</script>

<template>
  <!-- Bottom sheet on mobile (same as Agenda du sommeil), centered dialog on desktop -->
  <v-bottom-sheet v-if="mobile" :model-value="modelValue" inset
    @update:model-value="emit('update:modelValue', $event)">
    <div v-if="document" class="doc-dialog-shell doc-dialog-shell--sheet">
      <v-btn :icon="mdiClose" variant="text" density="comfortable" class="doc-dialog-close"
        aria-label="Fermer" @click="close" />
      <DocumentUploadCard :title="document.title" :icon="document.icon" :capture-frame="document.capture || null"
        :helper="document.subtitle ? `${document.subtitle} — photo ou PDF.` : 'Ajoutez une photo ou un PDF de ce document.'"
        :model-value="existing" @update:model-value="onChange" />
    </div>
  </v-bottom-sheet>

  <v-dialog v-else :model-value="modelValue" max-width="520"
    @update:model-value="emit('update:modelValue', $event)">
    <div v-if="document" class="doc-dialog-shell">
      <v-btn :icon="mdiClose" variant="text" density="comfortable" class="doc-dialog-close"
        aria-label="Fermer" @click="close" />
      <DocumentUploadCard :title="document.title" :icon="document.icon" :capture-frame="document.capture || null"
        :helper="document.subtitle ? `${document.subtitle} — photo ou PDF.` : 'Ajoutez une photo ou un PDF de ce document.'"
        :model-value="existing" @update:model-value="onChange" />
    </div>
  </v-dialog>
</template>

<style scoped>
.doc-dialog-shell {
  position: relative;
}

/* Round the upload card's top corners to match the sleep-diary bottom sheet. */
.doc-dialog-shell--sheet :deep(.upload-card) {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.doc-dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}
</style>
