# Almakare

Web application (PWA) for patients of a sleep medicine center — manage appointments, track sleep, complete clinical questionnaires, and follow a hospitalization journey. UI is in French.

Built with **Vue 3** + **Vite** + **Vuetify 4** + **Pinia** + **Vue Router**.

---

## Tech stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite 8** — dev server & bundler
- **Vuetify 4** — UI components
- **Pinia 3** — state management
- **Vue Router 4** — routing
- **vite-plugin-pwa** — PWA support (auto-update service worker)
- **dayjs**, **marked**, **@vueuse/core**

No backend is wired up yet. The frontend uses local Pinia stores as placeholders (see [src/stores/](src/stores/)).

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
    ├── components/         # Reusable components
    ├── composables/        # Reusable composition functions
    ├── plugins/            # Vuetify + plugin registration
    ├── stores/             # Pinia stores
    └── views/              # Route-level pages
```

Path alias: `@` → [src/](src/) (see [vite.config.js:54-57](vite.config.js#L54-L57)).

---

## Routes

Defined in [src/router.js](src/router.js):

| Path                       | View                       | Auth         |
| -------------------------- | -------------------------- | ------------ |
| `/`                        | HomeView (landing)         | guest        |
| `/login`                   | LoginView                  | guest        |
| `/accueil`                 | AccueilView                | requiresAuth |
| `/profil`                  | ProfileView                | requiresAuth |
| `/messages`                | MessagesView               | requiresAuth |
| `/notifications`           | NotificationsView          | requiresAuth |
| `/prendre-rendez-vous`     | BookAppointmentView        | requiresAuth |
| `/parcours-hospitalisation`| HospitalizationJourneyView | requiresAuth |
| `/test-epworth`            | EpworthTestView            | requiresAuth |
| `/agenda-sommeil`          | SleepDiaryView             | requiresAuth |
| `/troubles-du-sommeil`     | SleepStatsFranceView       | requiresAuth |

Navigation behavior ([src/router.js:103-123](src/router.js#L103-L123)):

- `requiresAuth` routes redirect to `/login` when the user is not authenticated (i.e. `selfStore.item.id` is falsy).
- Authenticated visits to `/` are redirected to the last visited protected route (stored in `localStorage` under `almakare:lastRoute`), falling back to `/accueil`.

---

## Stores

Pinia stores in [src/stores/](src/stores/):

- `self` — the authenticated user; also the source of truth for the auth check in the router guard.
- `appointments` — scheduled and past appointments.
- `messages` — patient ↔ care-team messaging.
- `organisation` — sleep center / organization data.
- `team` — care team members.
- `params` — app-wide parameters.
- `pendings` — pending requests / loading state helpers.

---

## Notes for backend integration

- There is no API client or `.env` configuration yet — endpoints will need to be plugged into the Pinia stores in [src/stores/](src/stores/).
- The `self` store ([src/stores/self.js](src/stores/self.js)) is the placeholder for the authenticated user; the router guard treats a truthy `self.item.id` as "logged in".
- Firebase Hosting is configured for deployment (`npm run deploy`), but Firebase Auth / Firestore are **not** wired up — expect to plug in your own backend.
- PWA is enabled with `registerType: 'autoUpdate'` — the service worker will impact local testing of API calls; use a hard reload if responses appear cached.
- The PWA manifest description in [vite.config.js:18](vite.config.js#L18) is stale (mentions "lab experiments") and should be updated to match the sleep-medicine focus.
