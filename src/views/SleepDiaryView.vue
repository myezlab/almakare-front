<script setup>
import QualityRating from '@/components/QualityRating.vue'
import SleepBandInput from '@/components/SleepBandInput.vue'
import SleepDiaryStreak from '@/components/SleepDiaryStreak.vue'
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import { hourLabels as makeHourLabels, toPct } from '@/utils/sleepTimeline'
import {
  mdiMoonWaningCrescent,
  mdiPencilOutline,
  mdiPlus, mdiTrashCanOutline,
} from '@mdi/js'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VBottomSheet } from 'vuetify/components/VBottomSheet'
import { VDialog } from 'vuetify/components/VDialog'

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const route = useRoute()
const router = useRouter()
const { xs } = useDisplay()

const QUALITY_COLORS = { TB: 'success', B: 'success', Moy: 'warning', M: 'error', TM: 'error' }

function qualityColor(q) {
  return QUALITY_COLORS[q] || 'grey'
}

// Timeline geometry is shared with the editable band via the sleepTimeline util.
const hourLabels = makeHourLabels()

function sleepSegs(entry) {
  const s = toPct(entry.bedtime)
  const e = toPct(entry.wakeTime)
  if (s === null || e === null || e <= s) return []

  const gaps = (entry.awakenings || [])
    .filter(a => a.start && a.end)
    .map(a => ({ s: toPct(a.start), e: toPct(a.end) }))
    .filter(a => a.s !== null && a.e !== null && a.s < a.e && a.s >= s && a.e <= e)
    .sort((a, b) => a.s - b.s)

  const segs = []
  let cur = s
  for (const g of gaps) {
    if (g.s > cur) segs.push({ l: cur, w: g.s - cur, type: 'sleep' })
    segs.push({ l: g.s, w: g.e - g.s, type: 'awake' })
    cur = g.e
  }
  if (cur < e) segs.push({ l: cur, w: e - cur, type: 'sleep' })
  return segs
}

function napSegs(entry) {
  return (entry.naps || [])
    .filter(n => n.start && n.end)
    .map(n => {
      const s = toPct(n.start)
      const e = toPct(n.end)
      return s !== null && e !== null && e > s ? { l: s, w: e - s } : null
    })
    .filter(Boolean)
}

function somnoMarks(entry) {
  return (entry.somnolence || [])
    .map(t => toPct(t))
    .filter(p => p !== null)
}

// Data management — persisted via selfStore (localStorage)
const entries = computed({
  get: () => selfStore.item.sleepDiaryEntries || [],
  set: (val) => { selfStore.item.sleepDiaryEntries = val },
})
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showForm = ref(false)
const showDelete = ref(false)
const deleteTarget = ref(null)

function todayStr() {
  return toIsoDate(new Date())
}

function emptyForm(date = todayStr()) {
  return {
    date,
    bedtime: '',
    wakeTime: '',
    awakenings: [],
    nightQuality: null,
    morningForm: null,
    medications: '',
    naps: [],
    somnolence: [],
    daytimeForm: null,
  }
}

const form = ref(emptyForm())
const hasToday = computed(() => entries.value.some(e => e.date === todayStr()))

// Bridge form.date (YYYY-MM-DD string) to VDateInput (Date object).
// Build the ISO string from *local* date parts — toISOString() would convert to
// UTC and shift the day back in positive-offset timezones (e.g. France).
function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formDate = computed({
  get: () => form.value.date ? new Date(form.value.date + 'T12:00:00') : null,
  set: (val) => {
    form.value.date = val ? toIsoDate(new Date(val)) : ''
  },
})

// Bridge between the stored ISO date (yyyy-mm-dd) and the route query (dd-mm-yyyy).
function toQueryDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}
function fromQueryDate(q) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(q || '')
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}

// Carry the previous night's coucher/lever into a fresh entry so the user starts
// from a realistic band and only nudges it, rather than setting times from zero.
function lastTimes(excludeDate) {
  const prev = entries.value.find(e => e.date !== excludeDate && (e.bedtime || e.wakeTime))
  return prev ? { bedtime: prev.bedtime, wakeTime: prev.wakeTime } : {}
}

function openForDate(date) {
  const existing = entries.value.find(e => e.date === date)
  form.value = existing
    ? { ...emptyForm(date), ...existing }
    : { ...emptyForm(date), ...lastTimes(date) }
  showForm.value = true
}

// Opening/editing an entry is driven through the route so the URL reflects the
// day being filled (deep-linkable, e.g. from the "compléter votre agenda"
// notification). The watch below reacts and opens the form.
function setDayQuery(date) {
  const day = toQueryDate(date)
  if (route.query.day === day) {
    openForDate(date)
    return
  }
  router.replace({ query: { ...route.query, day } })
}

function openTodayEntry() {
  setDayQuery(todayStr())
}

function editEntry(entry) {
  setDayQuery(entry.date)
}

// Open the form when navigated to with ?day=dd-mm-yyyy. Waits for the profile to
// be loaded so the form section is mounted before opening.
watch(
  [() => route.query.day, () => selfStore.item?.id],
  ([day, id]) => {
    const date = fromQueryDate(day)
    if (date && id && !showForm.value) openForDate(date)
  },
  { immediate: true },
)

// Strip the query once the form is dismissed so the URL stays clean.
watch(showForm, (open) => {
  if (!open && route.query.day !== undefined) {
    const nextQuery = { ...route.query }
    delete nextQuery.day
    router.replace({ query: nextQuery })
  }
})

function persist(payload) {
  const list = [...entries.value]
  const idx = list.findIndex(e => e.date === payload.date)
  if (idx >= 0) list[idx] = payload
  else list.push(payload)
  list.sort((a, b) => b.date.localeCompare(a.date))
  entries.value = list
}

async function saveEntry() {
  saving.value = true
  try {
    persist({ ...form.value })
    showForm.value = false
    messagesStore.add({ type: 'success', text: 'Entrée enregistrée avec succès' })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement" })
  } finally {
    saving.value = false
  }
}

// One-tap quick log: tapping a face on the dashboard card creates today's entry
// with that night quality, carrying over the previous night's times. The user
// can refine it later from the full form.
const quickQuality = ref(null)
watch(quickQuality, (q) => {
  if (!q) return
  const date = todayStr()
  persist({ ...emptyForm(date), ...lastTimes(date), nightQuality: q })
  messagesStore.add({ type: 'success', text: 'Nuit enregistrée — complétez votre agenda si besoin' })
  quickQuality.value = null
})

function confirmDelete(entry) {
  deleteTarget.value = entry
  showDelete.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    if (deleteTarget.value) {
      entries.value = entries.value.filter(e => e.date !== deleteTarget.value.date)
    }
    messagesStore.add({ type: 'success', text: 'Entrée supprimée' })
  } catch {
    messagesStore.add({ type: 'error', text: 'Erreur lors de la suppression' })
  } finally {
    deleting.value = false
    showDelete.value = false
    deleteTarget.value = null
  }
}

function fmtDate(ds) {
  if (!ds) return ''
  return new Date(ds + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

<template>
  <div>
    <v-row justify="center" class="mt-6 mb-16 pb-10" :class="{ 'mx-6': !$vuetify.display.mobile }">
      <v-col :cols="$vuetify.display.mobile ? 12 : 8">

        <!-- Header -->
        <v-card flat color="transparent" class="mb-4" :class="{ 'mx-6': $vuetify.display.mobile }">
          <div class="text-headline-medium font-weight-bold mb-2">Agenda du sommeil</div>
          <div class="text-body-medium text-medium-emphasis">Remplissez votre agenda chaque matin au réveil et chaque
            soir. Tenez-le pendant au moins 3 semaines pour obtenir une image fidèle de votre sommeil.</div>
        </v-card>

        <template v-if="selfStore.item.id">

          <!-- Weekly streak — encourages a daily entry -->
          <v-card class="mb-6 pa-5 card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <SleepDiaryStreak :entries="entries" />
          </v-card>

          <!-- One-tap quick log for the current night -->
          <v-card v-if="!hasToday" class="mb-6 pa-5 card-shadow"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <div class="d-flex align-center mb-3" style="gap: 8px;">
              <v-icon :icon="mdiMoonWaningCrescent" color="primary" size="22" />
              <span class="text-title-medium font-weight-bold">Comment avez-vous dormi cette nuit ?</span>
            </div>
            <QualityRating v-model="quickQuality" />
            <div class="text-center mt-2">
              <v-btn variant="text" size="small" color="primary" class="text-none" @click="openTodayEntry">
                Remplir en détail
              </v-btn>
            </div>
          </v-card>

          <!-- Add / edit today -->
          <div v-else class="mb-6" :class="{ 'mx-6': $vuetify.display.mobile }">
            <v-btn :prepend-icon="mdiPencilOutline" color="primary" variant="flat" rounded="lg" size="large"
              class="text-none" :block="$vuetify.display.mobile" @click="openTodayEntry">
              Modifier l'entrée du jour
            </v-btn>
          </div>

          <!-- Timeline visualization -->
          <v-card v-if="entries.length" class="mb-4 pa-5 card-shadow"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <div class="text-title-medium font-weight-bold mb-3">Visualisation</div>

            <!-- Hour labels -->
            <div class="tl-grid mb-1">
              <div />
              <div class="tl-labels-row">
                <span v-for="lbl in hourLabels" :key="lbl.label" class="tl-label" :style="{ left: lbl.pct + '%' }">
                  {{ lbl.label }}
                </span>
              </div>
            </div>

            <!-- Entry rows -->
            <div v-for="e in entries.slice(0, 14)" :key="e.date" class="tl-grid mb-2">
              <div class="text-body-small text-medium-emphasis text-capitalize tl-date-label">
                {{ fmtDate(e.date) }}
              </div>
              <div class="tl-track">
                <div v-for="lbl in hourLabels" :key="lbl.label" class="tl-gridline" :style="{ left: lbl.pct + '%' }" />
                <template v-for="(seg, si) in sleepSegs(e)" :key="'s' + si">
                  <div class="tl-seg" :class="seg.type === 'sleep' ? 'tl-sleep' : 'tl-awake'"
                    :style="{ left: seg.l + '%', width: seg.w + '%' }" />
                </template>
                <div v-for="(n, ni) in napSegs(e)" :key="'n' + ni" class="tl-seg tl-nap"
                  :style="{ left: n.l + '%', width: n.w + '%' }" />
                <span v-for="(p, mi) in somnoMarks(e)" :key="'m' + mi" class="tl-som" :style="{ left: p + '%' }">S</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="d-flex mt-3" style="gap: 16px;">
              <div class="d-flex align-center" style="gap: 6px;">
                <div class="legend-sleep" />
                <span class="text-body-small text-medium-emphasis">Sommeil</span>
              </div>
              <div class="d-flex align-center" style="gap: 6px;">
                <div class="legend-nap" />
                <span class="text-body-small text-medium-emphasis">Sieste</span>
              </div>
              <div class="d-flex align-center" style="gap: 6px;">
                <span class="legend-som">S</span>
                <span class="text-body-small text-medium-emphasis">Somnolence</span>
              </div>
            </div>
          </v-card>

          <!-- Loading -->
          <div v-if="loading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <!-- Empty state -->
          <v-card v-else-if="!entries.length" flat color="transparent" class="mb-4 pa-5 text-center">
            <div class="text-body-medium text-medium-emphasis">Aucune entrée pour le moment. Commencez à remplir votre
              agenda !
            </div>
          </v-card>

          <!-- Entry cards -->
          <v-card v-for="entry in entries" :key="entry.date" class="mb-3 card-shadow pa-5"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-title-medium font-weight-medium text-capitalize">{{ fmtDate(entry.date) }}</div>
              <div>
                <v-btn :icon="mdiPencilOutline" size="small" variant="text" @click="editEntry(entry)" />
                <v-btn :icon="mdiTrashCanOutline" size="small" variant="text" color="error"
                  @click="confirmDelete(entry)" />
              </div>
            </div>

            <div class="d-flex flex-wrap align-center" style="gap: 8px;">
              <span v-if="entry.bedtime || entry.wakeTime" class="text-body-small text-medium-emphasis">
                <template v-if="entry.bedtime">↓ {{ entry.bedtime }}</template>
                <template v-if="entry.bedtime && entry.wakeTime"> → </template>
                <template v-if="entry.wakeTime">↑ {{ entry.wakeTime }}</template>
              </span>
              <v-chip v-if="entry.nightQuality" :color="qualityColor(entry.nightQuality)" variant="tonal" size="small">
                Nuit: {{ entry.nightQuality }}
              </v-chip>
              <v-chip v-if="entry.morningForm" :color="qualityColor(entry.morningForm)" variant="tonal" size="small">
                Réveil: {{ entry.morningForm }}
              </v-chip>
              <v-chip v-if="entry.daytimeForm" :color="qualityColor(entry.daytimeForm)" variant="tonal" size="small">
                Journée: {{ entry.daytimeForm }}
              </v-chip>
            </div>

            <div v-if="entry.medications" class="text-body-small text-medium-emphasis mt-2">
              {{ entry.medications }}
            </div>
          </v-card>

          <!-- Entry form — bottom sheet on xs, dialog on larger screens -->
          <component :is="xs ? VBottomSheet : VDialog" v-model="showForm" :max-width="xs ? undefined : 580" scrollable>
            <v-card :rounded="xs ? 't-xl' : 0" :class="[{ 'rounded-15': !xs }]">
              <v-card-title class="pa-4 text-title-large font-weight-bold">
                Entrée de l'agenda
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-4">

                <!-- Date -->
                <div class="mb-5">
                  <div class="field-label">Date de la nuit</div>
                  <v-date-input v-model="formDate" input-format="dd/MM/yyyy" variant="outlined" rounded="lg"
                    prepend-icon="" hide-details density="comfortable" />
                </div>

                <!-- Interactive sleep timeline -->
                <div class="mb-6">
                  <div class="field-label">Votre nuit</div>
                  <div class="text-body-small text-medium-emphasis mb-3">
                    Faites glisser les poignées pour indiquer votre coucher, votre lever et vos réveils. Les horaires
                    sont volontairement approximatifs.
                  </div>
                  <SleepBandInput v-model:bedtime="form.bedtime" v-model:wake-time="form.wakeTime"
                    v-model:awakenings="form.awakenings" v-model:naps="form.naps"
                    v-model:somnolence="form.somnolence" />
                </div>

                <!-- Night quality -->
                <div class="mb-5">
                  <div class="field-label">Qualité de la nuit</div>
                  <QualityRating v-model="form.nightQuality" />
                </div>

                <!-- Morning form -->
                <div class="mb-5">
                  <div class="field-label">Forme au réveil</div>
                  <QualityRating v-model="form.morningForm" />
                </div>

                <!-- Daytime form -->
                <div class="mb-5">
                  <div class="field-label">Forme dans la journée</div>
                  <QualityRating v-model="form.daytimeForm" />
                </div>

                <!-- Medications / events -->
                <div>
                  <div class="field-label">Médicaments / Événements</div>
                  <v-textarea v-model="form.medications" density="comfortable" variant="outlined" rounded="lg" rows="2"
                    hide-details placeholder="Ex : Doliprane, sport le soir, stress…" />
                </div>

              </v-card-text>
              <v-divider />
              <v-card-actions class="pa-4">
                <v-btn variant="text" rounded="lg" size="large" class="text-none" @click="showForm = false">
                  Annuler
                </v-btn>
                <v-spacer />
                <v-btn color="primary" variant="flat" rounded="lg" size="large" class="text-none" :loading="saving"
                  @click="saveEntry">
                  Enregistrer
                </v-btn>
              </v-card-actions>
            </v-card>
          </component>

          <!-- Delete confirm dialog -->
          <v-dialog v-model="showDelete" max-width="360">
            <v-card class="card-shadow rounded-15">
              <v-card-title class="pa-4">Supprimer l'entrée</v-card-title>
              <v-divider />
              <v-card-text class="pa-4">Êtes-vous sûr de vouloir supprimer cette entrée ?</v-card-text>
              <v-divider />
              <v-card-actions class="pa-4">
                <v-btn variant="text" rounded="lg" size="large" class="text-none" @click="showDelete = false">
                  Annuler
                </v-btn>
                <v-spacer />
                <v-btn color="error" variant="flat" rounded="lg" size="large" class="text-none" :loading="deleting"
                  @click="doDelete">
                  Supprimer
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </template>
        <template v-else>

          <!-- Add button skeleton -->
          <div class="px-5 mb-4">
            <v-skeleton-loader type="button" />
          </div>

          <!-- Timeline skeleton -->
          <v-card class="mb-4 pa-5 card-shadow" :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <v-skeleton-loader type="heading" class="mb-3" />
            <v-skeleton-loader type="text@5" />
          </v-card>

          <!-- Entry card skeletons -->
          <v-card v-for="i in 3" :key="i" class="mb-3 card-shadow pa-5"
            :class="{ 'rounded-15': !$vuetify.display.mobile }" color="white">
            <v-skeleton-loader type="text@2" />
          </v-card>

        </template>

      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.field-label {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.75);
}

.tl-grid {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
}

.tl-date-label {
  text-align: right;
  padding-right: 8px;
  line-height: 1.2;
  font-size: 11px !important;
}

.tl-labels-row {
  position: relative;
  height: 16px;
}

.tl-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.tl-track {
  position: relative;
  height: 18px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.tl-gridline {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.12);
}

.tl-seg {
  position: absolute;
  top: 0;
  height: 100%;
}

.tl-sleep {
  background: repeating-linear-gradient(-45deg,
      rgba(var(--v-theme-primary), 1) 0px,
      rgba(var(--v-theme-primary), 1) 3px,
      rgba(var(--v-theme-primary), 0.2) 3px,
      rgba(var(--v-theme-primary), 0.2) 6px);
}

.tl-awake {
  background: rgba(0, 0, 0, 0.08);
}

.tl-nap {
  top: 55%;
  height: 45%;
  background: rgba(var(--v-theme-warning), 0.85);
  border-radius: 0 0 2px 2px;
}

.tl-som {
  position: absolute;
  top: -1px;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  color: rgb(var(--v-theme-primary));
}

.legend-sleep {
  width: 20px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  background: repeating-linear-gradient(-45deg,
      rgba(var(--v-theme-primary), 1) 0px,
      rgba(var(--v-theme-primary), 1) 3px,
      rgba(var(--v-theme-primary), 0.2) 3px,
      rgba(var(--v-theme-primary), 0.2) 6px);
}

.legend-nap {
  width: 20px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  background: rgba(var(--v-theme-warning), 0.85);
}

.legend-som {
  width: 14px;
  height: 14px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
