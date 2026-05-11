const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require("firebase-admin/firestore")
const { onCall, HttpsError } = require('firebase-functions/v2/https')

const db = getFirestore()
const auth = getAuth()

exports.setLanguage = onCall(async (request) => {
  const { language } = request.data
  const userId = request.auth.uid

  if (!language) throw new HttpsError('invalid-argument', 'Language is required.')

  if (!request.auth) throw new HttpsError('permission-denied', 'Unauthorized.')
  
  // update user's language in firestore
  await db.doc(`users/${userId}`).update({ language })

  try {
    return auth.getUser(userId).then((userRecord) => {
      let claims = userRecord.customClaims || {}
      claims.language = language
      return auth.setCustomUserClaims(userId, claims)
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', `Error: ${error.message}`)
  }
})