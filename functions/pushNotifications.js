const { getFirestore, FieldValue } = require("firebase-admin/firestore")
const { getMessaging } = require("firebase-admin/messaging")
const { onDocumentCreated } = require("firebase-functions/v2/firestore")
const { createLog } = require("./utils")

const db = getFirestore()

// Send push notification to interviewer when a new message is created
// Only notifies when the message author is NOT the interviewer (i.e. admin sent it)
exports.onNewMessage = onDocumentCreated(
  "users/{userId}/messages/{messageId}",
  async (event) => {
    const { userId } = event.params
    const messageData = event.data?.data()

    if (!messageData) return

    // Don't notify if the user sent the message themselves
    if (messageData.authorId === userId) return

    // Update lastMessageAt on the user document
    try {
      await db.doc(`users/${userId}`).update({
        lastMessageAt: FieldValue.serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating lastMessageAt:", error)
    }

    try {
      const userDoc = await db.doc(`users/${userId}`).get()
      const user = userDoc.data()

      if (!user?.fcmTokens?.length) return

      const authorName = messageData.authorFullName || "DXL Team"
      const body =
        messageData.text?.length > 100
          ? messageData.text.substring(0, 100) + "…"
          : messageData.text || "New message"

      const messaging = getMessaging()
      const invalidTokens = []
      const type = messageData.type || ""

      // Send to all registered device tokens
      const sendPromises = user.fcmTokens.map(async (token) => {
        try {
          await messaging.send({
            token,
            notification: {
              title: authorName,
              body,
            },
            data: {
              type,
              userId,
            },
            webpush: {
              notification: {
                icon: "/pwa-192x192.png",
                badge: "/badge.png",
              },
            },
          })
        } catch (error) {
          // Token is invalid or expired — mark for removal
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(token)
          }
          console.error(`Error sending to token ${token}:`, error.code)
        }
      })

      await Promise.all(sendPromises)

      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        await db.doc(`users/${userId}`).update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        })
        createLog({
          title: `Removed ${invalidTokens.length} invalid FCM token(s) for user ${userId}`,
          type: 'warning',
        })
      }
    } catch (error) {
      createLog({
        title: `Failed to send push notification: ${error.message}`,
        type: 'error',
      })
    }
  }
)
