<script setup>
import detailsIllustration from "@/assets/illustrations/details.svg"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import { ref } from "vue"

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()

const formRef = ref(null)
const firstName = ref("")
const lastName = ref("")
const saving = ref(false)

const required = (v) => !!v?.trim() || "Ce champ est requis"

async function handleContinue() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const first = firstName.value.trim()
    const last = lastName.value.trim()
    Object.assign(selfStore.item, {
      firstName: first,
      lastName: last,
      fullName: `${first} ${last}`,
    })
    messagesStore.add({ type: "success", text: "Bienvenue !" })
  } catch {
    messagesStore.add({ type: "error", text: "Erreur lors de l'enregistrement" })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="true" persistent max-width="460" :fullscreen="$vuetify.display.mobile">
    <v-card class="pa-2" :class="{ 'rounded-15': !$vuetify.display.mobile }">
      <v-card-text class="text-center px-6 pt-6 pb-6">
        <img :src="detailsIllustration" alt="" class="welcome-illustration mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">Bienvenue !</div>
        <div class="text-body-medium text-medium-emphasis mb-6">
          Pour commencer, indiquez-nous votre prénom et votre nom.
        </div>

        <v-form ref="formRef" @submit.prevent="handleContinue">
          <v-text-field v-model.trim="firstName" label="Prénom" variant="outlined" rounded="lg"
            density="comfortable" autofocus :rules="[required]" class="mb-2" />
          <v-text-field v-model.trim="lastName" label="Nom" variant="outlined" rounded="lg"
            density="comfortable" :rules="[required]" class="mb-4" />
          <v-btn color="primary" rounded="lg" flat size="large" block class="text-none" type="submit"
            :loading="saving">
            Continuer
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.welcome-illustration {
  height: 140px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
