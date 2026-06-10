// Real-time document scanning loop for a live <video> element.
//
// Wraps the OpenCV.js loader + detection algorithms into a small reactive API the
// camera overlay can drive:
//
//   const scanner = useDocumentScanner(() => videoEl.value, {
//     onAutoCapture: () => confirmCapture(),
//   })
//   await scanner.load()      // lazy-loads OpenCV.js, sets `ready`
//   scanner.start()           // begins the rAF detection loop
//   ...                       // read scanner.quad / scanner.progress in template
//   const shot = await scanner.capture()   // { blob, dataUrl, corners }
//   scanner.stop(); scanner.dispose()      // on teardown
//
// Detection runs on a downscaled offscreen canvas so the loop stays cheap on
// phones. The detected quad is exposed in NORMALISED [0..1] coordinates so the
// component can map it onto the displayed video however it likes (object-fit
// cover, letterboxing, etc.) without caring about the camera resolution.
import { ref, shallowRef } from "vue"

import { loadOpenCv } from "@/utils/opencv"
import {
  canvasToBlob,
  canvasToDataUrl,
  detectDocument,
  scanDocument,
} from "@/utils/documentScanner"

// Width of the offscreen frame fed to the detector. Smaller = faster; document
// borders survive aggressive downscaling. Kept low so the synchronous OpenCV
// work per pass stays short on mobile CPUs.
const SCAN_WIDTH = 360
// Idle gap left AFTER each detection finishes (see the self-scheduling loop in
// start()). This guarantees the main thread is free between passes so taps and
// other UI events are never starved by the WASM work.
const DETECT_INTERVAL_MS = 220
// A corner may drift this far (as a fraction of frame size) and still count as
// "held still". Tolerates hand shake without feeling sticky.
const STABLE_TOLERANCE = 0.02

/**
 * @param {() => HTMLVideoElement|null} getVideo  Accessor for the live video.
 * @param {object} [options]
 * @param {number} [options.stableMs=1000]  Hold-still time before auto-capture.
 * @param {() => void} [options.onAutoCapture] Fired once when the doc is stable.
 */
export function useDocumentScanner(getVideo, options = {}) {
  const stableMs = options.stableMs ?? 1000

  const ready = ref(false)
  const error = ref("")
  // Detected corners as [{x,y}…] normalised to [0..1], or null when none found.
  const quad = shallowRef(null)
  // 0 → 1 progress toward auto-capture while the document is held still.
  const progress = ref(0)

  let cv = null
  let timerId = 0
  let running = false
  let stableSince = 0
  let captured = false
  // Offscreen canvas reused every frame to avoid per-frame allocation.
  let scanCanvas = null
  let scanCtx = null

  /** Lazily download + initialise OpenCV.js. Safe to call repeatedly. */
  async function load() {
    if (ready.value) return true
    try {
      cv = await loadOpenCv()
      scanCanvas = document.createElement("canvas")
      scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true })
      ready.value = true
      return true
    } catch (err) {
      error.value = err?.message || "OpenCV could not be loaded."
      return false
    }
  }

  /**
   * Begin the detection loop (no-op until OpenCV is ready).
   *
   * Self-scheduling on setTimeout rather than requestAnimationFrame: the next
   * pass is queued only AFTER the current (synchronous, CPU-heavy) detection
   * returns, with a fixed idle gap in between. That gap is what keeps the main
   * thread responsive — taps on the shutter / close buttons are handled in it.
   * An rAF loop would instead re-fire back-to-back and could starve input.
   */
  function start() {
    if (running) return
    running = true
    captured = false
    resetStability()
    progress.value = 0

    const tick = () => {
      timerId = 0
      if (!running) return
      // Skip work when ready-but-hidden or the frame isn't paintable yet.
      if (ready.value && !document.hidden) {
        try {
          detectFrame(performance.now())
        } catch {
          // Never let a bad frame kill the loop.
        }
      }
      if (running) timerId = setTimeout(tick, DETECT_INTERVAL_MS)
    }
    timerId = setTimeout(tick, DETECT_INTERVAL_MS)
  }

  /** Pause the loop and clear the overlay. */
  function stop() {
    running = false
    if (timerId) clearTimeout(timerId)
    timerId = 0
    quad.value = null
    progress.value = 0
    stableSince = 0
  }

  // One detection pass: grab a downscaled frame, find the document, update the
  // reactive quad, and track how long it has stayed still.
  function detectFrame(now) {
    const video = getVideo()
    if (!video || !video.videoWidth) return

    const scale = video.videoWidth > SCAN_WIDTH ? SCAN_WIDTH / video.videoWidth : 1
    const w = Math.round(video.videoWidth * scale)
    const h = Math.round(video.videoHeight * scale)
    if (scanCanvas.width !== w) scanCanvas.width = w
    if (scanCanvas.height !== h) scanCanvas.height = h
    scanCtx.drawImage(video, 0, 0, w, h)

    let src = null
    try {
      src = cv.imread(scanCanvas)
      const corners = detectDocument(cv, src)
      if (corners) {
        const norm = corners.map((p) => ({ x: p.x / w, y: p.y / h }))
        trackStability(norm, now)
        quad.value = norm
      } else {
        quad.value = null
        resetStability()
      }
    } catch {
      // A transient detection failure shouldn't kill the loop.
      quad.value = null
      resetStability()
    } finally {
      if (src) src.delete()
    }
  }

  let lastQuad = null
  function trackStability(norm, now) {
    if (lastQuad && maxCornerShift(lastQuad, norm) < STABLE_TOLERANCE) {
      if (!stableSince) stableSince = now
      progress.value = Math.min(1, (now - stableSince) / stableMs)
      if (progress.value >= 1 && !captured) {
        captured = true
        options.onAutoCapture?.()
      }
    } else {
      resetStability()
    }
    lastQuad = norm
  }

  function resetStability() {
    stableSince = 0
    progress.value = 0
    lastQuad = null
  }

  // Largest single-corner movement between two normalised quads.
  function maxCornerShift(a, b) {
    let max = 0
    for (let i = 0; i < 4; i++) {
      max = Math.max(max, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y))
    }
    return max
  }

  /**
   * Capture the current frame at full resolution and run the full pipeline
   * (perspective correction + enhancement). Uses the live quad when available.
   *
   * @param {object} [opts]
   * @param {boolean} [opts.enhance=true]
   * @returns {Promise<{blob: Blob, dataUrl: string, corners: Array|null}>}
   */
  async function capture(opts = {}) {
    const video = getVideo()
    if (!cv || !video || !video.videoWidth) {
      throw new Error("Camera frame not available for capture.")
    }

    // Snapshot the frame at native resolution for a high-quality result.
    const full = document.createElement("canvas")
    full.width = video.videoWidth
    full.height = video.videoHeight
    full.getContext("2d").drawImage(video, 0, 0, full.width, full.height)

    // Map the normalised live quad to full-resolution pixels.
    const corners = quad.value
      ? quad.value.map((p) => ({ x: p.x * full.width, y: p.y * full.height }))
      : null

    const { canvas, corners: used } = scanDocument(cv, full, {
      corners,
      enhance: opts.enhance !== false,
    })
    const blob = await canvasToBlob(canvas)
    const dataUrl = canvasToDataUrl(canvas)
    return { blob, dataUrl, corners: used }
  }

  /** Release retained canvases. OpenCV's own runtime stays cached for reuse. */
  function dispose() {
    stop()
    scanCanvas = null
    scanCtx = null
    lastQuad = null
  }

  return { ready, error, quad, progress, load, start, stop, capture, dispose }
}
