// Lazy OpenCV.js loader.
//
// OpenCV.js ships a multi-megabyte WASM runtime, so it must never be part of the
// main bundle. This module injects the script tag on first use and resolves once
// the WASM runtime has finished initialising. The returned `cv` object is the
// global OpenCV namespace (Mat, Canny, findContours…).
//
// Usage:
//   import { loadOpenCv } from "@/utils/opencv"
//   const cv = await loadOpenCv()        // safe to call many times
//
// The promise is cached: concurrent and later callers share one download and one
// runtime. Call only when the scanner UI is actually opened.

// Pinned, self-contained OpenCV.js build served from jsDelivr (a production CDN).
// This build embeds the WASM as a data: URI, so there's no second .wasm request
// and no cross-origin/locateFile setup. Pinning the version keeps it cache-stable
// across deploys. (The official docs.opencv.org/<version>/opencv.js works too but
// that host is the docs site, not a CDN — and several version paths 404.)
const OPENCV_URL =
  "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js"

// Module-level cache so the runtime is fetched and initialised at most once.
let loadPromise = null

/**
 * Resolve once the OpenCV WASM runtime is ready.
 * @param {string} [url] Override the script URL (e.g. a self-hosted copy).
 * @returns {Promise<object>} The global `cv` namespace.
 */
export function loadOpenCv(url = OPENCV_URL) {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    // Guard against a CDN that downloads but never initialises the runtime, so
    // callers fall back to the manual shutter instead of awaiting forever.
    const timer = setTimeout(() => {
      loadPromise = null
      reject(new Error("OpenCV.js initialisation timed out."))
    }, 25000)
    const done = (cv) => {
      clearTimeout(timer)
      resolve(cv)
    }
    const fail = (err) => {
      clearTimeout(timer)
      loadPromise = null // let a later call retry from scratch
      reject(err)
    }

    // Already present (hot reload, or loaded elsewhere)? Just wait for runtime.
    if (window.cv) {
      waitForRuntime(window.cv, done)
      return
    }

    const script = document.createElement("script")
    script.src = url
    script.async = true

    script.onload = () => {
      const cv = window.cv
      if (!cv) {
        fail(new Error("OpenCV.js loaded but window.cv is undefined."))
        return
      }
      // Newer builds expose `cv` as a thenable that resolves to the namespace.
      if (typeof cv.then === "function") {
        cv.then((resolved) => {
          window.cv = resolved
          done(resolved)
        }, fail)
      } else {
        waitForRuntime(cv, done)
      }
    }

    script.onerror = () => fail(new Error("Failed to download OpenCV.js."))

    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * Bridge the two ways the asm/WASM build signals readiness: either `Mat` already
 * exists (runtime initialised before we looked), or it will, and the build calls
 * `onRuntimeInitialized` when it does.
 */
function waitForRuntime(cv, resolve) {
  if (cv.Mat) {
    resolve(cv)
    return
  }
  const previous = cv.onRuntimeInitialized
  cv.onRuntimeInitialized = () => {
    if (typeof previous === "function") previous()
    resolve(cv)
  }
}

/** True once the runtime is usable, without triggering a load. */
export function isOpenCvReady() {
  return !!(window.cv && window.cv.Mat)
}
