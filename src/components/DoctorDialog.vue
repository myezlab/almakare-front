<script setup>
import {
  mdiCardAccountDetailsOutline,
  mdiClose,
  mdiDoctor,
  mdiEmailOutline,
  mdiPhoneOutline
} from "@mdi/js"
import { computed } from "vue"

const props = defineProps({
  // Two-way bound open state.
  modelValue: { type: Boolean, default: false },
  // Seeded doctor record (avatarUrl, specialty, firstName, lastName, phone, email, adeli).
  doctor: { type: Object, default: null },
  // Display name, e.g. "Dr Lucas Robert". Falls back to firstName + lastName.
  name: { type: String, default: "" }
})

const emit = defineEmits(["update:modelValue"])

const open = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
})

const fullName = computed(() =>
  props.name || [props.doctor?.firstName, props.doctor?.lastName].filter(Boolean).join(" ")
)

// Contact rows rendered in the dialog. `href` makes a row tappable (call / email).
const contactRows = computed(() => [
  {
    key: "phone",
    icon: mdiPhoneOutline,
    label: "Téléphone",
    value: props.doctor?.phone,
    href: props.doctor?.phone ? `tel:${props.doctor.phone}` : null
  },
  {
    key: "email",
    icon: mdiEmailOutline,
    label: "Email",
    value: props.doctor?.email,
    href: props.doctor?.email ? `mailto:${props.doctor.email}` : null
  },
  {
    key: "adeli",
    icon: mdiCardAccountDetailsOutline,
    label: "Numéro Adeli",
    value: props.doctor?.adeli,
    href: null
  }
])
</script>

<template>
  <!-- =================== DOCTOR DETAILS DIALOG =================== -->
  <v-dialog v-model="open" max-width="440" :fullscreen="$vuetify.display.mobile" scrollable>
    <v-card v-if="doctor" class="card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }">

      <!-- Close button overlaid on the hero -->
      <v-btn :icon="mdiClose" variant="text" size="small" class="close-btn" aria-label="Fermer"
        @click="open = false" />

      <!-- =================== HERO =================== -->
      <div class="doctor-hero d-flex flex-column align-center text-center px-6 pt-8 pb-6">
        <v-avatar size="104" class="hero-avatar">
          <v-img v-if="doctor.avatarUrl" :src="doctor.avatarUrl" :alt="fullName" />
          <v-icon v-else :icon="mdiDoctor" size="56" color="primary" />
        </v-avatar>
        <div class="text-headline-small font-weight-bold mt-4">{{ fullName }}</div>
        <v-chip v-if="doctor.specialty" color="primary" variant="flat" size="small" class="mt-2 font-weight-medium">
          {{ doctor.specialty }}
        </v-chip>
      </div>

      <!-- =================== CONTACT =================== -->
      <v-card-text class="pa-4">
        <v-list class="contact-list" bg-color="transparent" density="comfortable">
          <v-list-item v-for="row in contactRows" :key="row.key" :href="row.href"
            :target="row.href ? '_blank' : undefined" rounded="lg" class="contact-item mb-1"
            :class="{ 'contact-item--link': row.href }">
            <template #prepend>
              <v-avatar size="40" color="primary" variant="tonal" class="mr-3">
                <v-icon :icon="row.icon" size="20" />
              </v-avatar>
            </template>
            <div class="text-body-small text-medium-emphasis">{{ row.label }}</div>
            <div class="text-body-medium font-weight-medium">{{ row.value || '—' }}</div>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.doctor-hero {
  background: linear-gradient(160deg,
      rgba(var(--v-theme-primary), 0.14) 0%,
      rgba(var(--v-theme-primary), 0.04) 100%);
}

.hero-avatar {
  border: 4px solid rgb(var(--v-theme-surface));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.contact-item--link {
  transition: background-color 0.15s ease;
}

.contact-item--link:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
