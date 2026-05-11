<script setup>
import { useMessagesStore } from '@/stores/messages'
import { useSelfStore } from '@/stores/self'
import {
  mdiMoonWaningCrescent,
  mdiPencilOutline,
  mdiPlus, mdiTrashCanOutline,
  mdiWhiteBalanceSunny,
} from '@mdi/js'
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VBottomSheet } from 'vuetify/components/VBottomSheet'
import { VDialog } from 'vuetify/components/VDialog'

const selfStore = useSelfStore()
const messagesStore = useMessagesStore()
const { xs } = useDisplay()

const QUALITY_OPTIONS = ['TB', 'B', 'Moy', 'M', 'TM']
const QUALITY_COLORS = { TB: 'success', B: 'success', Moy: 'warning', M: 'error', TM: 'error' }
const QUALITY_LABELS = { TB: 'Très bien', B: 'Bien', Moy: 'Moyen', M: 'Mauvais', TM: 'Très mauvais' }

function qualityColor(q) {
  return QUALITY_COLORS[q] || 'grey'
}

// Timeline window: 20:00 → 16:00 next day (20 h span)
const TL_START = 20
const TL_SPAN = 20

const hourLabels = computed(() => {
  const labels = []
  for (let i = 0;i <= TL_SPAN;i += 4) {
    labels.push({ label: `${(TL_START + i) % 24}h`, pct: (i / TL_SPAN) * 100 })
  }
  return labels
})

function toPct(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  let hrs = h + m / 60
  if (hrs < TL_START - 4) hrs += 24
  return Math.min(100, Math.max(0, ((hrs - TL_START) / TL_SPAN) * 100))
}

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
  return new Date().toISOString().split('T')[0]
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
    daytimeForm: null,
  }
}

const form = ref(emptyForm())
const hasToday = computed(() => entries.value.some(e => e.date === todayStr()))

// Bridge form.date (YYYY-MM-DD string) to VDateInput (Date object)
const formDate = computed({
  get: () => form.value.date ? new Date(form.value.date + 'T12:00:00') : null,
  set: (val) => {
    form.value.date = val ? new Date(val).toISOString().split('T')[0] : ''
  },
})

function openForm() {
  const existing = entries.value.find(e => e.date === todayStr())
  form.value = existing ? { ...emptyForm(), ...existing } : emptyForm()
  showForm.value = true
}

function editEntry(entry) {
  form.value = { ...emptyForm(entry.date), ...entry }
  showForm.value = true
}

async function saveEntry() {
  saving.value = true
  try {
    const payload = { ...form.value }
    const list = [...entries.value]
    const idx = list.findIndex(e => e.date === payload.date)
    if (idx >= 0) list[idx] = payload
    else list.push(payload)
    list.sort((a, b) => b.date.localeCompare(a.date))
    entries.value = list
    showForm.value = false
    messagesStore.add({ type: 'success', text: 'Entrée enregistrée avec succès' })
  } catch {
    messagesStore.add({ type: 'error', text: "Erreur lors de l'enregistrement" })
  } finally {
    saving.value = false
  }
}

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

function addAwakening() { form.value.awakenings = [...form.value.awakenings, { start: '', end: '' }] }
function removeAwakening(i) { form.value.awakenings = form.value.awakenings.filter((_, j) => j !== i) }
function addNap() { form.value.naps = [...form.value.naps, { start: '', end: '' }] }
function removeNap(i) { form.value.naps = form.value.naps.filter((_, j) => j !== i) }

function fmtDate(ds) {
  if (!ds) return ''
  return new Date(ds + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Time picker state
const timePicker = ref({ show: false, value: null, callback: null })

function openTimePicker(currentValue, callback) {
  timePicker.value = { show: true, value: currentValue || null, callback }
}

function confirmTimePicker() {
  if (timePicker.value.callback) {
    timePicker.value.callback(timePicker.value.value)
  }
  timePicker.value.show = false
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

          <!-- Add / edit today -->
          <div class="mb-8" :class="{ 'mx-6': $vuetify.display.mobile }">
            <v-btn :prepend-icon="mdiPlus" color="primary" variant="flat" rounded="lg" size="large" class="text-none"
              @click="openForm">
              {{ hasToday ? "Modifier l'entrée du jour" : 'Ajouter une entrée' }}
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
            <v-card :rounded="xs ? 't-xl' : 'xl'" class="pa-2">
              <v-card-title class="pa-6 pb-2 text-title-large font-weight-bold">
                Entrée de l'agenda
              </v-card-title>
              <v-card-text class="px-6 py-2">

                <!-- Date -->
                <div class="mb-5">
                  <div class="field-label">Date de la nuit</div>
                  <v-date-input v-model="formDate" input-format="dd/MM/yyyy" variant="outlined" rounded="lg"
                    prepend-icon="" hide-details density="comfortable" />
                </div>

                <!-- Morning section -->
                <div class="section-header mb-4">
                  <v-icon :icon="mdiWhiteBalanceSunny" color="warning" size="20" class="mr-2" />
                  Section matin
                </div>

                <v-row class="mb-4">
                  <v-col cols="6">
                    <div class="field-label">Heure de coucher</div>
                    <v-btn variant="outlined" rounded="lg" block size="large"
                      :color="form.bedtime ? 'primary' : undefined" class="text-none time-btn"
                      @click="openTimePicker(form.bedtime, v => form.bedtime = v)">
                      {{ form.bedtime || 'Heure' }}
                    </v-btn>
                  </v-col>
                  <v-col cols="6">
                    <div class="field-label">Heure de lever</div>
                    <v-btn variant="outlined" rounded="lg" block size="large"
                      :color="form.wakeTime ? 'primary' : undefined" class="text-none time-btn"
                      @click="openTimePicker(form.wakeTime, v => form.wakeTime = v)">
                      {{ form.wakeTime || 'Heure' }}
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Awakenings -->
                <div class="mb-4">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="field-label mb-0">Réveils nocturnes</div>
                    <v-btn :prepend-icon="mdiPlus" size="small" variant="tonal" color="primary" rounded="lg"
                      class="text-none" @click="addAwakening">
                      Ajouter
                    </v-btn>
                  </div>
                  <div v-for="(aw, i) in form.awakenings" :key="i" class="d-flex align-center mb-3" style="gap: 8px;">
                    <v-btn variant="outlined" rounded="lg" size="large" :color="aw.start ? 'primary' : undefined"
                      class="text-none time-btn flex-1" @click="openTimePicker(aw.start, v => aw.start = v)">
                      {{ aw.start || 'Heure' }}
                    </v-btn>
                    <span class="text-medium-emphasis font-weight-bold">→</span>
                    <v-btn variant="outlined" rounded="lg" size="large" :color="aw.end ? 'primary' : undefined"
                      class="text-none time-btn flex-1" @click="openTimePicker(aw.end, v => aw.end = v)">
                      {{ aw.end || 'Heure' }}
                    </v-btn>
                    <v-btn :icon="mdiTrashCanOutline" size="large" variant="text" color="error"
                      @click="removeAwakening(i)" />
                  </div>
                </div>

                <!-- Night quality -->
                <div class="mb-5">
                  <div class="field-label">Qualité de la nuit</div>
                  <div class="d-flex flex-wrap" style="gap: 10px;">
                    <v-btn v-for="opt in QUALITY_OPTIONS" :key="opt"
                      :color="form.nightQuality === opt ? qualityColor(opt) : undefined"
                      :variant="form.nightQuality === opt ? 'flat' : 'outlined'" rounded="lg" size="large"
                      class="text-none quality-btn" @click="form.nightQuality = opt">
                      {{ QUALITY_LABELS[opt] }}
                    </v-btn>
                  </div>
                </div>

                <!-- Morning form -->
                <div class="mb-5">
                  <div class="field-label">Forme au réveil</div>
                  <div class="d-flex flex-wrap" style="gap: 10px;">
                    <v-btn v-for="opt in QUALITY_OPTIONS" :key="opt"
                      :color="form.morningForm === opt ? qualityColor(opt) : undefined"
                      :variant="form.morningForm === opt ? 'flat' : 'outlined'" rounded="lg" size="large"
                      class="text-none quality-btn" @click="form.morningForm = opt">
                      {{ QUALITY_LABELS[opt] }}
                    </v-btn>
                  </div>
                </div>

                <!-- Medications / events -->
                <div class="mb-5">
                  <div class="field-label">Médicaments / Événements</div>
                  <v-textarea v-model="form.medications" density="comfortable" variant="outlined" rounded="lg" rows="2"
                    hide-details placeholder="Ex : Doliprane, sport le soir, stress…" />
                </div>

                <v-divider class="mb-5" />

                <!-- Evening section -->
                <div class="section-header mb-4">
                  <v-icon :icon="mdiMoonWaningCrescent" color="primary" size="20" class="mr-2" />
                  Section soir
                </div>

                <!-- Naps -->
                <div class="mb-5">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="field-label mb-0">Siestes</div>
                    <v-btn :prepend-icon="mdiPlus" size="small" variant="tonal" color="primary" rounded="lg"
                      class="text-none" @click="addNap">
                      Ajouter
                    </v-btn>
                  </div>
                  <div v-for="(nap, i) in form.naps" :key="i" class="d-flex align-center mb-3" style="gap: 8px;">
                    <v-btn variant="outlined" rounded="lg" size="large" :color="nap.start ? 'primary' : undefined"
                      class="text-none time-btn flex-1" @click="openTimePicker(nap.start, v => nap.start = v)">
                      {{ nap.start || 'Heure' }}
                    </v-btn>
                    <span class="text-medium-emphasis font-weight-bold">→</span>
                    <v-btn variant="outlined" rounded="lg" size="large" :color="nap.end ? 'primary' : undefined"
                      class="text-none time-btn flex-1" @click="openTimePicker(nap.end, v => nap.end = v)">
                      {{ nap.end || 'Heure' }}
                    </v-btn>
                    <v-btn :icon="mdiTrashCanOutline" size="large" variant="text" color="error" @click="removeNap(i)" />
                  </div>
                </div>

                <!-- Daytime form -->
                <div class="mb-2">
                  <div class="field-label">Forme dans la journée</div>
                  <div class="d-flex flex-wrap" style="gap: 10px;">
                    <v-btn v-for="opt in QUALITY_OPTIONS" :key="opt"
                      :color="form.daytimeForm === opt ? qualityColor(opt) : undefined"
                      :variant="form.daytimeForm === opt ? 'flat' : 'outlined'" rounded="lg" size="large"
                      class="text-none quality-btn" @click="form.daytimeForm = opt">
                      {{ QUALITY_LABELS[opt] }}
                    </v-btn>
                  </div>
                </div>

              </v-card-text>
              <v-card-actions class="pa-6 pt-4">
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

          <!-- Time Picker — bottom sheet on xs, dialog on larger screens -->
          <v-bottom-sheet v-if="xs" v-model="timePicker.show" inset>
            <v-sheet rounded="t-xl" class="pa-4 pb-6">
              <div class="text-center text-title-medium font-weight-bold mb-2">
                Heure
              </div>
              <v-time-picker v-model="timePicker.value" format="24hr" hide-header color="primary" class="w-100" />
              <div class="d-flex mt-3" style="gap: 12px;">
                <v-btn variant="outlined" rounded="lg" size="large" class="text-none flex-1"
                  @click="timePicker.show = false">
                  Annuler
                </v-btn>
                <v-btn color="primary" variant="flat" rounded="lg" size="large" class="text-none flex-1"
                  @click="confirmTimePicker">
                  Enregistrer
                </v-btn>
              </div>
            </v-sheet>
          </v-bottom-sheet>

          <v-dialog v-else v-model="timePicker.show" max-width="340">
            <v-card rounded="xl" class="pa-4">
              <div class="text-center text-title-medium font-weight-bold mb-2">
                Heure
              </div>
              <v-time-picker v-model="timePicker.value" format="24hr" hide-header color="primary" class="w-100" />
              <div class="d-flex mt-3" style="gap: 12px;">
                <v-btn variant="outlined" rounded="lg" size="large" class="text-none flex-1"
                  @click="timePicker.show = false">
                  Annuler
                </v-btn>
                <v-btn color="primary" variant="flat" rounded="lg" size="large" class="text-none flex-1"
                  @click="confirmTimePicker">
                  Enregistrer
                </v-btn>
              </div>
            </v-card>
          </v-dialog>

          <!-- Delete confirm dialog -->
          <v-dialog v-model="showDelete" max-width="360">
            <v-card rounded="xl" class="pa-2">
              <v-card-title class="pa-6 pb-2">Supprimer l'entrée</v-card-title>
              <v-card-text class="px-6">Êtes-vous sûr de vouloir supprimer cette entrée ?</v-card-text>
              <v-card-actions class="pa-6 pt-2">
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

.section-header {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 700;
}

.time-btn {
  font-size: 1.05rem !important;
  letter-spacing: 0.01em;
  min-height: 48px !important;
}

.quality-btn {
  min-width: 90px !important;
}

.quality-full {
  opacity: 0.75;
}

.flex-1 {
  flex: 1;
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
</style>
