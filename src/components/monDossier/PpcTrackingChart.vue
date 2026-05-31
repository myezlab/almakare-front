<script setup>
import { ppcSummary, ppcTracking } from "@/data/ppcTracking"
import { mdiCheckCircleOutline, mdiClockOutline, mdiHeartPulse } from "@mdi/js"
import { computed } from "vue"

const categories = computed(() => ppcTracking.map((d) => d.date))

const series = computed(() => [
  {
    name: "Utilisation (h)",
    type: "column",
    data: ppcTracking.map((d) => d.usage),
  },
  {
    name: "IAH (évén./h)",
    type: "line",
    data: ppcTracking.map((d) => d.iah),
  },
])

const chartOptions = computed(() => ({
  chart: {
    fontFamily: "inherit",
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  colors: ["#4caf50", "#1976d2"],
  stroke: { width: [0, 3], curve: "smooth" },
  plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
  dataLabels: { enabled: false },
  fill: { opacity: [0.85, 1] },
  markers: { size: [0, 3] },
  xaxis: {
    categories: categories.value,
    type: "datetime",
    labels: {
      datetimeFormatter: { day: "dd/MM" },
      style: { fontSize: "11px" },
    },
    tickAmount: 8,
  },
  yaxis: [
    {
      title: { text: "Utilisation (h)" },
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: { formatter: (v) => v.toFixed(0) },
    },
    {
      opposite: true,
      title: { text: "IAH (évén./h)" },
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: { formatter: (v) => v.toFixed(0) },
    },
  ],
  annotations: {
    yaxis: [
      {
        y: 4,
        borderColor: "#ff9800",
        strokeDashArray: 4,
        label: {
          text: "Seuil observance 4h",
          style: { color: "#fff", background: "#ff9800", fontSize: "10px" },
        },
      },
    ],
  },
  legend: { position: "top", horizontalAlign: "left" },
  grid: { borderColor: "#eee", strokeDashArray: 4 },
  tooltip: { shared: true, intersect: false, x: { format: "dd/MM/yyyy" } },
}))

const kpis = computed(() => [
  {
    icon: mdiCheckCircleOutline,
    label: "Observance",
    value: `${ppcSummary.complianceRate}%`,
    color: "success",
  },
  {
    icon: mdiClockOutline,
    label: "Utilisation moy.",
    value: `${ppcSummary.avgUsage} h`,
    color: "primary",
  },
  {
    icon: mdiHeartPulse,
    label: "IAH moyen",
    value: `${ppcSummary.avgIah}`,
    color: "info",
  },
])
</script>

<template>
  <div>
    <v-row density="compact" class="mb-2">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="4">
        <div class="kpi-tile d-flex align-center pa-3">
          <v-icon :icon="kpi.icon" :color="kpi.color" size="28" class="mr-3" />
          <div>
            <div class="text-h6 font-weight-bold">{{ kpi.value }}</div>
            <div class="text-body-small text-medium-emphasis">{{ kpi.label }}</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <apexchart type="line" height="320" :options="chartOptions" :series="series" />
  </div>
</template>

<style scoped>
.kpi-tile {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  height: 100%;
}
</style>
