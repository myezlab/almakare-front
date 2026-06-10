<script setup>
// Mobile-first, reusable document upload card.
//
// Designed for elderly / non-technical patients: one clear action, large touch
// targets, reassuring states. Handles a single document (photo or PDF) end to
// end — pick (camera / gallery / files), preview, upload progress, success and
// error recovery.
//
// On mobile the primary button opens a bottom sheet (Take photo / Gallery /
// Browse files). On desktop it opens the file browser and also accepts
// drag-and-drop.
//
// The persisted value is file metadata `{ name, size, type, uploadedAt }` to
// match the rest of the app (selfStore.item.documents). Pass an async `uploader`
// to do the real upload; without one a short client-side upload is simulated so
// the progress / success / error states still work in this seeded app.
import DocumentCaptureOverlay from "@/components/DocumentCaptureOverlay.vue"
import {
  mdiAlertCircleOutline,
  mdiCameraOutline,
  mdiCardAccountDetailsOutline,
  mdiCheckCircle,
  mdiClose,
  mdiFilePdfBox,
  mdiFolderOpenOutline,
  mdiImageOutline,
  mdiPlus,
  mdiReload,
  mdiTrashCanOutline,
  mdiUploadOutline,
} from "@mdi/js"
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useDisplay } from "vuetify"

const props = defineProps({
  // Stored file metadata (or null). Two-way bound.
  modelValue: { type: Object, default: null },
  title: { type: String, default: "Pièce d'identité" },
  helper: { type: String, default: "Ajoutez une photo ou un PDF de votre pièce d'identité." },
  buttonLabel: { type: String, default: "Ajouter un document" },
  hint: { type: String, default: "Formats acceptés : JPG, PNG, PDF" },
  icon: { type: String, default: mdiCardAccountDetailsOutline },
  accept: { type: String, default: "image/jpeg,image/png,application/pdf" },
  maxSizeMb: { type: Number, default: 10 },
  // Optional in-app camera config { shape: 'card' | 'page', guide: string,
  // scan?: boolean }. When set (and getUserMedia is available) "Prendre une
  // photo" opens the DocumentCaptureOverlay instead of leaving the app for the
  // OS camera. Real-time OpenCV scanning is OFF by default (manual shutter); opt
  // in per document with `scan: true` once the OpenCV path is sorted out.
  captureFrame: { type: Object, default: null },
  // Optional async uploader: (file, { onProgress, signal }) => any.
  // Resolve to persist; throw to surface the error state.
  uploader: { type: Function, default: null },
})

const emit = defineEmits(["update:modelValue", "uploaded", "removed", "error"])

const { mobile } = useDisplay()

// 'empty' | 'uploading' | 'done' | 'error'
const status = ref(props.modelValue ? "done" : "empty")
const progress = ref(0)
const errorMessage = ref("")
const isDragging = ref(false)
const sheetOpen = ref(false)
const captureOpen = ref(false)
const uploadingCount = ref(0)

// In-app camera is only offered when configured and the browser supports it.
const supportsCamera =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
const useInAppCamera = computed(() => !!props.captureFrame && supportsCamera)

// A document can hold several pages (recto/verso, multi-page scans). Each page
// is file metadata { name, size, type, uploadedAt } plus an optional in-session
// image previewUrl (object URLs only exist while the app stays open).
const pages = ref(normalizeIncoming(props.modelValue))
const pageCount = computed(() => pages.value.length)

// When true, the next pick ADDS pages to the current document ("Ajouter une
// page") instead of replacing it.
const pendingAppend = ref(false)
// Kept so "Réessayer" can re-run the same batch.
let lastBatch = null

const cameraInput = ref(null)
const galleryInput = ref(null)
const browseInput = ref(null)

const acceptList = computed(() =>
  props.accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
)

// Turn whatever the parent stored — a single file meta, or a multi-page meta
// carrying a `pages` array — into our internal page list.
function normalizeIncoming(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.map((p) => ({ ...p }))
  if (Array.isArray(val.pages)) return val.pages.map((p) => ({ ...p }))
  return [{ ...val }]
}

// Keep internal state in sync if the parent clears or replaces the value.
// Skip while we're mid-upload: that change is the one we just emitted, and
// re-normalising it would drop the in-session previews we still hold.
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      resetPreviews()
      pages.value = []
      status.value = "empty"
    } else if (status.value !== "uploading") {
      const incoming = normalizeIncoming(val)
      if (incoming.length !== pages.value.length) {
        resetPreviews()
        pages.value = incoming
      }
      status.value = "done"
    }
  },
)

onBeforeUnmount(resetPreviews)

function resetPreviews() {
  pages.value.forEach((p) => {
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
  })
}

// append=true is only passed explicitly; click handlers pass the DOM event, so
// guard with `=== true` to treat those as a replace.
function openPicker(append = false) {
  pendingAppend.value = append === true
  if (mobile.value) {
    sheetOpen.value = true
  } else {
    browseInput.value?.click()
  }
}

function pick(which) {
  sheetOpen.value = false
  // Defer so the bottom sheet finishes closing before the next surface opens.
  setTimeout(() => {
    if (which === "camera" && useInAppCamera.value) {
      captureOpen.value = true
      return
    }
    const input = { camera: cameraInput, gallery: galleryInput, browse: browseInput }[which]
    input?.value?.click()
  }, 150)
}

// Overlay produced one or more page Files — run them through the upload flow.
function onCaptured(files) {
  captureOpen.value = false
  const list = Array.isArray(files) ? files : files ? [files] : []
  if (list.length) startUpload(list, { append: pendingAppend.value })
  pendingAppend.value = false
}

// Camera unavailable / permission refused — fall back to the OS camera input.
function onCaptureFallback() {
  captureOpen.value = false
  setTimeout(() => cameraInput.value?.click(), 150)
}

function validate(file) {
  const type = (file.type || "").toLowerCase()
  if (!acceptList.value.includes(type)) {
    return "Ce format n'est pas accepté. Utilisez une image JPG, PNG ou un PDF."
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    return `Le fichier dépasse ${props.maxSizeMb} Mo. Choisissez un fichier plus léger.`
  }
  return ""
}

function onFileChange(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = "" // allow re-picking the same file
  if (files.length) startUpload(files, { append: pendingAppend.value })
  pendingAppend.value = false
}

function onDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length) startUpload(files)
}

async function startUpload(files, { append = false } = {}) {
  const list = Array.isArray(files) ? files : [files]
  if (!list.length) return

  for (const file of list) {
    const problem = validate(file)
    if (problem) {
      errorMessage.value = problem
      status.value = "error"
      emit("error", problem)
      return
    }
  }

  lastBatch = { files: list, append }
  errorMessage.value = ""
  progress.value = 0
  uploadingCount.value = list.length
  status.value = "uploading"

  const newPages = list.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
  }))

  try {
    if (props.uploader) {
      for (const file of list) {
        await props.uploader(file, { onProgress: (p) => (progress.value = Math.round(p)) })
      }
    } else {
      await simulateUpload((p) => (progress.value = p))
    }
    if (append) {
      pages.value = [...pages.value, ...newPages]
    } else {
      resetPreviews()
      pages.value = newPages
    }
    status.value = "done"
    emitModel()
  } catch (err) {
    newPages.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    })
    errorMessage.value = err?.message || "L'envoi a échoué. Vérifiez votre connexion et réessayez."
    status.value = "error"
    emit("error", errorMessage.value)
  }
}

// Emit a single file meta for a one-page document (unchanged contract), or a
// multi-page meta carrying every page under `pages` for several pages.
function emitModel() {
  const metas = pages.value.map(({ previewUrl, ...meta }) => meta)
  const value =
    metas.length === 0 ? null : metas.length === 1 ? metas[0] : buildMultiMeta(metas)
  emit("update:modelValue", value)
  emit("uploaded", value)
}

function buildMultiMeta(metas) {
  return {
    name: `${props.title} — ${metas.length} pages`,
    size: metas.reduce((sum, m) => sum + (m.size || 0), 0),
    type: metas[0].type,
    uploadedAt: metas[metas.length - 1].uploadedAt,
    pages: metas,
  }
}

// Smoothly advances a fake progress bar to 100% (no backend in this app).
function simulateUpload(onProgress) {
  return new Promise((resolve) => {
    let p = 0
    const timer = setInterval(() => {
      p = Math.min(100, p + 12)
      onProgress(p)
      if (p >= 100) {
        clearInterval(timer)
        setTimeout(resolve, 250)
      }
    }, 110)
  })
}

function retry() {
  if (lastBatch) startUpload(lastBatch.files, { append: lastBatch.append })
  else {
    status.value = "empty"
    openPicker()
  }
}

function remove() {
  resetPreviews()
  pages.value = []
  lastBatch = null
  status.value = "empty"
  progress.value = 0
  emit("update:modelValue", null)
  emit("removed")
}

// Drop a single page; removing the last one clears the whole document.
function removePage(index) {
  const page = pages.value[index]
  if (page?.previewUrl) URL.revokeObjectURL(page.previewUrl)
  pages.value.splice(index, 1)
  if (!pages.value.length) {
    remove()
    return
  }
  emitModel()
}

function formatSize(bytes) {
  if (bytes == null) return ""
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
</script>

<template>
  <v-card class="upload-card card-shadow" :class="{ 'rounded-15': !mobile }">
    <v-card-item class="pa-5 pb-2">
      <template #prepend>
        <div class="upload-card-icon" aria-hidden="true">
          <v-icon :icon="icon" size="26" />
        </div>
      </template>
      <v-card-title class="text-headline-small font-weight-bold">{{ title }}</v-card-title>
      <v-card-subtitle class="text-body-medium text-medium-emphasis text-wrap mt-1">
        {{ helper }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="pa-5 pt-3">
      <!-- Hidden inputs: camera / gallery / browse -->
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="d-none"
        @change="onFileChange" />
      <input ref="galleryInput" type="file" accept="image/*" multiple class="d-none" @change="onFileChange" />
      <input ref="browseInput" type="file" :accept="accept" multiple class="d-none" @change="onFileChange" />

      <!-- ================= EMPTY ================= -->
      <template v-if="status === 'empty'">
        <div class="dropzone d-flex flex-column align-center text-center pa-6" :class="{ 'dropzone--drag': isDragging }"
          role="button" tabindex="0" :aria-label="buttonLabel" @click="openPicker" @keydown.enter.prevent="openPicker"
          @keydown.space.prevent="openPicker" @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false" @drop.prevent="onDrop">
          <div class="dropzone-icon mb-3" aria-hidden="true">
            <v-icon :icon="mdiUploadOutline" size="30" />
          </div>
          <div class="text-title-small font-weight-bold">{{ buttonLabel }}</div>
          <div class="text-body-small text-medium-emphasis mt-1 d-none d-sm-block">
            ou glissez votre fichier ici
          </div>
        </div>

        <v-btn color="primary" variant="flat" rounded="lg" size="large" block class="text-none mt-4 upload-btn"
          :prepend-icon="mdiUploadOutline" @click="openPicker">
          {{ buttonLabel }}
        </v-btn>

        <div class="text-body-small text-medium-emphasis text-center mt-3">{{ hint }}</div>
      </template>

      <!-- ================= UPLOADING ================= -->
      <template v-else-if="status === 'uploading'">
        <div class="file-row d-flex align-center ga-3 pa-3">
          <div class="file-thumb file-thumb--busy" aria-hidden="true">
            <v-icon :icon="mdiUploadOutline" size="24" />
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="text-body-medium font-weight-medium text-truncate">
              Envoi {{ uploadingCount > 1 ? `de ${uploadingCount} fichiers` : 'en cours' }}…
            </div>
            <div class="text-body-small text-medium-emphasis">{{ progress }}%</div>
          </div>
        </div>
        <v-progress-linear :model-value="progress" color="primary" height="10" rounded class="mt-3"
          aria-label="Progression de l'envoi" />
      </template>

      <!-- ================= DONE ================= -->
      <template v-else-if="status === 'done'">
        <div v-if="pageCount > 1" class="text-body-small font-weight-medium text-medium-emphasis mb-2">
          {{ pageCount }} pages
        </div>

        <!-- One block per page -->
        <div class="d-flex flex-column ga-3">
          <div v-for="(page, i) in pages" :key="i">
            <!-- Image page: large preview with a remove button -->
            <div v-if="(page.type || '').startsWith('image/') && page.previewUrl" class="preview">
              <img :src="page.previewUrl" :alt="`Aperçu page ${i + 1}`" class="preview-img" />
              <div v-if="pageCount > 1" class="preview-page-badge" aria-hidden="true">Page {{ i + 1 }}</div>
              <v-btn :icon="mdiClose" size="small" variant="flat" class="preview-remove"
                :aria-label="`Retirer la page ${i + 1}`" @click="removePage(i)" />
            </div>

            <!-- PDF / preview-less page: compact row -->
            <div v-else class="file-row file-row--done d-flex align-center ga-3 pa-3">
              <div class="file-thumb file-thumb--done" aria-hidden="true">
                <v-icon :icon="page.type === 'application/pdf' ? mdiFilePdfBox : mdiImageOutline" size="24" />
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="text-body-medium font-weight-medium text-truncate">{{ page.name }}</div>
                <div class="text-body-small d-flex align-center ga-1" style="color: rgb(var(--v-theme-success))">
                  <v-icon :icon="mdiCheckCircle" size="15" aria-hidden="true" />
                  <span>Ajouté · {{ formatSize(page.size) }}</span>
                </div>
              </div>
              <v-btn :icon="mdiClose" variant="text" size="small" density="comfortable"
                :aria-label="`Retirer la page ${i + 1}`" @click="removePage(i)" />
            </div>
          </div>
        </div>

        <v-btn variant="tonal" color="primary" rounded="lg" size="large" block class="text-none mt-3"
          :prepend-icon="mdiPlus" @click="openPicker(true)">
          Ajouter une page
        </v-btn>

        <div class="d-flex ga-2 mt-2">
          <v-btn variant="text" color="primary" rounded="lg" size="large" class="text-none flex-grow-1"
            :prepend-icon="mdiUploadOutline" @click="openPicker(false)">
            Remplacer
          </v-btn>
          <v-btn variant="text" color="error" rounded="lg" size="large" class="text-none"
            :prepend-icon="mdiTrashCanOutline" aria-label="Supprimer le document" @click="remove">
            Supprimer
          </v-btn>
        </div>
      </template>

      <!-- ================= ERROR ================= -->
      <template v-else-if="status === 'error'">
        <div class="file-row file-row--error d-flex align-center ga-3 pa-3">
          <div class="file-thumb file-thumb--error" aria-hidden="true">
            <v-icon :icon="mdiAlertCircleOutline" size="24" />
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="text-body-medium font-weight-bold" style="color: rgb(var(--v-theme-error))">
              Envoi impossible
            </div>
            <div class="text-body-small text-medium-emphasis">{{ errorMessage }}</div>
          </div>
        </div>

        <div class="d-flex ga-2 mt-3">
          <v-btn variant="flat" color="primary" rounded="lg" size="large" class="text-none flex-grow-1"
            :prepend-icon="mdiReload" @click="retry">
            Réessayer
          </v-btn>
          <v-btn variant="text" rounded="lg" size="large" class="text-none" @click="remove">
            Annuler
          </v-btn>
        </div>
      </template>
    </v-card-text>

    <!-- ================= MOBILE SOURCE PICKER ================= -->
    <v-bottom-sheet v-model="sheetOpen">
      <v-card class="source-sheet">
        <v-card-title class="text-title-medium font-weight-bold pa-4 pb-2 mt-2">
          {{ pendingAppend ? 'Ajouter une page' : 'Ajouter un document' }}
        </v-card-title>
        <v-list>
          <v-list-item class="source-item py-4" :prepend-icon="mdiCameraOutline" title="Prendre une photo"
            @click="pick('camera')" />
          <v-list-item class="source-item py-4" :prepend-icon="mdiImageOutline" title="Choisir dans la galerie"
            @click="pick('gallery')" />
          <v-list-item class="source-item py-4" :prepend-icon="mdiFolderOpenOutline" title="Parcourir les fichiers"
            @click="pick('browse')" />
        </v-list>
        <div class="pa-4 pt-1">
          <v-btn variant="text" rounded="lg" size="large" block class="text-none" @click="sheetOpen = false">
            Annuler
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

    <!-- ================= IN-APP CAMERA ================= -->
    <DocumentCaptureOverlay v-if="useInAppCamera" v-model="captureOpen" :title="title"
      :frame="captureFrame.shape" :guide="captureFrame.guide" :scan="captureFrame.scan === true"
      @capture="onCaptured" @error="onCaptureFallback" />
  </v-card>
</template>

<style scoped>
.upload-card {
  overflow: hidden;
}

.upload-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

/* ---- empty / dropzone ---- */
.dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.03);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.dropzone:hover,
.dropzone:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
  outline: none;
}

.dropzone--drag {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.01);
}

.dropzone-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.upload-btn {
  min-height: 52px;
  font-size: 1rem;
}

/* ---- file row (uploading / done / error) ---- */
.file-row {
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.file-row--done {
  background: rgba(var(--v-theme-success), 0.06);
  border-color: rgba(var(--v-theme-success), 0.35);
}

.file-row--error {
  background: rgba(var(--v-theme-error), 0.06);
  border-color: rgba(var(--v-theme-error), 0.35);
}

.file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.file-thumb--done {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.file-thumb--error {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

/* ---- image preview ---- */
.preview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-success), 0.35);
  background: rgba(0, 0, 0, 0.03);
}

.preview-img {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.preview-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-success));
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.preview-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}

.preview-page-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* ---- mobile source sheet ---- */
.source-sheet {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.source-sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.18);
  margin: 10px auto 2px;
}

.source-item {
  font-size: 1.0625rem;
}

.min-w-0 {
  min-width: 0;
}

.d-none {
  display: none;
}
</style>
