<script setup>
import OverlayPending from "@/components/OverlayPending.vue"
import { registerOnMessage } from '@/composables/usePushNotifications'
import { useMessagesStore } from '@/stores/messages'
import { useParamsStore } from "@/stores/params"
import { usePendingsStore } from '@/stores/pendings'
import { useSelfStore } from "@/stores/self"
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import Snackbar from "./components/Snackbar.vue"

const Navigation = defineAsyncComponent(() =>
  import("@/components/NavigationDrawer.vue")
)

const auth = getAuth()
const selfStore = useSelfStore()
const router = useRouter()
const isReady = ref(false)
const pendingsStore = usePendingsStore()
const paramsStore = useParamsStore()
const messagesStore = useMessagesStore()

registerOnMessage(messagesStore)

// Before install prompt listener
window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault()
  paramsStore.beforeinstallprompt = event
})

async function launch() {
  await router.isReady()
  onAuthStateChanged(auth, async (userMetaData) => {
    if (!userMetaData) {
      console.log("no user")
      selfStore.item = { language: 'vi-VN' }
    } else if (userMetaData) {
      selfStore.item = { language: 'vi-VN' }
      selfStore.item.id = userMetaData.uid
      await selfStore.init()
      selfStore.getItem(userMetaData.uid)
    }
    isReady.value = true
    pendingsStore.overlay = false
  })
}

launch()
</script>

<template>
  <v-app>
    <v-main class="background-image">
      <template v-if="selfStore.item.id && !['Login'].includes($route.name)">
        <Navigation />
      </template>
      <template v-if="isReady">
        <router-view v-slot="{ Component }">
          <v-fade-transition hide-on-leave>
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </template>
    </v-main>
    <OverlayPending />
    <Snackbar />
  </v-app>
</template>
