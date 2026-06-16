<script setup>
// Dashboard card showing the patient's CPAP (PPC) therapy data, automatically
// synced from their device. One sparkline per metric — IAH (apnées-hypopnées),
// observance (usage hours) and mask leaks — over a selectable range (1 semaine,
// 1 mois, 6 mois), plus a "Qualité de la nuit" curve whose emoji markers come
// from the agenda du sommeil — tying the subjective sleep rating to the metrics.
import TreatmentSelfAssessmentDialog from "@/components/TreatmentSelfAssessmentDialog.vue"
import { ppcTracking } from "@/data/ppcTracking"
import {
  QUALITY_BY_VALUE,
  QUALITY_EMOJI,
  QUALITY_LABEL,
  QUALITY_VALUE,
  nightQualityByDate,
} from "@/data/sleepDiary"
import { useSelfStore } from "@/stores/self"
import { mdiClipboardTextOutline, mdiInformationOutline } from "@mdi/js"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import { computed, ref } from "vue"
import { useDisplay } from "vuetify"

const { mobile } = useDisplay()
const selfStore = useSelfStore()

// Night quality is the answer to the agenda du sommeil's "Qualité de la nuit"
// question — the link between the two views. Start from the fake history and
// let any real diary entry the patient logs override its date, so the curve
// always reflects the agenda.
const qualityByDate = computed(() => {
  const map = { ...nightQualityByDate }
  for (const e of selfStore.item.sleepDiaryEntries || []) {
    if (e.nightQuality) map[e.date] = e.nightQuality
  }
  return map
})

// Selectable history ranges. Each maps to a number of trailing nights.
const RANGES = [
  { value: "week", label: "1 sem", days: 7 },
  { value: "month", label: "1 mois", days: 30 },
  { value: "halfyear", label: "6 mois", days: 183 },
]
const range = ref("week")

// Self-assessment dialog ("Mon ressenti sur le traitement").
const showAssessment = ref(false)

const nights = computed(() => {
  const { days } = RANGES.find((r) => r.value === range.value)
  return ppcTracking.slice(-days)
})

const dates = computed(() => nights.value.map((d) => d.date))

// Off-nights (machine unused, e.g. week-end / holidays) carry no IAH or leak
// reading — plot them as gaps so the curve isn't dragged down to 0.
const reading = (value, usage) => (usage > 0 ? value : null)

// Latest night with an actual reading, for the headline value of each metric.
const lastUsed = computed(
  () => [...nights.value].reverse().find((d) => d.usage > 0) ?? nights.value.at(-1),
)

// Short DD/MM date of the latest night with a reading — shown next to each
// metric label so the patient knows which night the headline value is from.
const lastDateShort = computed(() => {
  const iso = lastUsed.value?.date
  if (!iso) return ""
  return dayjs(iso).locale("fr").format("DD/MM")
})

// One config object per metric: how to read it, format it and judge it.
const metrics = computed(() => [
  {
    key: "usage",
    label: "Observance",
    unit: "h",
    color: "#4caf50",
    threshold: 4,
    higherIsBetter: true,
    value: lastUsed.value.usage,
    data: nights.value.map((d) => d.usage),
    format: (v) => v.toFixed(1),
    // Reimbursement compliance threshold is 4h/night.
    status: statusFor(lastUsed.value.usage, [4, 6], true),
    help: "Durée d'utilisation de la machine pendant la nuit. Visez au moins 4h par nuit.",
  },
  {
    key: "iah",
    label: "Apnées-hypopnées (IAH)",
    unit: "/h",
    color: "#1976d2",
    threshold: 5,
    higherIsBetter: false,
    value: lastUsed.value.iah,
    data: nights.value.map((d) => reading(d.iah, d.usage)),
    format: (v) => v.toFixed(1),
    // Treatment is effective below 5 events/hour.
    status: statusFor(lastUsed.value.iah, [5, 10], false),
    help: "Nombre d'apnées et d'hypopnées par heure. Le traitement est efficace en dessous de 5/h.",
  },
  {
    key: "leaks",
    label: "Fuites au masque",
    unit: "L/min",
    color: "#ff9800",
    threshold: 24,
    higherIsBetter: false,
    value: lastUsed.value.leaks,
    data: nights.value.map((d) => reading(d.leaks, d.usage)),
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

// --- Night quality (from the agenda du sommeil) ---------------------------
// Quality level per night over the selected range, mapped to a 1–5 value so it
// plots as a curve. Most nights are filled; missing ones plot as gaps.
const qualityLevels = computed(() =>
  nights.value.map((d) => qualityByDate.value[d.date] || null),
)
const qualityData = computed(() =>
  qualityLevels.value.map((q) => (q ? QUALITY_VALUE[q] : null)),
)
const lastQuality = computed(
  () => [...qualityLevels.value].reverse().find(Boolean) ?? null,
)

// Short DD/MM date of the latest night that has a quality rating.
const lastQualityDateShort = computed(() => {
  const idx = [...qualityLevels.value].reverse().findIndex(Boolean)
  if (idx === -1) return ""
  const iso = nights.value[nights.value.length - 1 - idx]?.date
  return iso ? dayjs(iso).locale("fr").format("DD/MM") : ""
})

const QUALITY_COLOR = "#7e57c2"

// Emoji markers on the curve. Showing one per night would overlap on the 1 mois
// / 6 mois ranges, so we space them out (~8 across the window) and always keep
// the most recent night labelled.
function qualitySparkOptions() {
  const total = qualityData.value.length
  const step = Math.max(1, Math.ceil(total / 8))
  return {
    chart: { sparkline: { enabled: true }, fontFamily: "inherit" },
    colors: [QUALITY_COLOR],
    stroke: { width: 2.5, curve: "smooth" },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.03 } },
    markers: { size: 0, hover: { size: 4 } },
    // Inset the plot area so the emojis on the first/last points aren't clipped
    // by the chart's left/right edges.
    grid: { padding: { left: 14, right: 14 } },
    dataLabels: {
      enabled: true,
      formatter: (val, { dataPointIndex }) => {
        if (val == null) return ""
        const isLast = dataPointIndex === total - 1
        if (!isLast && dataPointIndex % step !== 0) return ""
        return QUALITY_EMOJI[QUALITY_BY_VALUE[Math.round(val)]] || ""
      },
      // Sit the emoji right on the curve point (no upward offset) so it isn't
      // clipped at the top of the sparkline on great nights.
      offsetY: 0,
      style: { fontSize: "15px" },
      background: { enabled: false },
    },
    // Pad the scale beyond the 1–5 data range so a centred emoji has headroom at
    // both ends (value 5 near the top, value 1 near the bottom) and never crops.
    // Keep the axis itself hidden — supplying min/max otherwise re-shows its
    // tick numbers, which then get clipped on the left.
    yaxis: { min: 0, max: 6, show: false, labels: { show: false } },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (v) =>
          v == null ? "—" : QUALITY_LABEL[QUALITY_BY_VALUE[Math.round(v)]],
      },
      marker: { show: false },
    },
    xaxis: { categories: dates.value },
  }
}
</script>

<template>
  <v-card class="card-shadow rounded-15 d-flex flex-column" :class="mobile ? 'pa-6' : 'pa-6'">
    <div class="d-flex align-center mb-1">
      <div class="text-title-medium text-medium-emphasis text-uppercase font-weight-bold">
        Suivi de mon traitement
      </div>
      <v-spacer />
      <!-- Info button sits at the top right of the card. -->
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

    <div class="d-flex align-center mb-4 mt-2 ga-3 flex-wrap">
      <!-- Self-assessment: desktop sits at the start of the line (toggle pushed
           right by the spacer); mobile wraps full-width above the toggle. -->
      <v-btn :prepend-icon="mdiClipboardTextOutline" color="primary" variant="tonal" rounded="lg" height="40"
        class="text-none" :block="mobile" @click="showAssessment = true">
        Mon ressenti
      </v-btn>
      <v-spacer v-if="!mobile" />
      <v-btn-toggle v-model="range" mandatory density="comfortable" variant="outlined" color="primary" divided
        rounded="lg" class="ppc-range-toggle" :class="{ 'w-100': mobile }">
        <v-btn v-for="r in RANGES" :key="r.value" :value="r.value" size="small" class="text-none"
          :class="{ 'flex-grow-1': mobile }">
          {{ r.label }}
        </v-btn>
      </v-btn-toggle>
    </div>

    <TreatmentSelfAssessmentDialog v-model="showAssessment" />

    <div v-for="metric in metrics" :key="metric.key" class="metric-row py-3"
      :class="mobile ? '' : 'd-flex align-center'">
      <div class="metric-info" :class="{ 'd-flex align-start justify-space-between': mobile }">
        <div>
          <div class="text-body-small text-medium-emphasis">{{ metric.label }}</div>
          <div class="d-flex align-baseline">
            <span class="text-body-small text-disabled mr-1">{{ lastDateShort }} ▸</span>
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

    <!-- Night quality from the agenda du sommeil, overlaid as emojis on a curve.
         Hidden over the 6-month range, where the emoji markers get too sparse to read. -->
    <div v-if="range !== 'halfyear'" class="metric-row py-3" :class="mobile ? '' : 'd-flex align-center'">
      <div class="metric-info" :class="{ 'd-flex align-start justify-space-between': mobile }">
        <div>
          <div class="text-body-small text-medium-emphasis">Qualité de la nuit</div>
          <div class="d-flex align-baseline">
            <span class="text-body-small text-disabled mr-1">{{ lastQualityDateShort }} ▸</span>
            <span class="text-h5">{{ lastQuality ? QUALITY_EMOJI[lastQuality] : "—" }}</span>
            <span v-if="lastQuality" class="text-body-small text-medium-emphasis ml-2">
              {{ QUALITY_LABEL[lastQuality] }}
            </span>
          </div>
        </div>
      </div>
      <div class="metric-chart" :class="{ 'mt-1': mobile }">
        <apexchart type="area" :height="mobile ? 70 : 56" :options="qualitySparkOptions()"
          :series="[{ name: 'Qualité de la nuit', data: qualityData }]" />
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
