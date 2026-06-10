import dayjs from 'dayjs'

const TIME_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]

// Day offset (from today) -> indices of slots that are already booked.
// Deterministic so the page looks the same on every visit.
const BOOKED_BY_OFFSET = {
  1: [0, 1, 4, 7, 9, 12],
  2: [2, 3, 8, 11],
  3: [0, 5, 6, 10, 13],
  4: [1, 4, 7, 8, 14],
  5: [0, 2, 9, 12, 13],
  6: [],
  7: [3, 6, 11],
  8: [0, 1, 2, 8, 10, 14],
  9: [4, 5, 9],
  10: [0, 7, 12, 13],
  11: [2, 3, 6, 11],
  12: [1, 8, 14],
  13: [0, 4, 9, 10],
  14: [3, 7, 12],
  15: [5, 6, 13],
  16: [0, 2, 8, 11],
  17: [1, 4, 9, 14],
  18: [3, 10, 12],
  19: [0, 5, 7, 13],
  20: [2, 6, 11, 14],
  21: [4, 8, 12],
}

/**
 * Returns an array of upcoming bookable days, each with its time slots.
 * Weekends are skipped. Past times today are excluded.
 * @param {number} daysAhead Number of calendar days to look ahead
 * @returns {Array<{ date: string, weekday: string, label: string, slots: Array<{ time: string, available: boolean }> }>}
 */
export function getAvailability(daysAhead = 21) {
  const days = []
  const now = dayjs()

  for (let i = 0; i <= daysAhead; i++) {
    const d = now.add(i, 'day')
    const dow = d.day()
    if (dow === 0 || dow === 6) continue

    const booked = new Set(BOOKED_BY_OFFSET[i] || [])
    const slots = TIME_SLOTS.map((time, idx) => {
      const [h, m] = time.split(':').map(Number)
      const slotMoment = d.hour(h).minute(m).second(0)
      const isPast = slotMoment.isBefore(now)
      return { time, available: !booked.has(idx) && !isPast }
    })

    if (slots.some((s) => s.available)) {
      days.push({
        date: d.format('YYYY-MM-DD'),
        weekday: d.format('dddd'),
        label: d.format('DD MMM'),
        slots,
      })
    }
  }

  return days
}

// Overnight créneaux for a sleep recording (e.g. polygraphie ventilatoire
// nocturne): the patient is admitted in the evening and the recording runs
// through the night, so each day offers only one or two long slots rather than
// the short consultation slots above.
const NIGHT_SLOTS = [
  { time: '20:00', label: '20h00 → 07h00' },
  { time: '21:30', label: '21h30 → 08h00' },
]

/**
 * Returns upcoming bookable nights, each with 1–2 long overnight créneaux.
 * Weekends are skipped; some nights are fully booked and omitted.
 * @param {number} daysAhead Number of calendar days to look ahead
 * @returns {Array<{ date: string, weekday: string, label: string, slots: Array<{ time: string, label: string, available: boolean }> }>}
 */
export function getSleepRecordingSlots(daysAhead = 21) {
  const days = []
  const now = dayjs()

  for (let i = 1; i <= daysAhead; i++) {
    const d = now.add(i, 'day')
    const dow = d.day()
    if (dow === 0 || dow === 6) continue
    // Every 7th eligible night is fully booked and omitted.
    if (i % 7 === 3) continue

    // Alternate between one and two open beds for the night.
    const count = i % 2 === 0 ? 2 : 1
    const slots = NIGHT_SLOTS.slice(0, count).map((s) => ({ ...s, available: true }))

    days.push({
      date: d.format('YYYY-MM-DD'),
      weekday: d.format('dddd'),
      label: d.format('DD MMM'),
      slots,
    })
  }

  return days
}
