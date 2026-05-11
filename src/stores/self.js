import { getAuth, signOut } from "firebase/auth"
import { doc, getFirestore, onSnapshot } from "firebase/firestore"
import { defineStore } from 'pinia'
import { ref } from "vue"

const db = getFirestore()
const auth = getAuth()

export const useSelfStore = defineStore('self', () => {

  const item = ref({language: 'fr-FR'})
  const unsubscribe = ref(null)

  async function init() {
    console.log("self.init")
    const { claims } = await auth.currentUser.getIdTokenResult(true)
    console.log(claims)
    if (claims.email) item.value.email = claims.email
    if (claims.isDisabled) item.value.isDisabled = true
    if (claims.language) item.value.language = claims.language
  }

  async function getItem(selfId) {

    if (unsubscribe.value) unsubscribe.value()
    // Listen to the correct collection based on role
    unsubscribe.value = onSnapshot(doc(db, `users/${selfId}`), (docSnap) => {
      let data = docSnap.data()
      if (data && data.isDisabled) {
        unsubscribe.value()
        signOut(auth)
      }
      item.value = { ...item.value, ...data }
    }, (error) => {
      console.error(`users/${selfId} onSnapshot error:`, error)
    })
  }

  return { item, unsubscribe, getItem, init }
})
