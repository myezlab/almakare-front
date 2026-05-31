<script setup>
import { mdiApple, mdiGoogleMaps, mdiMapMarkerOutline, mdiWaze } from "@mdi/js"


const props = defineProps({
  locationName: { type: String, default: "" },
  subtitle: { type: String, default: "" }
})

// Strip a leading "… —" prefix (e.g. "Cabinet Dr X — Paris") so map searches
// use the actual address part rather than the cabinet label.
function locationQuery() {
  const name = props.locationName || ""
  const parts = name.split("—")
  return (parts.length > 1 ? parts.slice(1).join("—") : name).trim()
}

function openGoogleMaps() {
  const query = encodeURIComponent(locationQuery())
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
}

function openAppleMaps() {
  const query = encodeURIComponent(locationQuery())
  window.open(`https://maps.apple.com/?address=${query}`, "_blank")
}

function openWaze() {
  const query = encodeURIComponent(locationQuery())
  window.open(`https://waze.com/ul?q=${query}&navigate=yes`, "_blank")
}
</script>

<template>
  <v-card variant="tonal" color="info" rounded="lg" class="pa-3 d-flex flex-column justify-center">
    <div class="d-flex align-center ga-3">
      <v-icon :icon="mdiMapMarkerOutline" v-if="!$vuetify.display.mobile" color="info" size="24"
        class="flex-shrink-0" />
      <div class="flex-grow-1" style="min-width: 0">
        <div class="text-body-medium font-weight-bold">Lieu du rendez-vous</div>
        <div class="text-body-small text-medium-emphasis">{{ locationName }}</div>
        <div v-if="subtitle" class="text-body-small text-medium-emphasis">{{ subtitle }}</div>
      </div>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" color="info" :icon="$vuetify.display.mobile" flat rounded="lg" size="small"
            class="text-none flex-shrink-0">
            <v-icon v-if="$vuetify.display.mobile" :icon="mdiMapMarkerOutline" />
            <template v-if="!$vuetify.display.mobile">Direction</template>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg" class="card-shadow">
          <v-list-item :prepend-icon="mdiGoogleMaps" title="Google Maps" @click="openGoogleMaps" />
          <v-list-item :prepend-icon="mdiApple" title="Plans (Apple)" @click="openAppleMaps" />
          <v-list-item :prepend-icon="mdiWaze" title="Waze" @click="openWaze" />
        </v-list>
      </v-menu>
    </div>
  </v-card>
</template>
