<script setup>
import { ISOToLongDateTime } from "@/composables/useDates"
import {
  mdiApple,
  mdiCalendarBlankOutline,
  mdiCalendarPlusOutline,
  mdiGoogle,
  mdiMicrosoftOutlook
} from "@mdi/js"
import { computed } from "vue"


// Read-only display of when the appointment takes place, with a calendar-export
// menu. The actual Google/Outlook/iCal links are built by the parent (it owns
// the activity), so this card just emits the chosen target.
const props = defineProps({
  startAt: { type: String, default: "" },
  // Only upcoming appointments offer the "Ajouter au calendrier" action.
  upcoming: { type: Boolean, default: false }
})

defineEmits(["google", "outlook", "ical"])

const fullDateTime = computed(() =>
  props.startAt ? ISOToLongDateTime(props.startAt) : "Date à confirmer"
)
</script>

<template>
  <v-card variant="tonal" color="info" rounded="lg" class="pa-3 d-flex flex-column justify-center">
    <div class="d-flex align-center ga-3">
      <v-icon :icon="mdiCalendarBlankOutline" v-if="!$vuetify.display.mobile" color="info" size="24"
        class="flex-shrink-0" />
      <div class="flex-grow-1" style="min-width: 0">
        <div class="text-body-medium font-weight-bold">Date du rendez-vous</div>
        <div class="text-body-small text-medium-emphasis">{{ fullDateTime }}</div>
      </div>
      <v-menu v-if="upcoming" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" color="info" :icon="$vuetify.display.mobile" flat rounded="lg" size="small"
            class="text-none flex-shrink-0">
            <v-icon v-if="$vuetify.display.mobile" :icon="mdiCalendarPlusOutline" />
            <template v-if="!$vuetify.display.mobile">Ajouter au calendrier</template>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg" class="card-shadow">
          <v-list-item :prepend-icon="mdiGoogle" title="Google Agenda" @click="$emit('google')" />
          <v-list-item :prepend-icon="mdiMicrosoftOutlook" title="Outlook" @click="$emit('outlook')" />
          <v-list-item :prepend-icon="mdiApple" title="Apple / iCal" @click="$emit('ical')" />
        </v-list>
      </v-menu>
    </div>
  </v-card>
</template>
