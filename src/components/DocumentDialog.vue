<script setup>
// Upload / replace / remove a single document inside a dialog.
//
// Driven by a document definition (from src/data/documents.js) and the file
// already stored for it (if any). Picking a file emits `submit` with the file
// metadata { name, size, type, uploadedAt }; the parent persists it. `remove`
// asks the parent to drop the stored file.
import { mdiFileDocumentOutline, mdiPaperclip, mdiTrashCanOutline, mdiUploadOutline } from "@mdi/js"
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  document: { type: Object, default: null },
  existing: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "submit", "remove"])

const fileInput = ref(null)
const pendingFile = ref(null)

// Discard any unsaved pick each time the dialog opens.
watch(
  () => props.modelValue,
  (open) => {
    if (open) pendingFile.value = null
  },
)

// The file shown in the dialog: a freshly picked one takes precedence over the
// previously stored one.
const current = computed(() => pendingFile.value || props.existing)

function pick() {
  fileInput.value?.click()
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  pendingFile.value = {
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  }
  event.target.value = ""
}

function formatSize(bytes) {
  if (bytes == null) return ""
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function close() {
  emit("update:modelValue", false)
}

function save() {
  if (!pendingFile.value) {
    close()
    return
  }
  emit("submit", pendingFile.value)
}

function remove() {
  pendingFile.value = null
  emit("remove")
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" :fullscreen="$vuetify.display.mobile"
    @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="document" class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-title class="pa-4">
        <div class="text-headline-small font-weight-bold">{{ document.title }}</div>
        <div v-if="document.subtitle" class="text-body-small text-medium-emphasis mt-1">{{ document.subtitle }}</div>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <input ref="fileInput" type="file" :accept="document.accept" style="display: none" @change="onFileChange" />

        <!-- Current / picked file -->
        <div v-if="current" class="doc-file d-flex align-center ga-3 pa-3">
          <v-avatar color="success" variant="tonal" size="44">
            <v-icon :icon="mdiFileDocumentOutline" size="22" />
          </v-avatar>
          <div class="flex-grow-1 min-w-0">
            <div class="text-body-medium font-weight-medium text-truncate">{{ current.name }}</div>
            <div class="text-body-small text-medium-emphasis">{{ formatSize(current.size) }}</div>
          </div>
          <v-btn :icon="mdiTrashCanOutline" variant="text" size="small" density="comfortable" color="error"
            @click="remove" />
        </div>

        <!-- Empty drop zone -->
        <div v-else class="doc-dropzone d-flex flex-column align-center text-center pa-6" role="button" tabindex="0"
          @click="pick" @keydown.enter="pick">
          <v-icon :icon="mdiUploadOutline" size="32" class="mb-2 text-medium-emphasis" />
          <div class="text-body-medium font-weight-medium">Déposez votre document</div>
          <div class="text-body-small text-medium-emphasis">Image ou PDF</div>
        </div>

        <v-btn v-if="current" variant="tonal" color="primary" rounded="lg" class="text-none mt-3" block
          :prepend-icon="mdiUploadOutline" @click="pick">
          Remplacer
        </v-btn>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :loading="loading"
          :disabled="!pendingFile" @click="save">
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.doc-file {
  border: 1px solid rgba(var(--v-theme-success), 0.35);
  background: rgba(var(--v-theme-success), 0.04);
  border-radius: 12px;
}

.doc-dropzone {
  border: 1.5px dashed rgba(0, 0, 0, 0.16);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.doc-dropzone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.03);
}

.min-w-0 {
  min-width: 0;
}
</style>
