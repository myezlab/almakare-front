const { initializeApp, cert } = require("firebase-admin/app")
const { setGlobalOptions } = require('firebase-functions/v2')

const serviceAccount = require("./service-account-key.json")

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "gs://myezlabo.firebasestorage.app"
})

setGlobalOptions({ region: 'europe-west1', invoker: 'public' })

exports.languages = require('./languages')
exports.pictures = require('./pictures')
exports.pushNotifications = require('./pushNotifications')
exports.ocr = require('./ocr')
