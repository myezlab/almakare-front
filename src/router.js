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
      path: '/dashboard-patient',
      name: 'DashboardPatient',
      component: () => import('./views/DashboardPatientView.vue'),
      meta: { requiresAuth: true, roles: ['patient'] },
    },      
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('./views/ProfileView.vue'),
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
    }
  ],
})


router.beforeEach(async (to, from, next) => {
  const selfStore = useSelfStore()
  if (to.name === 'Home' && selfStore.item.id) {
    next({ name: 'DashboardPatient' })
    return
  }
  next()
})


export default router
