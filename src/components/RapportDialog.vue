<script setup>
// Preview + download a single medical rapport (the doctor's report document for
// a past activity). Shared by ActivitesTab (the per-activity "Rapport" card) and
// DocumentsTab (the "Rapports" panel) so both open the exact same view.
//
// In this seeded app there is no real PDF behind the rapport, so the preview
// renders the report text on a document-styled sheet and "Télécharger" hands the
// patient a plain-text copy generated on the fly (same approach as the .ics
// export in ActivitesTab).
import { ISOToLongDateTime } from "@/composables/useDates"
import { mdiClose, mdiDownloadOutline, mdiFileChartOutline } from "@mdi/js"
import { useDisplay } from "vuetify"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  rapport: { type: Object, default: null },
})

const emit = defineEmits(["update:modelValue"])

const { mobile } = useDisplay()

function close() {
  emit("update:modelValue", false)
}

function download() {
  const r = props.rapport
  if (!r) return
  const content = [
    r.title,
    `${r.doctor} — ${ISOToLongDateTime(r.date)}`,
    "",
    "Compte rendu",
    r.report,
  ].join("\n")
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = r.name.replace(/\.pdf$/i, ".txt")
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <v-dialog :model-value="modelValue" :fullscreen="mobile" :max-width="mobile ? undefined : 640" scrollable
    @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="rapport" class="card-shadow" :class="{ 'rounded-15': !mobile }">
      <v-card-item class="pa-4">
        <template #prepend>
          <div class="rapport-icon" aria-hidden="true">
            <v-icon :icon="mdiFileChartOutline" size="24" />
          </div>
        </template>
        <v-card-title class="text-headline-small font-weight-bold text-wrap">{{ rapport.title }}</v-card-title>
        <v-card-subtitle class="text-body-medium text-medium-emphasis text-wrap mt-1">
          {{ rapport.doctor }} — {{ ISOToLongDateTime(rapport.date) }}
        </v-card-subtitle>
        <template #append>
          <v-btn :icon="mdiClose" variant="text" density="comfortable" aria-label="Fermer" @click="close" />
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- Document-styled sheet showing the report content -->
        <div class="rapport-sheet">
          <div class="text-body-small text-medium-emphasis mb-1">{{ rapport.name }}</div>
          <div class="text-title-small font-weight-bold mb-3">Compte rendu</div>
          <div class="text-body-medium rapport-body">{{ rapport.report }}</div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="text-none" @click="close">Fermer</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" class="text-none" :prepend-icon="mdiDownloadOutline"
          @click="download">
          Télécharger
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.rapport-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

.rapport-sheet {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.rapport-body {
  white-space: pre-line;
  line-height: 1.6;
}
</style>
