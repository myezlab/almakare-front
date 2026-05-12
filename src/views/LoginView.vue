<script setup>
import doctorIllustration from "@/assets/illustrations/doctor.svg"
import patientIllustration from "@/assets/illustrations/patient.svg"
import coordinatorIllustration from "@/assets/illustrations/team.svg"
import technicianIllustration from "@/assets/illustrations/technician.svg"
import { useRules } from "@/composables/useRules"
import personalDataAuthorizationContent from "@/data/personalDataAuthorization.json"
import { useMessagesStore } from "@/stores/messages"
import { useSelfStore } from "@/stores/self"
import {
  mdiCheckCircleOutline,
  mdiEye,
  mdiEyeOff,
  mdiGoogle,
  mdiLockOutline,
} from "@mdi/js"
import { marked } from "marked"
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()
const messagesStore = useMessagesStore()
const selfStore = useSelfStore()
const { required, emailValidation, passwordValidation } = useRules()

// sign-in | sign-up | reset-password | loading | success
const status = ref(route.query.mode === "signup" ? "sign-up" : "sign-in")
const roleIllustrations = {
  patient: patientIllustration,
  coordinator: coordinatorIllustration,
  doctor: doctorIllustration,
  technician: technicianIllustration,
}
const roleIllustration = computed(() => roleIllustrations[route.query.role] || null)
const pendingEmail = ref(false)
const pendingGoogle = ref(false)

// Sign-in
const signInEmail = ref("test@test.fr")
const signInPassword = ref("testtest")
const showSignInPassword = ref(false)
const signInForm = ref(null)

// Sign-up
const signUpEmail = ref("test@test.fr")
const signUpPassword = ref("testtest")
const signUpConfirmPassword = ref("testtest")
const showSignUpPassword = ref(false)
const showSignUpConfirmPassword = ref(false)
const signUpForm = ref(null)
const agreementChecked = ref(false)
const showAgreementDialog = ref(false)

const isPatient = computed(() => route.query.role === "patient")
const parsedAgreement = computed(() => marked(personalDataAuthorizationContent["fr-FR"] || ""))

const DASHBOARD_BY_ROLE = {
  patient: "DashboardPatient",
  doctor: "DashboardDoctor",
}

function dashboardRouteFor(role) {
  return DASHBOARD_BY_ROLE[role] || "DashboardPatient"
}

// Password reset
const resetEmail = ref("")
const resetForm = ref(null)
const resetSent = ref(false)

const signUpPasswordsMatch = computed(() => {
  return (v) => v === signUpPassword.value || 'Les mots de passe ne correspondent pas'
})

function redirectToApp(role) {
  status.value = "success"
  setTimeout(() => router.push({ name: dashboardRouteFor(role) }), 1000)
}

async function handleSignIn() {
  if (!(await signInForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    selfStore.item.id = "123456"
    const role = route.query.role || selfStore.item.role || "patient"
    selfStore.item.role = role
    messagesStore.add({ type: "success", text: 'Connexion réussie' })
    redirectToApp(role)
  } catch (error) {
    console.error("Sign-in error:", error)
    messagesStore.add({ type: "error", text: 'Email ou mot de passe incorrect' })
  } finally {
    pendingEmail.value = false
  }
}

async function createUserDoc(uid, email) {
  const now = serverTimestamp()
}

async function handleSignUp() {
  if (!(await signUpForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    selfStore.item.id = "123456"
    selfStore.item.email = signUpEmail.value
    const role = route.query.role || "patient"
    selfStore.item.role = role
    if (isPatient.value) {
      selfStore.item.agreementPersonal = true
      selfStore.item.agreementPersonalDate = new Date().toISOString()
    }
    messagesStore.add({ type: "success", text: 'Connexion réussie' })
    redirectToApp(role)
  } catch (error) {
    console.error("Sign-up error:", error)
    if (error.code === "auth/email-already-in-use") {
      messagesStore.add({ type: "error", text: 'Email déjà utilisé' })
    } else {
      messagesStore.add({ type: "error", text: 'Erreur lors de la création du compte' })
    }
  } finally {
    pendingEmail.value = false
  }
}

async function handleGoogleSignIn() {
  if (status.value === "sign-up" && isPatient.value && !agreementChecked.value) {
    messagesStore.add({ type: "info", text: "Veuillez accepter les conditions de traitement de vos données personnelles" })
    return
  }
  pendingGoogle.value = true
  try {
    selfStore.item.id = "123456"
    const role = route.query.role || selfStore.item.role || "patient"
    selfStore.item.role = role
    if (status.value === "sign-up" && isPatient.value) {
      selfStore.item.agreementPersonal = true
      selfStore.item.agreementPersonalDate = new Date().toISOString()
    }
    messagesStore.add({ type: "success", text: 'Connexion réussie' })
    redirectToApp(role)
  } catch (error) {
    console.error("Google sign-in error:", error)
    if (error.code !== "auth/popup-closed-by-user") {
      messagesStore.add({ type: "error", text: 'Erreur de connexion' })
    }
  } finally {
    pendingGoogle.value = false
  }
}

function goToSignUp() {
  if (!route.query.role) {
    router.push({ name: 'Home' })
  } else {
    status.value = 'sign-up'
  }
}

async function handlePasswordReset() {
  if (!(await resetForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    resetSent.value = true
  } catch (error) {
    console.error("Password reset error:", error)
    if (error.code === "auth/user-not-found") {
      messagesStore.add({ type: "error", text: 'Aucun compte associé à cet email' })
    } else {
      messagesStore.add({ type: "error", text: "Erreur lors de l'envoi de l'email de réinitialisation" })
    }
  } finally {
    pendingEmail.value = false
  }
}
</script>

<template>
  <div class="d-flex flex-column align-center justify-center min-h-screen px-4">
    <v-card class="pa-8 text-center rounded-15 card-shadow" :max-width="450" width="100%">

      <div class="d-flex justify-start mb-4" v-if="!['success', 'loading'].includes(status)">
        <v-btn variant="text" color="medium-emphasis" rounded="lg" size="small" class="text-none"
          @click="router.push('/')">
          Retour
        </v-btn>
      </div>

      <!-- Loading -->
      <template v-if="status === 'loading'">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-6" />
        <div class="text-headline-small font-weight-bold">Connexion en cours</div>
        <div class="text-body-medium text-medium-emphasis mt-2">Veuillez patienter...</div>
      </template>

      <!-- Sign in -->
      <template v-if="status === 'sign-in'">
        <img v-if="roleIllustration" :src="roleIllustration" alt="" class="header-illustration mb-4" />
        <v-icon v-else :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">Bon retour parmi nous</div>
        <div class="text-body-medium text-medium-emphasis mb-6">Connectez-vous avec votre email et mot de passe</div>

        <v-form ref="signInForm" @submit.prevent="handleSignIn">
          <v-text-field v-model="signInEmail" label="Email" type="email" variant="outlined" rounded="lg"
            density="comfortable" class="mb-2" :rules="[required, emailValidation]" />

          <v-text-field v-model="signInPassword" label="Mot de passe" :type="showSignInPassword ? 'text' : 'password'"
            variant="outlined" rounded="lg" density="comfortable" class="mb-1" :rules="[required]"
            :append-inner-icon="showSignInPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignInPassword = !showSignInPassword" />

          <div class="d-flex justify-end mb-4">
            <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none"
              @click="resetEmail = signInEmail; resetSent = false; status = 'reset-password'">
              Mot de passe oublié ?
            </v-btn>
          </div>

          <v-btn color="primary" rounded="lg" flat size="large" block :loading="pendingEmail" :disabled="pendingGoogle"
            type="submit" class="text-none mb-4">
            Se connecter
          </v-btn>
        </v-form>

        <div class="d-flex align-center my-2">
          <v-divider />
          <span class="text-body-small text-medium-emphasis mx-3">ou</span>
          <v-divider />
        </div>

        <v-btn :prepend-icon="mdiGoogle" variant="outlined" rounded="lg" size="large" block :loading="pendingGoogle"
          :disabled="pendingEmail" class="text-none mt-4" @click="handleGoogleSignIn">
          Se connecter avec Google
        </v-btn>

        <div class="mt-6 text-body-small text-medium-emphasis">
          Pas encore de compte ?
          <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none pa-0 ml-1"
            @click="goToSignUp">
            S'inscrire
          </v-btn>
        </div>
      </template>

      <!-- Sign up -->
      <template v-if="status === 'sign-up'">
        <img v-if="roleIllustration" :src="roleIllustration" alt="" class="header-illustration mb-4" />
        <v-icon v-else :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">Créer un compte</div>
        <div class="text-body-medium text-medium-emphasis mb-6">Rejoignez myEZlab en créant votre compte</div>

        <v-form ref="signUpForm" @submit.prevent="handleSignUp">
          <v-text-field v-model="signUpEmail" label="Email" type="email" variant="outlined" rounded="lg"
            density="comfortable" class="mb-2" :rules="[required, emailValidation]" />

          <v-text-field v-model="signUpPassword" label="Mot de passe" :type="showSignUpPassword ? 'text' : 'password'"
            variant="outlined" rounded="lg" density="comfortable" class="mb-2" :rules="[required, passwordValidation]"
            :append-inner-icon="showSignUpPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignUpPassword = !showSignUpPassword" />

          <v-text-field v-model="signUpConfirmPassword" label="Confirmer le mot de passe"
            :type="showSignUpConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg"
            density="comfortable" :class="isPatient ? 'mb-2' : 'mb-4'" :rules="[required, signUpPasswordsMatch]"
            :append-inner-icon="showSignUpConfirmPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignUpConfirmPassword = !showSignUpConfirmPassword" />

          <v-checkbox v-if="isPatient" v-model="agreementChecked" color="primary" density="comfortable"
            class="text-left mb-2"
            :rules="[v => !!v || 'Vous devez accepter les conditions de traitement de vos données personnelles']">
            <template #label>
              <span class="text-body-small">
                J'ai lu et j'accepte
                <a class="agreement-link" @click.stop.prevent="showAgreementDialog = true">les conditions</a>
                de traitement de mes données personnelles
              </span>
            </template>
          </v-checkbox>

          <v-btn color="primary" rounded="lg" flat size="large" block :loading="pendingEmail" :disabled="pendingGoogle"
            type="submit" class="text-none mb-4">
            S'inscrire
          </v-btn>
        </v-form>

        <div class="d-flex align-center my-2">
          <v-divider />
          <span class="text-body-small text-medium-emphasis mx-3">ou</span>
          <v-divider />
        </div>

        <v-btn :prepend-icon="mdiGoogle" variant="outlined" rounded="lg" size="large" block :loading="pendingGoogle"
          :disabled="pendingEmail" class="text-none mt-4" @click="handleGoogleSignIn">
          Se connecter avec Google
        </v-btn>

        <div class="mt-6 text-body-small text-medium-emphasis">
          Déjà un compte ?
          <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none pa-0 ml-1"
            @click="status = 'sign-in'">
            Se connecter
          </v-btn>
        </div>
      </template>

      <!-- Reset password -->
      <template v-if="status === 'reset-password'">
        <img v-if="roleIllustration" :src="roleIllustration" alt="" class="header-illustration mb-4" />
        <v-icon v-else :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">Réinitialiser le mot de passe</div>
        <div class="text-body-medium text-medium-emphasis mb-6">Entrez votre adresse email pour recevoir un lien de
          réinitialisation</div>

        <template v-if="!resetSent">
          <v-form ref="resetForm" @submit.prevent="handlePasswordReset">
            <v-text-field v-model="resetEmail" label="Email" type="email" variant="outlined" rounded="lg"
              density="comfortable" class="mb-4" :rules="[required, emailValidation]" />

            <v-btn color="primary" rounded="lg" size="large" block :loading="pendingEmail" type="submit"
              class="text-none">
              Envoyer le lien
            </v-btn>
          </v-form>
        </template>

        <template v-else>
          <v-icon :icon="mdiCheckCircleOutline" size="48" color="success" class="mb-4" />
          <div class="text-body-medium text-medium-emphasis">Un email de réinitialisation vous a été envoyé. Vérifiez
            votre boîte mail.</div>
        </template>

        <div class="mt-4">
          <v-btn variant="text" color="medium-emphasis" size="small" rounded="lg" class="text-none"
            @click="status = 'sign-in'">
            Retour à la connexion
          </v-btn>
        </div>
      </template>

      <!-- Success -->
      <template v-if="status === 'success'">
        <v-icon :icon="mdiCheckCircleOutline" size="64" color="success" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">Connexion réussie</div>
        <div class="text-body-medium text-medium-emphasis">Redirection en cours...</div>
      </template>

    </v-card>

    <v-dialog v-model="showAgreementDialog" max-width="700" scrollable>
      <v-card class="rounded-15">
        <v-card-text class="pa-6">
          <div class="markdown-content text-left" v-html="parsedAgreement" />
        </v-card-text>
        <v-card-actions class="px-6 pb-4 justify-end">
          <v-btn color="primary" variant="text" rounded="lg" class="text-none" @click="showAgreementDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.header-illustration {
  height: 100px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.agreement-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
}
</style>
