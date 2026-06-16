// Fake data for "Suivi du traitement par PPC" (CPAP therapy tracking).
// One entry per night over the last 30 days. Metrics:
//  - usage   : hours the device was used during the night
//  - iah     : Index d'Apnées-Hypopnées (events / hour, target < 5)
//  - leaks   : average mask leaks (L/min, target < 24)
export const ppcTracking = [
  { date: "2026-05-03", usage: 6.8, iah: 3.1, leaks: 12 },
  { date: "2026-05-04", usage: 7.2, iah: 2.4, leaks: 9 },
  { date: "2026-05-05", usage: 5.1, iah: 4.8, leaks: 21 },
  { date: "2026-05-06", usage: 6.4, iah: 3.6, leaks: 14 },
  { date: "2026-05-07", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-05-08", usage: 7.5, iah: 2.1, leaks: 8 },
  { date: "2026-05-09", usage: 7.9, iah: 1.8, leaks: 7 },
  { date: "2026-05-10", usage: 6.9, iah: 2.9, leaks: 11 },
  { date: "2026-05-11", usage: 4.3, iah: 5.2, leaks: 26 },
  { date: "2026-05-12", usage: 6.1, iah: 3.4, leaks: 15 },
  { date: "2026-05-13", usage: 7.1, iah: 2.6, leaks: 10 },
  { date: "2026-05-14", usage: 7.4, iah: 2.2, leaks: 9 },
  { date: "2026-05-15", usage: 6.6, iah: 3.0, leaks: 13 },
  { date: "2026-05-16", usage: 5.8, iah: 4.1, leaks: 18 },
  { date: "2026-05-17", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-05-18", usage: 6.3, iah: 3.7, leaks: 16 },
  { date: "2026-05-19", usage: 7.7, iah: 1.9, leaks: 7 },
  { date: "2026-05-20", usage: 7.8, iah: 2.0, leaks: 8 },
  { date: "2026-05-21", usage: 6.5, iah: 3.2, leaks: 12 },
  { date: "2026-05-22", usage: 7.0, iah: 2.7, leaks: 10 },
  { date: "2026-05-23", usage: 5.4, iah: 4.5, leaks: 22 },
  { date: "2026-05-24", usage: 6.7, iah: 3.3, leaks: 14 },
  { date: "2026-05-25", usage: 7.3, iah: 2.3, leaks: 9 },
  { date: "2026-05-26", usage: 7.6, iah: 2.1, leaks: 8 },
  { date: "2026-05-27", usage: 6.2, iah: 3.8, leaks: 17 },
  { date: "2026-05-28", usage: 7.1, iah: 2.5, leaks: 11 },
  { date: "2026-05-29", usage: 7.9, iah: 1.7, leaks: 6 },
  { date: "2026-05-30", usage: 6.8, iah: 2.8, leaks: 12 },
  { date: "2026-05-31", usage: 7.2, iah: 2.4, leaks: 9 },
  { date: "2026-06-01", usage: 7.5, iah: 2.0, leaks: 8 },
  { date: "2026-06-02", usage: 6.9, iah: 2.8, leaks: 12 },
  { date: "2026-06-03", usage: 7.0, iah: 3.1, leaks: 13 },
  { date: "2026-06-04", usage: 5.6, iah: 4.6, leaks: 20 },
  { date: "2026-06-05", usage: 6.7, iah: 3.5, leaks: 15 },
  { date: "2026-06-06", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-06-07", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-06-08", usage: 6.4, iah: 5.2, leaks: 22 },
  { date: "2026-06-09", usage: 7.1, iah: 3.8, leaks: 14 },
  { date: "2026-06-10", usage: 6.5, iah: 4.2, leaks: 16 },
  { date: "2026-06-11", usage: 5.8, iah: 6.4, leaks: 24 },
  { date: "2026-06-12", usage: 7.1, iah: 3.4, leaks: 11 },
  { date: "2026-06-13", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-06-14", usage: 0, iah: 0, leaks: 0 },
  { date: "2026-06-15", usage: 6.2, iah: 9.1, leaks: 31 },
  { date: "2026-06-16", usage: 6.9, iah: 5.3, leaks: 17 },
]

// Last 7 nights, for the compact dashboard card.
export const recentNights = ppcTracking.slice(-7)

// Summary metrics derived for the header / KPIs.
export const ppcSummary = {
  // % of nights with usage >= 4h (French reimbursement compliance threshold)
  complianceRate: Math.round(
    (ppcTracking.filter((d) => d.usage >= 4).length / ppcTracking.length) * 100
  ),
  avgUsage: +(
    ppcTracking.reduce((s, d) => s + d.usage, 0) / ppcTracking.length
  ).toFixed(1),
  avgIah: +(
    ppcTracking.reduce((s, d) => s + d.iah, 0) / ppcTracking.length
  ).toFixed(1),
}
