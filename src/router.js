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
      redirect: { name: 'Dashboard' },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mon-dossier',
      name: 'MonDossier',
      component: () => import('./views/MonDossierView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/mon-compte',
      name: 'MonCompte',
      component: () => import('./views/MonCompteView.vue'),
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
      path: '/prendre-rendez-vous',
      name: 'PrendreRendezVous',
      component: () => import('./views/PrendreRendezVousView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('./views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('./views/NotFoundView.vue'),
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
