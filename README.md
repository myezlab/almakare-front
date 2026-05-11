# myEZlab

Web application (PWA) to help users manage their lab experiments and data.

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

No backend is wired up yet. The frontend currently uses local Pinia stores as placeholders (see [src/stores/](src/stores/)).

---

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (see [package.json:29-31](package.json#L29-L31))
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
   cd myEZlab
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

---

## Project structure

```
myEZlab/
├── index.html              # Vite entry HTML
├── vite.config.js          # Vite + PWA + Vuetify config
├── package.json
├── public/                 # Static assets (PWA icons, favicons)
└── src/
    ├── main.js             # App bootstrap
    ├── App.vue
    ├── router.js           # Vue Router config
    ├── style.css
    ├── assets/
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

| Path                      | View                       | Auth          |
| ------------------------- | -------------------------- | ------------- |
| `/`                       | HomeView                   | guest         |
| `/login`                  | LoginView                  | guest         |
| `/dashboard`              | DashboardView              | requiresAuth  |
| `/profile`                | ProfileView                | requiresAuth  |
| `/notifications`          | NotificationsView          | requiresAuth  |
| `/test-epworth`           | EpworthTestView            | requiresAuth  |
| `/agenda-sommeil`         | SleepDiaryView             | requiresAuth  |
| `/troubles-du-sommeil`    | SleepStatsFranceView       | requiresAuth  |

> Note: the `requiresAuth` meta is declared but the navigation guard currently calls `next()` unconditionally ([src/router.js:79-82](src/router.js#L79-L82)). Auth enforcement is expected once the backend is integrated.

---

## Notes for backend integration

- There is no API client or `.env` configuration yet — endpoints will need to be plugged into the Pinia stores in [src/stores/](src/stores/).
- The `self` store ([src/stores/self.js](src/stores/self.js)) is the placeholder for the authenticated user.
- Firebase and i18n were removed in a previous commit; expect to start clean.
- PWA is enabled with `registerType: 'autoUpdate'` — service worker behavior will impact local testing of API calls; use a hard reload if responses appear cached.
