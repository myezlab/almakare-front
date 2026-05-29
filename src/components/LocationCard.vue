<script setup>
import { mdiApple, mdiGoogleMaps, mdiMapMarkerOutline, mdiWaze } from "@mdi/js"

defineOptions({ inheritAttrs: false })

const props = defineProps({
  locationName: { type: String, default: "" },
  subtitle: { type: String, default: "Type consultation : Cabinet" }
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
  <v-menu location="bottom start">
    <template #activator="{ props: menuProps }">
      <v-alert v-bind="{ ...menuProps, ...$attrs }" type="info" variant="tonal" :icon="mdiMapMarkerOutline"
        density="comfortable" class="cursor-pointer" rounded="lg">
        <div class="text-body-medium font-weight-medium">{{ locationName }}</div>
        <div class="text-body-small text-medium-emphasis">{{ subtitle }} • Cliquez pour l'itinéraire</div>
      </v-alert>
    </template>
    <v-list density="compact" rounded="lg" class="card-shadow">
      <v-list-item :prepend-icon="mdiGoogleMaps" title="Google Maps" @click="openGoogleMaps" />
      <v-list-item :prepend-icon="mdiApple" title="Plans (Apple)" @click="openAppleMaps" />
      <v-list-item :prepend-icon="mdiWaze" title="Waze" @click="openWaze" />
    </v-list>
  </v-menu>
</template>
