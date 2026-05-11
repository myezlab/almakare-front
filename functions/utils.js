const { getFirestore, Timestamp } = require("firebase-admin/firestore")

const db = getFirestore()

const BATCH_SIZE = 500

/**
 * Delete all documents in a collection
 * @param {string} path - The collection path
 *                               If not provided, creates and commits its own batches.
 * @returns {Promise<number>} - The number of documents deleted
 */
async function deleteCollection(path) {
  const snapshot = await db.collection(path).get()
  
  if (snapshot.empty) {
    return 0
  }

  // Otherwise, handle batching internally with 500 doc limit per batch
  let deleted = 0
  const docs = snapshot.docs

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE)
    const writeBatch = db.batch()
    
    chunk.forEach(doc => writeBatch.delete(doc.ref))
    await writeBatch.commit()
    deleted += chunk.length
  }

  return deleted
}

/**
 * Create a log entry in Firestore /logs/ collection
 * @param {Object} logData - The log data to store
 * @param {string} logData.title - Log title/message
 * @param {string} [logData.type] - Type of log ('info', 'warning', 'error', 'success', 'accent')
 * @param {string} [logData.adminId] - Admin user ID who triggered the action
 * @param {string} [logData.adminFullName] - Admin full name for display
 * @param {Array<{field: string, from?: string, to?: string}>} [logData.changes] - List of changes
 * @returns {Promise<string>} - The ID of the created log document
 */
async function createLog({ title, type, adminId, adminFullName, changes }) {
  try {
    const logEntry = {
      title,
      createdAt: Timestamp.now(),
      ...(type && { type }),
      ...(adminId && { adminId }),
      ...(adminFullName && { adminFullName }),
      ...(changes && { changes }),
    }

    return await db.collection('logs').add(logEntry)
  } catch (error) {
    console.error('Error creating log entry:', error)
  }
}

module.exports = {
  deleteCollection,
  createLog
}
