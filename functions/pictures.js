const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getStorage } = require('firebase-admin/storage')
const { getFirestore } = require("firebase-admin/firestore")

const sharp = require('sharp')
const os = require('os')
const path = require('path')
const fs = require('fs').promises

const db = getFirestore()

// Helper: create a sharp instance with SVG-friendly density if needed
const sharpFromInput = (inputPathOrBuffer, isSvg) => {
  const options = isSvg ? { density: 384 } : undefined
  return sharp(inputPathOrBuffer, options)
}

// Helper: build a pipeline -> resize -> (optional) flatten -> webp -> file
const buildPipelineToWebp = (sharpInput, opts) => {
  const { height, flattenToWhite } = opts
  let pipeline = sharpInput.resize({
    height,
    fit: 'inside',
    withoutEnlargement: true,
  })
  if (flattenToWhite === true) {
    pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
  }
  return pipeline.toFormat('webp', { quality: 80 })
}

/**
 * Shared image processing and upload logic
 * @param {Object} params
 * @param {string|Buffer} params.pictureData - Base64 string or buffer of image data
 * @param {string} params.pictureName - Original filename
 * @param {string} params.storagePath - Where to store the picture in Storage
 * @returns {Promise<Object>} - Picture and thumbnail URLs and paths
 */
async function processAndUploadImage({ pictureData, pictureName, storagePath, hasThumbnail = false }) {
  const bucket = getStorage().bucket('myezlabo.firebasestorage.app')

  // Extract the base name without extension from the original filename
  const baseName = path.parse(pictureName).name

  const tempOriginalPath  = path.join(os.tmpdir(), `original_${Date.now()}`)
  const tempPicturePath   = path.join(os.tmpdir(), `${baseName}.webp`)
  const tempThumbnailPath = path.join(os.tmpdir(), `${baseName}_thumbnail.webp`)

  const pictureFilename   = `${baseName}.webp`
  const thumbnailFilename = `${baseName}_thumbnail.webp`
  const picturePath       = path.join(storagePath, pictureFilename)
  const thumbnailPath     = path.join(storagePath, thumbnailFilename)

  try {
    console.log(`Processing image to folder: ${storagePath}`)

    // Decode pictureData
    let buffer
    if (typeof pictureData === 'string') {
      const base64Data = pictureData.replace(/^data:image\/[\w+.-]+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      buffer = Buffer.from(pictureData)
    }

    await fs.writeFile(tempOriginalPath, buffer)

    // Detect format
    const meta = await sharp(tempOriginalPath).metadata()
    const format = meta.format || 'unknown'
    const isSvg = format === 'svg'
    console.log(`Original image: ${meta.width}x${meta.height}, format=${format}`)

    // PICTURE (≈500px tall)
    {
      const input = isSvg
        ? sharpFromInput(tempOriginalPath, true)
        : sharpFromInput(tempOriginalPath, false)

      const picturePipeline = buildPipelineToWebp(input, {
        height: 500,
        flattenToWhite: false,
      })
      await picturePipeline.toFile(tempPicturePath)
    }

    // THUMBNAIL (≈100px tall)
    if (hasThumbnail) {
      const input = isSvg
        ? sharpFromInput(tempOriginalPath, true)
        : sharpFromInput(tempOriginalPath, false)

      const thumbPipeline = buildPipelineToWebp(input, {
        height: 100,
        flattenToWhite: false,
      })
      await thumbPipeline.toFile(tempThumbnailPath)
    }

    // Read processed dimensions
    const pictureMetadata = await sharp(tempPicturePath).metadata()
    console.log(`Processed picture: ${pictureMetadata.width}x${pictureMetadata.height}, webp`)
    if (hasThumbnail) {
      const thumbnailMetadata = await sharp(tempThumbnailPath).metadata()
      console.log(`Processed thumbnail: ${thumbnailMetadata.width}x${thumbnailMetadata.height}, webp`)
    }

    // Upload
    await bucket.upload(tempPicturePath, {
      destination: picturePath,
      metadata: {
        contentType: 'image/webp',
        contentDisposition: `inline; filename="${pictureFilename}"`,
        cacheControl: 'public, max-age=31536000',
      },
    })
    if (hasThumbnail) {
      await bucket.upload(tempThumbnailPath, {
        destination: thumbnailPath,
        metadata: {
          contentType: 'image/webp',
          contentDisposition: `inline; filename="${thumbnailFilename}"`,
          cacheControl: 'public, max-age=31536000',
        },
      })
    }

    // Signed URLs (10 years)
    const signedUrlPromises = [
      bucket.file(picturePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
      })
    ]
    if (hasThumbnail) {
      signedUrlPromises.push(
        bucket.file(thumbnailPath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
        })
      )
    }
    const signedUrlResults = await Promise.all(signedUrlPromises)

    const pictureUrl = signedUrlResults[0][0]
    const thumbnailUrl = hasThumbnail ? signedUrlResults[1][0] : null

    const cleanupPromises = [
      fs.unlink(tempOriginalPath),
      fs.unlink(tempPicturePath),
    ]
    if (hasThumbnail) cleanupPromises.push(fs.unlink(tempThumbnailPath))
    await Promise.allSettled(cleanupPromises)

    console.log(`Uploaded to ${picturePath}${hasThumbnail ? ` and ${thumbnailPath}` : ''}`)

    const result = {
      success: true,
      pictureUrl,
      picturePath,
    }
    if (hasThumbnail) {
      result.thumbnailUrl = thumbnailUrl
      result.thumbnailPath = thumbnailPath
    }
    return result
  } catch (error) {
    console.error('Error processing image:', error)
    await Promise.allSettled([
      fs.unlink(tempOriginalPath).catch(() => {}),
      fs.unlink(tempPicturePath).catch(() => {}),
      fs.unlink(tempThumbnailPath).catch(() => {}),
    ])

    const msg = String(error && error.message || '')
    if (msg.includes('Input buffer contains unsupported image format')) {
      throw new HttpsError('invalid-argument', 'Unsupported image format')
    } else if (msg.toLowerCase().includes('svg')) {
      throw new HttpsError(
        'invalid-argument',
        'SVG parsing failed. Ensure your SVG has a valid viewBox/width/height and is not extremely large.'
      )
    } else {
      throw new HttpsError('internal', `Error processing image: ${msg}`)
    }
  }
}

/**
 * Upload picture and save URLs to Firestore
 * Requires docPath parameter
 */
exports.uploadPicture = onCall({
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10,
  invoker: 'public',
}, async (request) => {
  const { pictureData, pictureName, storagePath, docPath, hasThumbnail = false } = request.data

  if (!pictureData || !storagePath || !pictureName || !docPath) {
    throw new HttpsError('invalid-argument', 'Missing required parameters: pictureData, storagePath, pictureName, and docPath are required')
  }

  if (!request.auth) {
    throw new HttpsError('permission-denied', 'User is not authorized to perform this action')
  }

  const result = await processAndUploadImage({ pictureData, pictureName, storagePath, hasThumbnail })

  // Save to Firestore using pictureName as field prefix
  const baseName = require('path').parse(pictureName).name
  const firestoreData = {
    [`${baseName}Url`]: result.pictureUrl,
    [`${baseName}Path`]: result.picturePath,
  }
  if (hasThumbnail) {
    firestoreData[`${baseName}ThumbnailUrl`] = result.thumbnailUrl
    firestoreData[`${baseName}ThumbnailPath`] = result.thumbnailPath
  }
  await db.doc(docPath).set(firestoreData, { merge: true })

  return result
})

/**
 * Upload picture and return URLs without saving to Firestore
 */
exports.uploadPictureOnly = onCall({
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10,
  invoker: 'public',
}, async (request) => {
  const { pictureData, pictureName, storagePath, hasThumbnail = false } = request.data

  if (!pictureData || !storagePath || !pictureName) {
    throw new HttpsError('invalid-argument', 'Missing required parameters: pictureData, storagePath, and pictureName are required')
  }

  if (!request.auth) {
    throw new HttpsError('permission-denied', 'User is not authorized to perform this action')
  }

  return await processAndUploadImage({ pictureData, pictureName, storagePath, hasThumbnail })
})
