<script setup>
import OverlayPending from "@/components/OverlayPending.vue"
import { useMessagesStore } from '@/stores/messages'
import { useParamsStore } from "@/stores/params"
import { usePendingsStore } from '@/stores/pendings'
import { useSelfStore } from "@/stores/self"
import { defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import Snackbar from "./components/Snackbar.vue"

const Navigation = defineAsyncComponent(() =>
  import("@/components/NavigationDrawer.vue")
)

const selfStore = useSelfStore()
const router = useRouter()
const isReady = ref(false)
const pendingsStore = usePendingsStore()
const paramsStore = useParamsStore()
const messagesStore = useMessagesStore()


// Before install prompt listener
window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault()
  paramsStore.beforeinstallprompt = event
})

async function launch() {
  await router.isReady()
  await selfStore.init()
  selfStore.getItem()
  isReady.value = true
  pendingsStore.overlay = false
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
