# Almakare

Web application (PWA) for patients of a sleep-medicine center — manage your medical record, book appointments, track your sleep, and complete clinical questionnaires requested before a consultation. The app is **patient-facing only** (no doctor/admin UI); doctor, care-team and centre data are seeded locally. UI is in French.

Built with **Vue 3** + **Vite** + **Vuetify 4** + **Pinia** + **Vue Router**.

---

## Tech stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite 8** — dev server & bundler
- **Vuetify 4** — UI components
- **Pinia 3** — state management
- **Vue Router 4** — routing
- **vite-plugin-pwa** — PWA support (auto-update service worker)
- **vite-plugin-vuetify** — auto-import of Vuetify components
- **dayjs** (French locale), **marked**, **@vueuse/core** + **@vueuse/integrations**

No backend is wired up. The frontend runs entirely on local Pinia stores (see [src/stores/](src/stores/)) and seeded data files (see [src/data/](src/data/)). The `self` store persists to `localStorage` and ships pre-authenticated with a placeholder user, so the app behaves as "logged in" out of the box.

---

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (see [package.json:30-32](package.json#L30-L32))
- **npm** (ships with Node.js)

Check your versions:

```bash
node -v
npm -v
```

---

## Setup

1. Clone the repo and `cd` into it:

   ```bash
   git clone <repo-url>
   cd almakare
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

---

## Running the app

### Development

```bash
npm run dev
```

The dev server starts on **http://localhost:3000** (host `0.0.0.0`, strict port — see [vite.config.js:68-72](vite.config.js#L68-L72)).

### Production build

```bash
npm run build
```

Output is written to [dist/](dist/).

### Preview the production build

```bash
npm run preview
```

### Deploy

```bash
npm run deploy
```

Builds and deploys to the `almakare` Firebase Hosting target (see [package.json:10](package.json#L10)). Requires the Firebase CLI to be installed and authenticated.

---

## Project structure

```
almakare/
├── index.html              # Vite entry HTML
├── vite.config.js          # Vite + PWA + Vuetify config
├── package.json
├── public/                 # Static assets (PWA icons, favicons)
└── src/
    ├── main.js             # App bootstrap
    ├── App.vue
    ├── router.js           # Vue Router config
    ├── style.css
    ├── assets/             # Illustrations, logos, images
    ├── components/         # Reusable components (+ monDossier/ tab panels)
    ├── composables/        # Reusable composition functions
    ├── data/               # Seeded data (doctors, team, tests, activities, …)
    ├── plugins/            # Vuetify + plugin registration
    ├── stores/             # Pinia stores
    └── views/              # Route-level pages
```

Path alias: `@` → [src/](src/) (see [vite.config.js:54-57](vite.config.js#L54-L57)).

---

## Routes

Defined in [src/router.js](src/router.js):

| Path                  | View                  | Auth         |
| --------------------- | --------------------- | ------------ |
| `/`                   | → redirects to `/dashboard` | —      |
| `/dashboard`          | DashboardView         | requiresAuth |
| `/mon-dossier`        | MonDossierView        | requiresAuth |
| `/mon-compte`         | MonCompteView         | requiresAuth |
| `/test-epworth`       | EpworthTestView       | requiresAuth |
| `/agenda-du-sommeil`  | SleepDiaryView        | requiresAuth |
| `/prendre-rendez-vous`| PrendreRendezVousView | requiresAuth |
| `/notifications`      | NotificationsView     | requiresAuth |
| `/login`              | LoginView             | guest        |
| `/:pathMatch(.*)*`    | NotFoundView          | guest        |

Navigation behavior ([src/router.js:89-111](src/router.js#L89-L111)):

- `requiresAuth` routes redirect to `/login` when the user is not authenticated (i.e. `selfStore.item?.id` is falsy). The `self` store ships with a placeholder id, so this passes by default.
- `afterEach` records the last visited protected route in `localStorage` under `almakare:lastRoute`.
- Many pages read/write `?tab=` / `?panel=` query params to make tabs and dialogs deep-linkable (see [useUrlPanels.js](src/composables/useUrlPanels.js) and the `MonDossierView` tab logic).

---

## Features

- **Tableau de bord** ([DashboardView](src/views/DashboardView.vue)) — landing hub with shortcuts to the record, sleep diary, appointments, and questionnaires.
- **Mon dossier** ([MonDossierView](src/views/MonDossierView.vue)) — the patient record, organized into tabs:
  - **Données patient** — personal & clinical data, with a seeded modification history ([profileHistory.js](src/data/profileHistory.js)).
  - **Activités** — consultations and the data/documents/questionnaires a doctor has requested before them.
  - **Traitements** — treatments.
  - **Documents** — upload of administrative/medical documents ([documents.js](src/data/documents.js)).
  - **Questionnaires** — scored clinical tests (see below).
  - **Messagerie** — placeholder.
- **Questionnaires cliniques** — three scored tests defined in [tests.js](src/data/tests.js), driven by [useQuestionnaire.js](src/composables/useQuestionnaire.js):
  - **Test d'Epworth** — daytime sleepiness (8 items, /24).
  - **Test STOP-BANG** — obstructive sleep apnea risk screen (8 yes/no items).
  - **Échelle de Hamilton (HAM-D)** — depression severity (17 items).
  - Each test scores answers, maps the total to a severity band (color + label), and persists answers + a dated score history on the patient record. `QuestionnaireResultsDialog` shows past results.
- **Agenda du sommeil** ([SleepDiaryView](src/views/SleepDiaryView.vue)) — sleep diary with a streak indicator ([SleepDiaryStreak](src/components/SleepDiaryStreak.vue)).
- **Prendre rendez-vous** ([PrendreRendezVousView](src/views/PrendreRendezVousView.vue)) — appointment booking against seeded doctor availability ([doctorAvailability.js](src/data/doctorAvailability.js)). The appointment takes place at the doctor's cabinet; the address is shown read-only.
- **Notifications** ([NotificationsView](src/views/NotificationsView.vue)) — notification feed with read/unread state ([useReadState.js](src/composables/useReadState.js)).
- **PWA** — installable, with an in-app install prompt ([InstallAppCard](src/components/InstallAppCard.vue)).

---

## Stores

Pinia stores in [src/stores/](src/stores/):

- `self` — the authenticated patient record; also the source of truth for the router auth check. Persists to `localStorage` under `almakare.self` and seeds a placeholder `{ id: '123456' }` on first load. Questionnaire answers/scores, uploaded documents, requested-data form fields, and profile edits are all stored here.
- `messages` — transient snackbar/toast queue (success / info / warning / error), rendered by [Snackbar.vue](src/components/Snackbar.vue).
- `params` — app-wide parameters (e.g. the captured `beforeinstallprompt` event for PWA install).
- `pendings` — global UI state helpers (loading overlay / dialog flags).

---

## Seeded data

The app has no backend, so reference and demo data live in [src/data/](src/data/):

- `doctors.js` / `team.js` — seeded doctors and care-team members.
- `doctorAvailability.js` — deterministic appointment slots for the booking flow.
- `tests.js` — the catalog of scored questionnaires (Epworth, STOP-BANG, Hamilton).
- `patientFields.js` — fields a doctor can request a patient to fill before a consultation.
- `documents.js` — catalog of documents a patient can upload.
- `activities.json` — activities (`type`: `consultation` or `acte`) and their requested items/documents/questionnaires.
- `notifications.json` — seeded notifications.
- `profileHistory.js` — seeded modification history for the patient record.
- `personalDataAuthorization.json`, `roles.js` — auxiliary reference data.

---

## Composables

Reusable logic in [src/composables/](src/composables/):

- `useQuestionnaire` — draft answers, live scoring, and persisted score history for a scored test.
- `useUrlPanels` — sync open dialogs/panels to the URL query for deep-linking.
- `useNavigationItems` — navigation drawer / bottom-bar items.
- `useReadState` — read/unread tracking (e.g. notifications) persisted in `localStorage`.
- `useDates` — dayjs setup (French locale) and date formatting helpers.
- `useRules` — form validation rules.
- `useMessageType` — maps a message type to its color + icon (used by the snackbar queue).
- `useCurrency` — EUR currency formatting.

---

## Notes for backend integration

- There is no API client or `.env` configuration yet — endpoints will need to be plugged into the Pinia stores in [src/stores/](src/stores/) and the seeded files in [src/data/](src/data/) replaced with real fetches.
- The `self` store ([src/stores/self.js](src/stores/self.js)) is the placeholder for the authenticated patient; the router guard treats a truthy `self.item.id` as "logged in". It ships with a hard-coded id, so remove that seed (and wire real auth) before going live.
- Persistence is currently `localStorage` only (patient record, read state, etc.) — expect to migrate this to a real backend.
- Firebase Hosting is configured for deployment (`npm run deploy`), but Firebase Auth / Firestore are **not** wired up — expect to plug in your own backend.
- PWA is enabled with `registerType: 'autoUpdate'` — the service worker will impact local testing of API calls; use a hard reload if responses appear cached.
- The PWA manifest description in [vite.config.js:18](vite.config.js#L18) is stale (mentions "lab experiments") and should be updated to match the sleep-medicine focus.
