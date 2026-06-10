<script setup>
// In-app document camera with real-time scanning.
//
// Keeps the patient inside the app instead of bouncing them to the OS camera.
// Opens the live camera stream (getUserMedia) behind a full-screen overlay. When
// `scan` is on, OpenCV.js (lazy-loaded) detects the document edges live, draws an
// outline over the preview, and auto-captures once the page is held still for ~1s
// — then perspective-corrects and enhances the result. The patient can still tap
// the shutter manually. Either way they review the still and validate, at which
// point a JPEG `File` per page is emitted into DocumentUploadCard's upload flow.
//
// Designed for elderly / non-technical patients: hands-free auto-capture, a big
// manual shutter, plain-language hints, and graceful fallbacks — to the static
// guide frame if OpenCV can't load, and to the native file picker if the camera
// is unavailable or permission is refused.
import {
  mdiCameraFlipOutline,
  mdiCameraPlusOutline,
  mdiCheck,
  mdiClose,
  mdiImageBrokenVariant,
  mdiRefresh,
} from "@mdi/js"
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

import { useDocumentScanner } from "@/composables/useDocumentScanner"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "Document" },
  // 'card' (ID-1 cards) or 'page' (A4 documents) — picks the guide frame shape.
  frame: { type: String, default: "page" },
  // On-screen framing instruction.
  guide: { type: String, default: "" },
  // Real-time OpenCV.js document detection + auto-capture + perspective
  // correction. Degrades gracefully to the manual shutter when OpenCV can't
  // load or no document is detected.
  scan: { type: Boolean, default: true },
})

const emit = defineEmits(["update:modelValue", "capture", "error"])

const videoEl = ref(null)
const overlayEl = ref(null)
let stream = null

// ---- Real-time scanner (OpenCV.js) -----------------------------------------
const scanner = useDocumentScanner(() => videoEl.value, {
  stableMs: 1000,
  onAutoCapture: () => {
    // Only auto-capture from the live preview, and only once per still.
    if (state.value === "streaming" && !capturing) doCapture()
  },
})
// Scanning UI is shown only once OpenCV is ready AND a document is in view.
const scanActive = computed(() => props.scan && scanner.ready.value)
const documentInView = computed(() => !!scanner.quad.value)
let capturing = false

// 'loading' | 'streaming' | 'review' | 'error'
const state = ref("loading")
const errorMessage = ref("")
const facingMode = ref("environment")
const capturedUrl = ref("")
let capturedBlob = null

// A document can span several pages (recto/verso, multi-page scans). Each
// confirmed page is kept here as { blob, url } until the patient validates the
// whole set, at which point one File per page is emitted together.
const pages = ref([])

const guideText = computed(
  () =>
    props.guide ||
    (props.frame === "card"
      ? "Placez la carte dans le cadre, bien à plat"
      : "Cadrez le document entièrement dans le cadre"),
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetAll()
      start()
    } else {
      stop()
    }
  },
)

// Run the detection loop only while the live preview is on screen.
watch(state, (s) => {
  if (s === "streaming" && scanActive.value) scanner.start()
  else scanner.stop()
})

// Redraw the detection overlay whenever the quad or stability progress changes.
watch([scanner.quad, scanner.progress], drawOverlay)

// Map the normalised detected quad onto the displayed (object-fit: cover) video
// and stroke/fill it, tinting greener as the auto-capture countdown fills.
function drawOverlay() {
  const canvas = overlayEl.value
  const video = videoEl.value
  if (!canvas || !video) return
  const ctx = canvas.getContext("2d")
  const dpr = window.devicePixelRatio || 1
  const cw = canvas.clientWidth
  const ch = canvas.clientHeight
  if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
    canvas.width = cw * dpr
    canvas.height = ch * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  const quad = scanner.quad.value
  if (!quad || !video.videoWidth) return

  // object-fit: cover — the video is scaled up until it fills the container,
  // overflow cropped equally on the two long sides.
  const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight)
  const rw = video.videoWidth * scale
  const rh = video.videoHeight * scale
  const ox = (cw - rw) / 2
  const oy = (ch - rh) / 2
  const pts = quad.map((p) => ({ x: ox + p.x * rw, y: oy + p.y * rh }))

  const progress = scanner.progress.value
  const locked = progress >= 1

  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
  ctx.fillStyle = `rgba(34, 197, 94, ${0.1 + progress * 0.2})`
  ctx.fill()
  ctx.lineWidth = locked ? 4 : 3
  ctx.strokeStyle = locked ? "#22c55e" : "rgba(255, 255, 255, 0.95)"
  ctx.stroke()

  // Corner handles for a tangible "locked-on" feel.
  ctx.fillStyle = locked ? "#22c55e" : "#fff"
  for (const p of pts) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, locked ? 7 : 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

onBeforeUnmount(() => {
  stop()
  scanner.dispose()
})

async function start() {
  state.value = "loading"
  errorMessage.value = ""
  clearCapture()

  if (!navigator.mediaDevices?.getUserMedia) {
    fail("camera-unsupported")
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode.value },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    // The <video> is rendered once modelValue is true; wait for it to mount.
    await nextTick()
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      videoEl.value.muted = true
      await videoEl.value.play().catch(() => {})
    }
    state.value = "streaming"
    // Kick off scanning in the background. OpenCV downloads lazily here; until
    // it's ready the static guide frame shows and the manual shutter works.
    if (props.scan) {
      const ok = await scanner.load()
      if (ok && state.value === "streaming") scanner.start()
    }
  } catch (err) {
    fail(err?.name || "camera-error")
  }
}

function stop() {
  scanner.stop()
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
}

function fail(name) {
  stop()
  const byName = {
    NotAllowedError:
      "L'accès à la caméra a été refusé. Autorisez la caméra ou choisissez un fichier.",
    NotFoundError: "Aucune caméra n'a été détectée sur cet appareil.",
    NotReadableError: "La caméra est déjà utilisée par une autre application.",
    "camera-unsupported": "La caméra n'est pas disponible sur ce navigateur.",
  }
  errorMessage.value = byName[name] || "Impossible d'accéder à la caméra."
  state.value = "error"
}

// Shutter handler / auto-capture entry point. Prefers the OpenCV pipeline
// (perspective-corrected + enhanced) and falls back to a plain frame grab.
async function doCapture() {
  const video = videoEl.value
  if (!video || !video.videoWidth || capturing) return
  capturing = true
  scanner.stop() // freeze detection while we shoot

  try {
    let blob
    if (scanActive.value) {
      ;({ blob } = await scanner.capture())
    } else {
      blob = await grabFrameBlob(video)
    }
    if (blob) {
      capturedBlob = blob
      capturedUrl.value = URL.createObjectURL(blob)
      state.value = "review"
    }
  } catch {
    // Pipeline hiccup — fall back to the raw frame so the user isn't stuck.
    const blob = await grabFrameBlob(video).catch(() => null)
    if (blob) {
      capturedBlob = blob
      capturedUrl.value = URL.createObjectURL(blob)
      state.value = "review"
    }
  } finally {
    capturing = false
  }
}

// Raw current frame → JPEG Blob (no OpenCV).
function grabFrameBlob(video) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
  })
}

function retake() {
  clearCapture()
  state.value = "streaming"
}

// Keep the still under review and go back to the camera to shoot another page.
function addPage() {
  commitCurrent()
  state.value = "streaming"
}

// Move the still under review into the confirmed pages list.
function commitCurrent() {
  if (!capturedBlob) return
  pages.value.push({ blob: capturedBlob, url: capturedUrl.value })
  // Ownership of the object URL moves to the page entry — don't revoke it here.
  capturedBlob = null
  capturedUrl.value = ""
}

function confirm() {
  commitCurrent()
  if (!pages.value.length) return
  const base = slug(props.title) || "document"
  const multi = pages.value.length > 1
  const files = pages.value.map(
    (page, i) =>
      new File(
        [page.blob],
        multi ? `${base}-${Date.now()}-${i + 1}.jpg` : `${base}-${Date.now()}.jpg`,
        { type: "image/jpeg" },
      ),
  )
  emit("capture", files)
  close()
}

async function flip() {
  facingMode.value = facingMode.value === "environment" ? "user" : "environment"
  stop()
  await start()
}

// Give up on the camera and let the parent reopen the native file picker.
function fallback() {
  emit("error", "fallback")
  close()
}

function close() {
  resetAll()
  emit("update:modelValue", false)
}

function clearCapture() {
  if (capturedUrl.value) {
    URL.revokeObjectURL(capturedUrl.value)
    capturedUrl.value = ""
  }
  capturedBlob = null
}

// Drop the still under review AND every confirmed page (fresh capture session).
function resetAll() {
  clearCapture()
  pages.value.forEach((page) => URL.revokeObjectURL(page.url))
  pages.value = []
}

function slug(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD") // accents become combining marks, stripped by the filter below
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="capture-overlay" role="dialog" aria-modal="true" :aria-label="`Photographier : ${title}`">
      <!-- Live camera (kept mounted while streaming/loading) -->
      <video v-show="state === 'streaming' || state === 'loading'" ref="videoEl" class="capture-media" autoplay
        playsinline muted />
      <!-- Real-time document-detection overlay (drawn over the live video) -->
      <canvas v-show="state === 'streaming'" ref="overlayEl" class="capture-overlay-canvas" />
      <!-- Frozen still under review -->
      <img v-if="state === 'review'" :src="capturedUrl" class="capture-media" :alt="`Aperçu : ${title}`" />

      <!-- Top bar -->
      <div class="capture-top">
        <v-btn :icon="mdiClose" variant="text" color="white" size="large" aria-label="Fermer" @click="close" />
        <div class="capture-title text-truncate">{{ title }}</div>
        <v-btn v-if="state === 'streaming'" :icon="mdiCameraFlipOutline" variant="text" color="white" size="large"
          aria-label="Changer de caméra" @click="flip" />
        <div v-else class="capture-top-spacer" />
      </div>

      <!-- Page counter (multi-page capture) -->
      <div v-if="(state === 'streaming' || state === 'review') && pages.length" class="capture-pages-chip">
        {{ pages.length }} page{{ pages.length > 1 ? 's' : '' }} ajoutée{{ pages.length > 1 ? 's' : '' }}
      </div>

      <!-- Static guide frame — shown until OpenCV scanning takes over -->
      <div v-if="state === 'streaming' && !scanActive" class="capture-guide-wrap">
        <div class="capture-guide" :class="`capture-guide--${frame}`">
          <span class="capture-corner capture-corner--tl" />
          <span class="capture-corner capture-corner--tr" />
          <span class="capture-corner capture-corner--bl" />
          <span class="capture-corner capture-corner--br" />
        </div>
        <div class="capture-hint">{{ guideText }}</div>
      </div>

      <!-- Scanning status: searching / hold-still countdown ring -->
      <div v-if="state === 'streaming' && scanActive" class="capture-scan-status">
        <v-progress-circular v-if="documentInView" :model-value="scanner.progress.value * 100"
          :color="scanner.progress.value >= 1 ? 'success' : 'white'" size="56" width="4">
          <v-icon :icon="mdiCheck" color="white" size="22" />
        </v-progress-circular>
        <div class="capture-hint capture-hint--scan">
          {{ documentInView ? "Maintenez stable…" : "Recherche du document…" }}
        </div>
      </div>

      <!-- Loading -->
      <div v-if="state === 'loading'" class="capture-center">
        <v-progress-circular indeterminate color="white" size="44" />
        <div class="capture-center-text">Activation de la caméra…</div>
      </div>

      <!-- Error / fallback -->
      <div v-if="state === 'error'" class="capture-center">
        <v-icon :icon="mdiImageBrokenVariant" size="48" color="white" />
        <div class="capture-center-text">{{ errorMessage }}</div>
        <div class="d-flex flex-column align-stretch ga-2 mt-5" style="width: min(280px, 80vw)">
          <v-btn color="white" variant="flat" rounded="lg" size="large" class="text-none" @click="start">
            Réessayer
          </v-btn>
          <v-btn color="white" variant="outlined" rounded="lg" size="large" class="text-none" @click="fallback">
            Choisir un fichier
          </v-btn>
        </div>
      </div>

      <!-- Bottom controls -->
      <div class="capture-bottom">
        <template v-if="state === 'streaming'">
          <!-- Pages already captured — finish without shooting another -->
          <v-btn v-if="pages.length" variant="flat" color="white" rounded="lg" size="large"
            class="text-none capture-side-btn" :prepend-icon="mdiCheck" @click="confirm">
            Valider ({{ pages.length }})
          </v-btn>
          <div v-else class="capture-side-btn" />

          <button class="shutter" aria-label="Prendre la photo" @click="doCapture">
            <span class="shutter-ring" />
          </button>

          <div class="capture-side-btn" />
        </template>

        <template v-else-if="state === 'review'">
          <v-btn variant="text" color="white" rounded="lg" size="large" class="text-none" :prepend-icon="mdiRefresh"
            @click="retake">
            Reprendre
          </v-btn>
          <v-btn variant="outlined" color="white" rounded="lg" size="large" class="text-none"
            :prepend-icon="mdiCameraPlusOutline" @click="addPage">
            Page suivante
          </v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" size="large" class="text-none" :prepend-icon="mdiCheck"
            @click="confirm">
            Valider
          </v-btn>
        </template>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.capture-overlay {
  position: fixed;
  inset: 0;
  z-index: 30000;
  background: #000;
  overflow: hidden;
  /* Respect notches / home indicator on mobile */
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.capture-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

/* Detection overlay sits exactly over the video, never intercepts taps. */
.capture-overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* ---- live-scan status (ring + hint) ---- */
.capture-scan-status {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 128px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.capture-hint--scan {
  position: static;
  transform: none;
}

/* ---- top bar ---- */
.capture-top {
  position: absolute;
  top: env(safe-area-inset-top);
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
  z-index: 2;
}

.capture-title {
  flex: 1;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 1.0625rem;
  padding: 0 4px;
}

.capture-top-spacer {
  width: 48px;
}

/* ---- multi-page counter chip ---- */
.capture-pages-chip {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 60px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.92);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* ---- guide frame ---- */
.capture-guide-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}

.capture-guide {
  position: relative;
  border-radius: 16px;
  /* Darken everything outside the frame */
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.55);
  outline: 2px solid rgba(255, 255, 255, 0.7);
}

.capture-guide--card {
  width: min(88vw, 78vh * 1.586);
  aspect-ratio: 1.586;
}

.capture-guide--page {
  height: min(62vh, 88vw / 0.707);
  aspect-ratio: 0.707;
}

.capture-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid #fff;
}

.capture-corner--tl {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 16px;
}

.capture-corner--tr {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 16px;
}

.capture-corner--bl {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 16px;
}

.capture-corner--br {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 16px;
}

.capture-hint {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 132px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 86vw;
  text-align: center;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
}

/* ---- loading / error centered block ---- */
.capture-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  z-index: 2;
}

.capture-center-text {
  color: #fff;
  margin-top: 16px;
  font-size: 1rem;
  max-width: 320px;
  line-height: 1.4;
}

/* ---- bottom controls ---- */
.capture-bottom {
  position: absolute;
  bottom: env(safe-area-inset-bottom);
  left: 0;
  right: 0;
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
  z-index: 2;
}

/* Side slots keep the shutter centered while an action sits beside it. */
.capture-side-btn {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  min-width: 0;
}

.capture-side-btn:first-child {
  justify-content: flex-start;
}

.capture-side-btn:last-child {
  justify-content: flex-end;
}

.shutter {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease, background 0.12s ease;
}

.shutter:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.4);
}

.shutter-ring {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fff;
  box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.15);
}
</style>
