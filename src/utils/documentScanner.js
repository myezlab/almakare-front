// Document scanning algorithms built on OpenCV.js.
//
// Three responsibilities, all pure (given a ready `cv` namespace):
//   1. detectDocument()      — find the 4 corners of the largest page in a frame
//   2. fourPointTransform()  — flatten the page to a head-on rectangle
//   3. enhanceDocument()     — boost contrast + sharpen text for readability
//
// Plus thin helpers to turn the result into a Blob / Base64 for upload.
//
// Every function that allocates `cv.Mat`s deletes them in a `finally` block.
// OpenCV.js Mats live in WASM memory that the JS garbage collector cannot reach,
// so leaking them in a per-frame loop crashes the tab within seconds — explicit
// cleanup is mandatory, not optional.

// Frames are downscaled to this width before contour detection. Document edges
// are low-frequency, so a small image finds them just as reliably and keeps the
// real-time loop cheap on mobile CPUs.
const DETECT_WIDTH = 480

/**
 * Detect the largest 4-corner document in an image.
 *
 * @param {object} cv         Ready OpenCV namespace (from loadOpenCv()).
 * @param {cv.Mat} src        RGBA source image (e.g. from cv.imread / canvas).
 * @param {object} [opts]
 * @param {number} [opts.minAreaRatio=0.18] Reject quads smaller than this share
 *        of the frame — filters out small rectangles (stamps, photos on the page).
 * @returns {Array<{x:number,y:number}>|null} Corners in SOURCE pixel coordinates,
 *        ordered tl, tr, br, bl — or null when no confident document is found.
 */
export function detectDocument(cv, src, opts = {}) {
  const minAreaRatio = opts.minAreaRatio ?? 0.18

  const scale = src.cols > DETECT_WIDTH ? DETECT_WIDTH / src.cols : 1
  const work = new cv.Mat()
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const edges = new cv.Mat()
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()

  try {
    // 1. Downscale for speed.
    if (scale !== 1) {
      cv.resize(src, work, new cv.Size(0, 0), scale, scale, cv.INTER_AREA)
    } else {
      src.copyTo(work)
    }

    // 2. Grayscale → blur → Canny edges. The blur suppresses paper texture and
    //    JPEG noise so Canny locks onto the true document border.
    cv.cvtColor(work, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
    cv.Canny(blurred, edges, 75, 200)
    // Dilate to bridge small gaps in the border so it forms a closed contour.
    cv.dilate(edges, edges, kernel)

    // 3. Find external contours and keep the best quadrilateral.
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    const frameArea = work.cols * work.rows
    let best = null
    let bestArea = 0

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const peri = cv.arcLength(contour, true)
      const approx = new cv.Mat()
      // 2% of perimeter tolerance collapses a noisy border to its 4 corners.
      cv.approxPolyDP(contour, approx, 0.02 * peri, true)

      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = Math.abs(cv.contourArea(approx))
        if (area > bestArea && area > frameArea * minAreaRatio) {
          bestArea = area
          if (best) best.delete()
          best = approx
        } else {
          approx.delete()
        }
      } else {
        approx.delete()
      }
      contour.delete()
    }

    if (!best) return null

    // 4. Read out corners and scale back up to source coordinates.
    const points = []
    for (let i = 0; i < 4; i++) {
      points.push({
        x: best.data32S[i * 2] / scale,
        y: best.data32S[i * 2 + 1] / scale,
      })
    }
    best.delete()
    return orderCorners(points)
  } finally {
    work.delete()
    gray.delete()
    blurred.delete()
    edges.delete()
    kernel.delete()
    contours.delete()
    hierarchy.delete()
  }
}

/**
 * Order 4 unsorted corners as [top-left, top-right, bottom-right, bottom-left].
 * Uses the classic sum/diff trick: tl has the smallest x+y, br the largest;
 * tr has the smallest y−x, bl the largest.
 */
export function orderCorners(pts) {
  const sum = (p) => p.x + p.y
  const diff = (p) => p.y - p.x
  const tl = pts.reduce((a, b) => (sum(b) < sum(a) ? b : a))
  const br = pts.reduce((a, b) => (sum(b) > sum(a) ? b : a))
  const tr = pts.reduce((a, b) => (diff(b) < diff(a) ? b : a))
  const bl = pts.reduce((a, b) => (diff(b) > diff(a) ? b : a))
  return [tl, tr, br, bl]
}

/**
 * Warp the quadrilateral defined by `corners` into a head-on rectangle.
 *
 * @param {object} cv
 * @param {cv.Mat} src      Source image (RGBA).
 * @param {Array<{x,y}>} corners  Ordered tl, tr, br, bl (source coordinates).
 * @returns {cv.Mat} New warped Mat. Caller owns it and must .delete() it.
 */
export function fourPointTransform(cv, src, corners) {
  const [tl, tr, br, bl] = corners
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  // Output size = the longer of each opposing pair, so no detail is squeezed.
  const width = Math.round(Math.max(dist(br, bl), dist(tr, tl)))
  const height = Math.round(Math.max(dist(tr, br), dist(tl, bl)))
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
  ])
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, w - 1, 0, w - 1, h - 1, 0, h - 1,
  ])

  const M = cv.getPerspectiveTransform(srcTri, dstTri)
  const dst = new cv.Mat()
  try {
    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(w, h),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(),
    )
    return dst
  } finally {
    srcTri.delete()
    dstTri.delete()
    M.delete()
  }
}

/**
 * Improve readability: even out lighting (CLAHE on luminance), lift contrast,
 * and sharpen text with an unsharp mask — while preserving colour. Mutates and
 * returns `mat` in place.
 *
 * @param {object} cv
 * @param {cv.Mat} mat  RGBA image, modified in place.
 * @returns {cv.Mat} The same `mat`, enhanced.
 */
export function enhanceDocument(cv, mat) {
  const rgb = new cv.Mat()
  const lab = new cv.Mat()
  const channels = new cv.MatVector()
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8))
  const blurred = new cv.Mat()

  try {
    // Work in Lab so we only touch lightness — colours stay faithful.
    cv.cvtColor(mat, rgb, cv.COLOR_RGBA2RGB)
    cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab)
    cv.split(lab, channels)
    // CLAHE flattens uneven lighting / shadows across the page.
    clahe.apply(channels.get(0), channels.get(0))
    cv.merge(channels, lab)
    cv.cvtColor(lab, rgb, cv.COLOR_Lab2RGB)

    // Unsharp mask: sharpened = 1.5*img − 0.5*blur, makes text edges crisp.
    cv.GaussianBlur(rgb, blurred, new cv.Size(0, 0), 3)
    cv.addWeighted(rgb, 1.5, blurred, -0.5, 0, rgb)

    cv.cvtColor(rgb, mat, cv.COLOR_RGB2RGBA)
    return mat
  } finally {
    rgb.delete()
    lab.delete()
    for (let i = 0; i < channels.size(); i++) channels.get(i).delete()
    channels.delete()
    clahe.delete()
    blurred.delete()
  }
}

/**
 * Full pipeline on a still frame: detect → warp → enhance. Falls back to the
 * whole (still enhanced) frame when no document outline is found, so the user
 * always gets a usable image.
 *
 * @param {object} cv
 * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} source
 * @param {object} [opts]
 * @param {Array<{x,y}>|null} [opts.corners] Pre-detected corners in `source`
 *        pixel coordinates (skips re-detection — pass the live overlay's quad).
 * @param {boolean} [opts.enhance=true]
 * @returns {{canvas: HTMLCanvasElement, corners: Array|null}} Result canvas
 *        (caller converts to Blob/Base64) and the corners that were used.
 */
export function scanDocument(cv, source, opts = {}) {
  const enhance = opts.enhance !== false
  const src = cv.imread(source)
  let work = null
  try {
    const corners = opts.corners ?? detectDocument(cv, src)
    if (corners) {
      work = fourPointTransform(cv, src, corners)
    } else {
      work = src.clone()
    }
    if (enhance) enhanceDocument(cv, work)

    const canvas = document.createElement("canvas")
    cv.imshow(canvas, work)
    return { canvas, corners: corners ?? null }
  } finally {
    src.delete()
    if (work) work.delete()
  }
}

/** Canvas → JPEG Blob. */
export function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality,
    )
  })
}

/** Canvas → Base64 data URL (e.g. "data:image/jpeg;base64,…"). */
export function canvasToDataUrl(canvas, type = "image/jpeg", quality = 0.92) {
  return canvas.toDataURL(type, quality)
}
