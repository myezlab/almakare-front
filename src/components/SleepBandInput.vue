<script setup>
// Interactive sleep timeline — the digital version of the Réseau Morphée
// "hachurez la zone qui correspond à votre sommeil". Instead of typing exact
// times into pickers, the user drags a sleep band across a 24 h track. The
// method itself says times are deliberately approximate, so dragging to a 15 min
// snap matches the intent and makes a nightly entry take seconds.
//
// Everything lives on one track:
//  • the main sleep band (coucher → lever), draggable by either edge or as a whole
//  • réveils nocturnes — gaps cut out of the band
//  • siestes — separate bands in the daytime region
//  • somnolence — "S" markers placed during the day
import {
  hourLabels, MIN_GAP_PCT, pctToTime, toHours, toPct,
} from '@/utils/sleepTimeline'
import {
  mdiArrowDownThin, mdiArrowUpThin, mdiCloseCircle, mdiPlus, mdiPowerSleep,
} from '@mdi/js'
import { computed, onBeforeUnmount, ref } from 'vue'

const bedtime = defineModel('bedtime', { type: String, default: '' })
const wakeTime = defineModel('wakeTime', { type: String, default: '' })
const awakenings = defineModel('awakenings', { type: Array, default: () => [] })
const naps = defineModel('naps', { type: Array, default: () => [] })
const somnolence = defineModel('somnolence', { type: Array, default: () => [] })

const labels = hourLabels()
const track = ref(null)

// Whichever edge/element is being dragged, plus a live "HH:MM" tooltip value.
const drag = ref(null) // { kind, index, grabOffset } | null
const tip = ref(null) // { pct, time } | null

const hasSleep = computed(() => !!(bedtime.value && wakeTime.value))
const bedPct = computed(() => toPct(bedtime.value) ?? 0)
const wakePct = computed(() => toPct(wakeTime.value) ?? 0)

// The sleep band split into sleep / awake segments around the réveils nocturnes,
// so the cut-outs render as gaps just like the paper agenda.
const sleepSegments = computed(() => {
  if (!hasSleep.value) return []
  const s = bedPct.value
  const e = wakePct.value
  if (e <= s) return []
  const gaps = awakenings.value
    .map(a => ({ s: toPct(a.start), e: toPct(a.end) }))
    .filter(a => a.s !== null && a.e !== null && a.s < a.e && a.s >= s && a.e <= e)
    .sort((a, b) => a.s - b.s)
  const segs = []
  let cur = s
  for (const g of gaps) {
    if (g.s > cur) segs.push({ left: cur, width: g.s - cur, type: 'sleep' })
    segs.push({ left: g.s, width: g.e - g.s, type: 'awake' })
    cur = g.e
  }
  if (cur < e) segs.push({ left: cur, width: e - cur, type: 'sleep' })
  return segs
})

const awakeningHandles = computed(() =>
  awakenings.value.map((a, i) => ({ i, start: toPct(a.start), end: toPct(a.end) }))
    .filter(a => a.start !== null && a.end !== null),
)

const napBands = computed(() =>
  naps.value.map((n, i) => ({ i, start: toPct(n.start), end: toPct(n.end) }))
    .filter(n => n.start !== null && n.end !== null && n.end > n.start),
)

const somnoMarks = computed(() =>
  somnolence.value.map((t, i) => ({ i, pct: toPct(t) })).filter(m => m.pct !== null),
)

// Sleep duration shown as live feedback while the user adjusts the band.
const durationLabel = computed(() => {
  if (!hasSleep.value) return ''
  let h = toHours(wakeTime.value) - toHours(bedtime.value)
  // Subtract the réveils nocturnes from the time actually spent asleep.
  for (const a of awakenings.value) {
    const s = toHours(a.start)
    const e = toHours(a.end)
    if (s !== null && e !== null && e > s) h -= e - s
  }
  if (h <= 0) return ''
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}h${mm ? String(mm).padStart(2, '0') : ''}`
})

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

function pointerPct(e) {
  const rect = track.value.getBoundingClientRect()
  return clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
}

function startDrag(kind, index, e) {
  e.preventDefault()
  let grabOffset = 0
  if (kind === 'band') {
    // Remember where on the band the user grabbed so it shifts without jumping.
    grabOffset = pointerPct(e) - bedPct.value
  }
  drag.value = { kind, index, grabOffset }
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', endDrag)
  onDrag(e) // apply immediately so a tap-and-release still registers
}

function setTip(pct) {
  tip.value = { pct, time: pctToTime(pct) }
}

function onDrag(e) {
  if (!drag.value) return
  const { kind, index, grabOffset } = drag.value
  const pct = pointerPct(e)

  if (kind === 'bed') {
    const next = clamp(pct, 0, wakePct.value - MIN_GAP_PCT)
    bedtime.value = pctToTime(next)
    setTip(next)
  } else if (kind === 'wake') {
    const next = clamp(pct, bedPct.value + MIN_GAP_PCT, 100)
    wakeTime.value = pctToTime(next)
    setTip(next)
  } else if (kind === 'band') {
    const width = wakePct.value - bedPct.value
    const nextBed = clamp(pct - grabOffset, 0, 100 - width)
    bedtime.value = pctToTime(nextBed)
    wakeTime.value = pctToTime(nextBed + width)
    setTip(nextBed)
  } else if (kind === 'awk-start') {
    const a = awakenings.value[index]
    const next = clamp(pct, bedPct.value, toPct(a.end) - MIN_GAP_PCT)
    updateItem(awakenings, index, { start: pctToTime(next) })
    setTip(next)
  } else if (kind === 'awk-end') {
    const a = awakenings.value[index]
    const next = clamp(pct, toPct(a.start) + MIN_GAP_PCT, wakePct.value)
    updateItem(awakenings, index, { end: pctToTime(next) })
    setTip(next)
  } else if (kind === 'nap-start') {
    const n = naps.value[index]
    const next = clamp(pct, 0, toPct(n.end) - MIN_GAP_PCT)
    updateItem(naps, index, { start: pctToTime(next) })
    setTip(next)
  } else if (kind === 'nap-end') {
    const n = naps.value[index]
    const next = clamp(pct, toPct(n.start) + MIN_GAP_PCT, 100)
    updateItem(naps, index, { end: pctToTime(next) })
    setTip(next)
  } else if (kind === 'som') {
    const list = [...somnolence.value]
    list[index] = pctToTime(pct)
    somnolence.value = list
    setTip(pct)
  }
}

function endDrag() {
  drag.value = null
  tip.value = null
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', endDrag)
}

onBeforeUnmount(endDrag)

function updateItem(model, index, patch) {
  const list = [...model.value]
  list[index] = { ...list[index], ...patch }
  model.value = list
}

// --- Add / remove --------------------------------------------------------

function setDefaultSleep() {
  // Sensible starting band the user then nudges into place.
  bedtime.value = '23:00'
  wakeTime.value = '07:00'
}

function addAwakening() {
  if (!hasSleep.value) return
  // Drop a ~30 min réveil in the middle of the night, then let the user drag it.
  const midPct = (bedPct.value + wakePct.value) / 2
  awakenings.value = [
    ...awakenings.value,
    { start: pctToTime(midPct - MIN_GAP_PCT), end: pctToTime(midPct + MIN_GAP_PCT) },
  ]
}

function removeAwakening(i) {
  awakenings.value = awakenings.value.filter((_, j) => j !== i)
}

function addNap() {
  naps.value = [...naps.value, { start: '14:00', end: '14:30' }]
}

function removeNap(i) {
  naps.value = naps.value.filter((_, j) => j !== i)
}

function addSomnolence() {
  somnolence.value = [...somnolence.value, '16:00']
}

function removeSomnolence(i) {
  somnolence.value = somnolence.value.filter((_, j) => j !== i)
}

function fmtRange(item) {
  return `${item.start || '—'} → ${item.end || '—'}`
}
</script>

<template>
  <div class="band-input">
    <!-- Hour scale -->
    <div class="scale">
      <span v-for="l in labels" :key="l.label" class="scale-label" :style="{ left: l.pct + '%' }">{{ l.label }}</span>
    </div>

    <!-- Track -->
    <div class="track-wrap">
    <div ref="track" class="track" :class="{ dragging: !!drag }">
      <!-- gridlines + night/day shading -->
      <div v-for="l in labels" :key="'g' + l.label" class="gridline" :style="{ left: l.pct + '%' }" />

      <template v-if="hasSleep">
        <!-- Whole-band move target sits behind the segments -->
        <div class="band-move" :style="{ left: bedPct + '%', width: (wakePct - bedPct) + '%' }"
          @pointerdown="startDrag('band', null, $event)" />

        <!-- sleep / awake segments -->
        <div v-for="(seg, si) in sleepSegments" :key="'s' + si" class="seg"
          :class="seg.type === 'sleep' ? 'seg-sleep' : 'seg-awake'"
          :style="{ left: seg.left + '%', width: seg.width + '%' }" />

        <!-- bedtime handle -->
        <div class="handle handle-edge" :style="{ left: bedPct + '%' }"
          @pointerdown="startDrag('bed', null, $event)">
          <div class="grip"><v-icon :icon="mdiArrowDownThin" size="18" /></div>
        </div>

        <!-- wake handle -->
        <div class="handle handle-edge" :style="{ left: wakePct + '%' }"
          @pointerdown="startDrag('wake', null, $event)">
          <div class="grip"><v-icon :icon="mdiArrowUpThin" size="18" /></div>
        </div>

        <!-- awakening edge handles -->
        <template v-for="a in awakeningHandles" :key="'a' + a.i">
          <div class="handle handle-sub" :style="{ left: a.start + '%' }"
            @pointerdown="startDrag('awk-start', a.i, $event)">
            <div class="grip grip-sm" />
          </div>
          <div class="handle handle-sub" :style="{ left: a.end + '%' }"
            @pointerdown="startDrag('awk-end', a.i, $event)">
            <div class="grip grip-sm" />
          </div>
        </template>
      </template>

      <!-- empty state -->
      <button v-else type="button" class="empty-cta" @click="setDefaultSleep">
        <v-icon :icon="mdiPowerSleep" size="18" class="mr-1" />
        Indiquer mes horaires de sommeil
      </button>

      <!-- nap bands -->
      <template v-for="n in napBands" :key="'n' + n.i">
        <div class="nap-band" :style="{ left: n.start + '%', width: (n.end - n.start) + '%' }" />
        <div class="handle handle-sub" :style="{ left: n.start + '%' }"
          @pointerdown="startDrag('nap-start', n.i, $event)">
          <div class="grip grip-sm grip-nap" />
        </div>
        <div class="handle handle-sub" :style="{ left: n.end + '%' }"
          @pointerdown="startDrag('nap-end', n.i, $event)">
          <div class="grip grip-sm grip-nap" />
        </div>
      </template>

      <!-- somnolence markers -->
      <div v-for="m in somnoMarks" :key="'so' + m.i" class="som-mark handle" :style="{ left: m.pct + '%' }"
        @pointerdown="startDrag('som', m.i, $event)">S</div>
    </div>

      <!-- Live tooltip floats above the track, outside its overflow:hidden -->
      <div v-if="tip" class="tip" :style="{ left: tip.pct + '%' }">{{ tip.time }}</div>
    </div>

    <!-- Legend + sleep duration -->
    <div class="d-flex align-center justify-space-between mt-3 mb-1">
      <div class="d-flex flex-wrap" style="gap: 14px;">
        <span class="lg"><span class="lg-sleep" />Sommeil</span>
        <span class="lg"><span class="lg-nap" />Sieste</span>
        <span class="lg"><span class="lg-som">S</span>Somnolence</span>
      </div>
      <span v-if="durationLabel" class="duration">{{ durationLabel }} de sommeil</span>
    </div>

    <!-- Add controls -->
    <div class="d-flex flex-wrap mt-3" style="gap: 8px;">
      <v-btn :prepend-icon="mdiPlus" size="small" variant="tonal" color="primary" rounded="lg" class="text-none"
        :disabled="!hasSleep" @click="addAwakening">Réveil nocturne</v-btn>
      <v-btn :prepend-icon="mdiPlus" size="small" variant="tonal" color="warning" rounded="lg" class="text-none"
        @click="addNap">Sieste</v-btn>
      <v-btn :prepend-icon="mdiPlus" size="small" variant="tonal" rounded="lg" class="text-none"
        @click="addSomnolence">Somnolence</v-btn>
    </div>

    <!-- Editable chips listing each added item (drag on the track, remove here) -->
    <div v-if="awakenings.length || naps.length || somnolence.length" class="mt-3 d-flex flex-column" style="gap: 6px;">
      <div v-for="(a, i) in awakenings" :key="'ca' + i" class="item-chip">
        <span class="item-dot dot-awake" />
        <span class="item-text">Réveil&nbsp;: {{ fmtRange(a) }}</span>
        <v-icon :icon="mdiCloseCircle" size="18" class="item-del" @click="removeAwakening(i)" />
      </div>
      <div v-for="(n, i) in naps" :key="'cn' + i" class="item-chip">
        <span class="item-dot dot-nap" />
        <span class="item-text">Sieste&nbsp;: {{ fmtRange(n) }}</span>
        <v-icon :icon="mdiCloseCircle" size="18" class="item-del" @click="removeNap(i)" />
      </div>
      <div v-for="(t, i) in somnolence" :key="'cs' + i" class="item-chip">
        <span class="item-dot dot-som" />
        <span class="item-text">Somnolence&nbsp;: {{ t }}</span>
        <v-icon :icon="mdiCloseCircle" size="18" class="item-del" @click="removeSomnolence(i)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.band-input {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  touch-action: pan-y;
  /* iOS Safari: don't pop the long-press callout or flash a tap highlight while
     the user holds and drags a handle (the value is inherited by descendants). */
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

/* Wraps the track so the drag tooltip can overflow above it (the track itself
   clips its contents for the rounded sleep/nap segments). */
.track-wrap {
  position: relative;
}

/* Hour scale */
.scale {
  position: relative;
  height: 16px;
  margin-bottom: 2px;
}

.scale-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

/* Track */
.track {
  position: relative;
  height: 64px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  overflow: hidden;
}

.track.dragging {
  cursor: grabbing;
}

.gridline {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.08);
}

.band-move {
  position: absolute;
  top: 0;
  height: 100%;
  cursor: grab;
  z-index: 1;
  touch-action: none;
}

.seg {
  position: absolute;
  top: 10px;
  height: 44px;
  pointer-events: none;
}

.seg-sleep {
  background: repeating-linear-gradient(-45deg,
      rgba(var(--v-theme-primary), 1) 0px,
      rgba(var(--v-theme-primary), 1) 4px,
      rgba(var(--v-theme-primary), 0.25) 4px,
      rgba(var(--v-theme-primary), 0.25) 8px);
}

.seg-awake {
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px dashed rgba(0, 0, 0, 0.25);
  border-bottom: 1px dashed rgba(0, 0, 0, 0.25);
}

/* Nap band sits in the lower half of the track. */
.nap-band {
  position: absolute;
  bottom: 8px;
  height: 22px;
  background: rgba(var(--v-theme-warning), 0.85);
  border-radius: 4px;
  pointer-events: none;
}

/* Draggable handles */
.handle {
  position: absolute;
  top: 0;
  height: 100%;
  width: 36px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  z-index: 3;
  touch-action: none;
}

.grip {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.handle-edge::before {
  /* vertical guide line through the track for the main edges */
  content: '';
  position: absolute;
  top: 0;
  height: 100%;
  width: 2px;
  background: rgb(var(--v-theme-primary));
}

.grip-sm {
  width: 16px;
  height: 16px;
  background: white;
  border: 2px solid rgb(var(--v-theme-primary));
}

.grip-nap {
  border-color: rgb(var(--v-theme-warning));
}

/* Somnolence marker */
.som-mark {
  width: 22px;
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  align-items: flex-start;
  padding-top: 2px;
  cursor: ew-resize;
}

/* Empty state */
.empty-cta {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  border: none;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

/* Live tooltip */
.tip {
  position: absolute;
  top: -6px;
  transform: translate(-50%, -100%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 5;
  pointer-events: none;
}

/* Legend */
.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: rgba(0, 0, 0, 0.6);
}

.lg-sleep {
  width: 18px;
  height: 10px;
  border-radius: 2px;
  background: repeating-linear-gradient(-45deg,
      rgba(var(--v-theme-primary), 1) 0px,
      rgba(var(--v-theme-primary), 1) 3px,
      rgba(var(--v-theme-primary), 0.25) 3px,
      rgba(var(--v-theme-primary), 0.25) 6px);
}

.lg-nap {
  width: 18px;
  height: 10px;
  border-radius: 2px;
  background: rgba(var(--v-theme-warning), 0.85);
}

.lg-som {
  width: 14px;
  height: 14px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.duration {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* Item chips */
.item-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 6px 10px;
}

.item-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-awake {
  background: rgba(0, 0, 0, 0.35);
}

.dot-nap {
  background: rgba(var(--v-theme-warning), 0.85);
}

.dot-som {
  background: rgb(var(--v-theme-primary));
}

.item-text {
  flex: 1;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.75);
}

.item-del {
  color: rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.item-del:hover {
  color: rgb(var(--v-theme-error));
}
</style>
