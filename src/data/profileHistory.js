// Seeded modification history for the patient profile (Données générales /
// Données cliniques). The app is patient-facing with no audit backend, so we
// seed a few realistic prior entries; real edits made in the app are appended
// to this list and persisted on the self store (localStorage).
//
// Each entry: { id, section: 'general' | 'clinical', date (ISO), author,
//   changes: [{ label, from, to }] }

export const PROFILE_HISTORY_SEED = [
  {
    id: 'hist-seed-1',
    section: 'clinical',
    date: '2026-04-12T09:30:00.000Z',
    author: 'Dr Martin (consultation)',
    changes: [
      { label: 'Poids (kg)', from: '82', to: '80' },
      { label: 'IAH', from: '18', to: '15' },
    ],
  },
  {
    id: 'hist-seed-2',
    section: 'general',
    date: '2026-02-03T14:10:00.000Z',
    author: 'Vous',
    changes: [
      { label: 'Téléphone', from: '—', to: '06 12 34 56 78' },
      { label: 'Adresse', from: '—', to: '12 rue des Lilas, 75011 Paris' },
    ],
  },
  {
    id: 'hist-seed-3',
    section: 'general',
    date: '2025-11-21T10:00:00.000Z',
    author: 'Vous',
    changes: [
      { label: 'Antécédents médicaux', from: '—', to: 'Hypertension artérielle' },
    ],
  },
]
