import { useSelfStore } from '@/stores/self'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const element = document.querySelector(to.hash)
          if (element) {
            resolve({
              el: to.hash,
              behavior: 'smooth',
            })
          } else {
            resolve({ top: 0 })
          }
        }, 300)
      })
    } else if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/HomeView.vue'),
      meta: { guest: true },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('./views/NotificationsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/accueil',
      name: 'Accueil',
      component: () => import('./views/AccueilView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rendez-vous',
      name: 'Rendezvous',
      component: () => import('./views/BookAppointmentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rendez-vous/:id',
      name: 'Appointment',
      component: () => import('./views/AppointmentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/acte/:id',
      name: 'Acte',
      component: () => import('./views/ActeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profil',
      name: 'Profile',
      component: () => import('./views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/parametres',
      name: 'Settings',
      component: () => import('./views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'Messages',
      component: () => import('./views/MessagesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/messages/:threadId',
      name: 'Conversation',
      component: () => import('./views/ConversationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/test-epworth',
      name: 'EpworthTest',
      component: () => import('./views/EpworthTestView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/agenda-sommeil',
      name: 'SleepDiary',
      component: () => import('./views/SleepDiaryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/parcours-hospitalisation',
      name: 'HospitalizationJourney',
      component: () => import('./views/HospitalizationJourneyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/troubles-du-sommeil',
      name: 'SleepStatsFrance',
      component: () => import('./views/SleepStatsFranceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('./views/LoginView.vue'),
      meta: { guest: true },
    },
  ],
})

function isAuthenticated(selfStore) {
  return !!selfStore.item?.id
}

const LAST_ROUTE_KEY = 'almakare:lastRoute'

router.beforeEach(async (to, from, next) => {
  const selfStore = useSelfStore()
  const authenticated = isAuthenticated(selfStore)

  if (to.name === 'Home' && authenticated) {
    const saved = localStorage.getItem(LAST_ROUTE_KEY)
    if (saved && saved !== to.fullPath) {
      next(saved)
      return
    }
    next({ name: 'Accueil' })
    return
  }

  if (to.meta?.requiresAuth && !authenticated) {
    next({ name: 'Login' })
    return
  }

  next()
})

router.afterEach((to) => {
  if (to.meta?.requiresAuth) {
    localStorage.setItem(LAST_ROUTE_KEY, to.fullPath)
  }
})


export default router
