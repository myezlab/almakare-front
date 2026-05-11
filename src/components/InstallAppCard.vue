<script setup>
import { useMessagesStore } from "@/stores/messages"
import { useParamsStore } from "@/stores/params"
import { mdiDownloadOutline } from "@mdi/js"
import { ref } from "vue"

const dialogInstallApp = ref(false)
const paramsStore = useParamsStore()
const messagesStore = useMessagesStore()

function installApp() {
  paramsStore.beforeinstallprompt.prompt()
  paramsStore.beforeinstallprompt.userChoice.then(function (choiceResult) {
    if (choiceResult.outcome === "dismissed") {
      messagesStore.add({
        type: "info",
        text: 'Installation annulée',
      })
    } else {
      messagesStore.add({
        type: "success",
        text: 'Installation en cours…',
      })
    }
  })
  dialogInstallApp.value = false
  paramsStore.beforeinstallprompt = null
}
</script>


<template>
  <v-card class="pa-4 card-shadow rounded-15 cursor-pointer" color="white" @click="installApp">
    <v-row align="center">
      <v-col>
        <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold mb-1">
          Installer l'application
        </div>
        <div class="text-body-medium text-medium-emphasis mb-3">
          Ajoutez myEZlab à votre écran d'accueil pour un accès rapide, même hors connexion.
        </div>
        <v-btn :prepend-icon="mdiDownloadOutline" variant="tonal" color="primary" rounded="lg" class="text-none">
          Installer
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-img src="@/assets/illustrations/install.svg" width="100" height="80" contain transition="fade-transition" />
      </v-col>
    </v-row>
  </v-card>
</template>
