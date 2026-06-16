<script setup>
// Dashboard card showing last night's CPAP (PPC) therapy data, automatically
// synced from the patient's device. One sparkline per metric over the last 7
// nights: IAH (apnées-hypopnées), observance (usage hours) and mask leaks.
import { recentNights } from "@/data/ppcTracking"
import { mdiCheckCircle, mdiInformationOutline, mdiWeatherNight } from "@mdi/js"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import { computed } from "vue"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()

const dates = computed(() => recentNights.map((d) => d.date))

// Off-nights (machine unused, e.g. week-end / holidays) carry no IAH or leak
// reading — plot them as gaps so the curve isn't dragged down to 0.
const reading = (value, usage) => (usage > 0 ? value : null)

// Latest night with an actual reading, for the headline value of each metric.
const lastUsed = computed(
  () => [...recentNights].reverse().find((d) => d.usage > 0) ?? recentNights.at(-1),
)

const lastDateLabel = computed(() => {
  const iso = recentNights.at(-1)?.date
  if (!iso) return ""
  return dayjs(iso).locale("fr").format("dddd DD/MM")
})

// One config object per metric: how to read it, format it and judge it.
const metrics = computed(() => [
  {
    key: "iah",
    label: "Apnées-hypopnées (IAH)",
    unit: "/h",
    color: "#1976d2",
    threshold: 5,
    higherIsBetter: false,
    value: lastUsed.value.iah,
    data: recentNights.map((d) => reading(d.iah, d.usage)),
    format: (v) => v.toFixed(1),
    // Treatment is effective below 5 events/hour.
    status: statusFor(lastUsed.value.iah, [5, 10], false),
    help: "Nombre d'apnées et d'hypopnées par heure. Le traitement est efficace en dessous de 5/h.",
  },
  {
    key: "usage",
    label: "Observance",
    unit: "h",
    color: "#4caf50",
    threshold: 4,
    higherIsBetter: true,
    value: lastUsed.value.usage,
    data: recentNights.map((d) => d.usage),
    format: (v) => v.toFixed(1),
    // Reimbursement compliance threshold is 4h/night.
    status: statusFor(lastUsed.value.usage, [4, 6], true),
    help: "Durée d'utilisation de la machine pendant la nuit. Visez au moins 4h par nuit.",
  },
  {
    key: "leaks",
    label: "Fuites au masque",
    unit: "L/min",
    color: "#ff9800",
    threshold: 24,
    higherIsBetter: false,
    value: lastUsed.value.leaks,
    data: recentNights.map((d) => reading(d.leaks, d.usage)),
    format: (v) => v.toFixed(0),
    status: statusFor(lastUsed.value.leaks, [24, 36], false),
    help: "Fuites d'air au niveau du masque. En dessous de 24 L/min, le masque est bien ajusté.",
  },
])

// Maps a value to a {color,label} chip given [good, warning] bounds.
// higherIsBetter flips the comparison (used for observance hours).
function statusFor(value, [good, warn], higherIsBetter) {
  if (higherIsBetter) {
    if (value >= good) return { color: "success", label: "Bon" }
    if (value >= warn / 2) return { color: "warning", label: "À surveiller" }
    return { color: "error", label: "Insuffisant" }
  }
  if (value < good) return { color: "success", label: "Bon" }
  if (value < warn) return { color: "warning", label: "À surveiller" }
  return { color: "error", label: "Élevé" }
}

const GOOD_GREEN = "#4caf50"

function sparkOptions(metric) {
  // Shade the "good" side of the target so the patient sees at a glance whether
  // a night lands in the healthy range. Lower-is-better metrics (IAH, leaks) are
  // good from 0 up to the threshold; observance is good above its threshold.
  const goodBand = metric.higherIsBetter
    ? { y: metric.threshold, y2: 1000 }
    : { y: 0, y2: metric.threshold }

  return {
    chart: { sparkline: { enabled: true }, fontFamily: "inherit" },
    colors: [metric.color],
    stroke: { width: 2.5, curve: "smooth" },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    markers: { size: 0, hover: { size: 4 } },
    annotations: {
      yaxis: [
        {
          ...goodBand,
          fillColor: GOOD_GREEN,
          opacity: 0.1,
          borderColor: "transparent",
        },
        {
          y: metric.threshold,
          borderColor: GOOD_GREEN,
          strokeDashArray: 4,
          label: {
            text: `objectif ${metric.higherIsBetter ? "≥" : "<"} ${metric.threshold} ${metric.unit}`,
            position: "left",
            textAnchor: "start",
            offsetX: 4,
            // Push the label into the green zone: above the line when the good
            // range is higher (observance), below it otherwise (IAH, leaks).
            offsetY: metric.higherIsBetter ? -4 : 14,
            borderColor: "transparent",
            style: { color: "#2e7d32", background: "transparent", fontSize: "9px" },
          },
        },
      ],
    },
    tooltip: {
      x: { show: false },
      y: { formatter: (v) => (v == null ? "—" : `${metric.format(v)} ${metric.unit}`) },
      marker: { show: false },
    },
    xaxis: { categories: dates.value },
  }
}
</script>

<template>
  <v-card class="card-shadow rounded-15 d-flex flex-column" :class="mobile ? 'pa-4' : 'pa-6'">
    <div class="d-flex align-center mb-1">
      <v-icon :icon="mdiWeatherNight" color="primary" class="mr-2" />
      <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold">
        Suivi de mon traitement
      </div>
      <v-spacer />
      <v-tooltip location="bottom end" max-width="300" content-class="ppc-help-tooltip">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" size="small" color="medium-emphasis" density="comfortable"
            aria-label="Aide sur les indicateurs">
            <v-icon :icon="mdiInformationOutline" size="18" />
          </v-btn>
        </template>
        <div class="text-body-small ">
          <div class="font-weight-bold mb-2">Comprendre vos résultats</div>
          <div class="mb-1">
            La zone verte de chaque courbe indique la plage recommandée. Plus vos nuits y restent,
            mieux votre traitement est suivi.
          </div>
          <div v-for="metric in metrics" :key="metric.key" class="mt-2">
            <span class="font-weight-bold">{{ metric.label }} :</span> {{ metric.help }}
          </div>
        </div>
      </v-tooltip>
    </div>
    <!-- Desktop: single line with check icon. -->
    <div v-if="!mobile" class="text-body-medium text-medium-emphasis mb-4 d-flex align-center">
      <v-icon :icon="mdiCheckCircle" size="16" color="success" class="mr-1" />
      Données de la nuit du {{ lastDateLabel }} · Courbes sur les 7 derniers jours
    </div>
    <!-- Mobile: two lines, no icon — the second line is a grey subtitle. -->
    <div v-else class="mb-4">
      <div class="text-body-medium text-medium-emphasis">Données de la nuit du {{ lastDateLabel }}</div>
      <div class="text-body-small text-disabled">Courbes sur les 7 derniers jours</div>
    </div>

    <div v-for="metric in metrics" :key="metric.key" class="metric-row py-3"
      :class="mobile ? '' : 'd-flex align-center'">
      <div class="metric-info" :class="{ 'd-flex align-start justify-space-between': mobile }">
        <div>
          <div class="text-body-small text-medium-emphasis">{{ metric.label }}</div>
          <div class="d-flex align-baseline">
            <span class="text-h5 font-weight-bold">{{ metric.format(metric.value) }}</span>
            <span class="text-body-small text-medium-emphasis ml-1">{{ metric.unit }}</span>
            <!-- Desktop: chip inline, right after the value. -->
            <v-chip v-if="!mobile" :color="metric.status.color" variant="tonal" size="x-small"
              class="font-weight-medium ml-2">
              {{ metric.status.label }}
            </v-chip>
          </div>
        </div>
        <!-- Mobile: chip aligned to the end of the row. -->
        <v-chip v-if="mobile" :color="metric.status.color" variant="tonal" size="x-small"
          class="font-weight-medium ml-2">
          {{ metric.status.label }}
        </v-chip>
      </div>
      <div class="metric-chart" :class="{ 'mt-1': mobile }">
        <apexchart type="area" :height="mobile ? 70 : 56" :options="sparkOptions(metric)"
          :series="[{ name: metric.label, data: metric.data }]" />
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.metric-row+.metric-row {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* Flex sizing only takes effect on desktop, where the row is d-flex.
   On mobile the row is a block and info/chart stack full-width. */
.metric-info {
  flex: 0 0 45%;
  min-width: 0;
}

.metric-chart {
  flex: 1 1 0;
  min-width: 0;
}
</style>

<!-- Tooltip content is teleported to <body>, so it can't be reached by scoped
     CSS — style it globally via its content-class. -->
<style>
.ppc-help-tooltip {
  border-radius: 12px !important;
  padding: 12px 16px !important;
}
</style>
