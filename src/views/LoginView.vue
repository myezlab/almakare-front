<script setup>
import { useRules } from "@/composables/useRules"
import { useMessagesStore } from "@/stores/messages"
import {
  mdiCheckCircleOutline,
  mdiEye,
  mdiEyeOff,
  mdiGoogle,
  mdiLockOutline,
} from "@mdi/js"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const messagesStore = useMessagesStore()
const { required, emailValidation, passwordValidation } = useRules()

const auth = getAuth()
const db = getFirestore()
// sign-in | sign-up | reset-password | loading | success
const status = ref(route.query.mode === "signup" ? "sign-up" : "sign-in")
const pendingEmail = ref(false)
const pendingGoogle = ref(false)

// Sign-in
const signInEmail = ref("")
const signInPassword = ref("")
const showSignInPassword = ref(false)
const signInForm = ref(null)

// Sign-up
const signUpEmail = ref("")
const signUpPassword = ref("")
const signUpConfirmPassword = ref("")
const showSignUpPassword = ref(false)
const showSignUpConfirmPassword = ref(false)
const signUpForm = ref(null)

// Password reset
const resetEmail = ref("")
const resetForm = ref(null)
const resetSent = ref(false)

const signUpPasswordsMatch = computed(() => {
  return (v) => v === signUpPassword.value || t("LOGIN_PASSWORDS_NO_MATCH")
})

function redirectToApp() {
  status.value = "success"
  setTimeout(() => router.push({ name: "Dashboard" }), 1000)
}

async function handleSignIn() {
  if (!(await signInForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    await signInWithEmailAndPassword(auth, signInEmail.value, signInPassword.value)
    messagesStore.add({ type: "success", text: t("LOGIN_SUCCESS") })
    redirectToApp()
  } catch (error) {
    console.error("Sign-in error:", error)
    messagesStore.add({ type: "error", text: t("AUTH_ERROR_WRONG_EMAIL_OR_PASSWORD") })
  } finally {
    pendingEmail.value = false
  }
}

async function createUserDoc(uid, email) {
  const now = serverTimestamp()
  await setDoc(doc(db, "users", uid), { email, createdAt: now, updatedAt: now })
}

async function handleSignUp() {
  if (!(await signUpForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    const { user } = await createUserWithEmailAndPassword(auth, signUpEmail.value, signUpPassword.value)
    await createUserDoc(user.uid, user.email)
    messagesStore.add({ type: "success", text: t("LOGIN_SUCCESS") })
    redirectToApp()
  } catch (error) {
    console.error("Sign-up error:", error)
    if (error.code === "auth/email-already-in-use") {
      messagesStore.add({ type: "error", text: t("AUTH_ERROR_EMAIL_ALREADY_IN_USE") })
    } else {
      messagesStore.add({ type: "error", text: t("AUTH_ERROR_SIGN_UP") })
    }
  } finally {
    pendingEmail.value = false
  }
}

async function handleGoogleSignIn() {
  pendingGoogle.value = true
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await createUserDoc(result.user.uid, result.user.email)
    }
    messagesStore.add({ type: "success", text: t("LOGIN_SUCCESS") })
    redirectToApp()
  } catch (error) {
    console.error("Google sign-in error:", error)
    if (error.code !== "auth/popup-closed-by-user") {
      messagesStore.add({ type: "error", text: t("AUTH_ERROR_SIGN_IN") })
    }
  } finally {
    pendingGoogle.value = false
  }
}

async function handlePasswordReset() {
  if (!(await resetForm.value.validate()).valid) return
  pendingEmail.value = true
  try {
    await sendPasswordResetEmail(auth, resetEmail.value)
    resetSent.value = true
  } catch (error) {
    console.error("Password reset error:", error)
    if (error.code === "auth/user-not-found") {
      messagesStore.add({ type: "error", text: t("AUTH_ERROR_NO_ACCOUNT_WITH_EMAIL") })
    } else {
      messagesStore.add({ type: "error", text: t("PASSWORD_RESET_ERROR") })
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
          {{ $t('GO_BACK') }}
        </v-btn>
      </div>

      <!-- Loading -->
      <template v-if="status === 'loading'">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-6" />
        <div class="text-headline-small font-weight-bold">{{ $t('LOGIN_SIGNING_IN') }}</div>
        <div class="text-body-medium text-medium-emphasis mt-2">{{ $t('LOGIN_PLEASE_WAIT') }}</div>
      </template>

      <!-- Sign in -->
      <template v-if="status === 'sign-in'">
        <v-icon :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">{{ $t('AUTH_WELCOME_BACK') }}</div>
        <div class="text-body-medium text-medium-emphasis mb-6">{{ $t('LOGIN_SIGN_IN_DESC') }}</div>

        <v-form ref="signInForm" @submit.prevent="handleSignIn">
          <v-text-field v-model="signInEmail" :label="$t('EMAIL')" type="email" variant="outlined" rounded="lg"
            density="comfortable" class="mb-2" :rules="[required, emailValidation]" />

          <v-text-field v-model="signInPassword" :label="$t('AUTH_PASSWORD')"
            :type="showSignInPassword ? 'text' : 'password'" variant="outlined" rounded="lg" density="comfortable"
            class="mb-1" :rules="[required]" :append-inner-icon="showSignInPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignInPassword = !showSignInPassword" />

          <div class="d-flex justify-end mb-4">
            <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none"
              @click="resetEmail = signInEmail; resetSent = false; status = 'reset-password'">
              {{ $t('AUTH_FORGOT_PASSWORD') }} ?
            </v-btn>
          </div>

          <v-btn color="primary" rounded="lg" flat size="large" block :loading="pendingEmail" :disabled="pendingGoogle"
            type="submit" class="text-none mb-4">
            {{ $t('AUTH_SIGN_IN') }}
          </v-btn>
        </v-form>

        <div class="d-flex align-center my-2">
          <v-divider />
          <span class="text-body-small text-medium-emphasis mx-3">{{ $t('AUTH_OR') }}</span>
          <v-divider />
        </div>

        <v-btn :prepend-icon="mdiGoogle" variant="outlined" rounded="lg" size="large" block :loading="pendingGoogle"
          :disabled="pendingEmail" class="text-none mt-4" @click="handleGoogleSignIn">
          {{ $t('AUTH_SIGN_IN_WITH_GOOGLE') }}
        </v-btn>

        <div class="mt-6 text-body-small text-medium-emphasis">
          {{ $t('AUTH_NO_ACCOUNT') }}
          <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none pa-0 ml-1"
            @click="status = 'sign-up'">
            {{ $t('AUTH_SIGN_UP') }}
          </v-btn>
        </div>
      </template>

      <!-- Sign up -->
      <template v-if="status === 'sign-up'">
        <v-icon :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">{{ $t('AUTH_CREATE_ACCOUNT') }}</div>
        <div class="text-body-medium text-medium-emphasis mb-6">{{ $t('AUTH_CREATE_ACCOUNT_DESC') }}</div>

        <v-form ref="signUpForm" @submit.prevent="handleSignUp">
          <v-text-field v-model="signUpEmail" :label="$t('EMAIL')" type="email" variant="outlined" rounded="lg"
            density="comfortable" class="mb-2" :rules="[required, emailValidation]" />

          <v-text-field v-model="signUpPassword" :label="$t('AUTH_PASSWORD')"
            :type="showSignUpPassword ? 'text' : 'password'" variant="outlined" rounded="lg" density="comfortable"
            class="mb-2" :rules="[required, passwordValidation]"
            :append-inner-icon="showSignUpPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignUpPassword = !showSignUpPassword" />

          <v-text-field v-model="signUpConfirmPassword" :label="$t('LOGIN_CONFIRM_PASSWORD')"
            :type="showSignUpConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg"
            density="comfortable" class="mb-4" :rules="[required, signUpPasswordsMatch]"
            :append-inner-icon="showSignUpConfirmPassword ? mdiEyeOff : mdiEye"
            @click:append-inner="showSignUpConfirmPassword = !showSignUpConfirmPassword" />

          <v-btn color="primary" rounded="lg" flat size="large" block :loading="pendingEmail" :disabled="pendingGoogle"
            type="submit" class="text-none mb-4">
            {{ $t('AUTH_SIGN_UP') }}
          </v-btn>
        </v-form>

        <div class="d-flex align-center my-2">
          <v-divider />
          <span class="text-body-small text-medium-emphasis mx-3">{{ $t('AUTH_OR') }}</span>
          <v-divider />
        </div>

        <v-btn :prepend-icon="mdiGoogle" variant="outlined" rounded="lg" size="large" block :loading="pendingGoogle"
          :disabled="pendingEmail" class="text-none mt-4" @click="handleGoogleSignIn">
          {{ $t('AUTH_SIGN_IN_WITH_GOOGLE') }}
        </v-btn>

        <div class="mt-6 text-body-small text-medium-emphasis">
          {{ $t('AUTH_ALREADY_HAVE_ACCOUNT') }}
          <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none pa-0 ml-1"
            @click="status = 'sign-in'">
            {{ $t('AUTH_SIGN_IN') }}
          </v-btn>
        </div>
      </template>

      <!-- Reset password -->
      <template v-if="status === 'reset-password'">
        <v-icon :icon="mdiLockOutline" size="64" color="primary" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">{{ $t('AUTH_RESET_PASSWORD') }}</div>
        <div class="text-body-medium text-medium-emphasis mb-6">{{ $t('PASSWORD_RESET_DESC') }}</div>

        <template v-if="!resetSent">
          <v-form ref="resetForm" @submit.prevent="handlePasswordReset">
            <v-text-field v-model="resetEmail" :label="$t('EMAIL')" type="email" variant="outlined" rounded="lg"
              density="comfortable" class="mb-4" :rules="[required, emailValidation]" />

            <v-btn color="primary" rounded="lg" size="large" block :loading="pendingEmail" type="submit"
              class="text-none">
              {{ $t('PASSWORD_RESET_SEND') }}
            </v-btn>
          </v-form>
        </template>

        <template v-else>
          <v-icon :icon="mdiCheckCircleOutline" size="48" color="success" class="mb-4" />
          <div class="text-body-medium text-medium-emphasis">{{ $t('PASSWORD_RESET_SENT') }}</div>
        </template>

        <div class="mt-4">
          <v-btn variant="text" color="medium-emphasis" size="small" rounded="lg" class="text-none"
            @click="status = 'sign-in'">
            {{ $t('PASSWORD_RESET_BACK_TO_SIGN_IN') }}
          </v-btn>
        </div>
      </template>

      <!-- Success -->
      <template v-if="status === 'success'">
        <v-icon :icon="mdiCheckCircleOutline" size="64" color="success" class="mb-4" />
        <div class="text-headline-small font-weight-bold mb-2">{{ $t('LOGIN_SUCCESS') }}</div>
        <div class="text-body-medium text-medium-emphasis">{{ $t('LOGIN_REDIRECTING') }}</div>
      </template>

    </v-card>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
