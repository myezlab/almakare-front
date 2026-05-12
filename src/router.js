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
      path: '/dashboard-doctor',
      name: 'DashboardDoctor',
      component: () => import('./views/DashboardDoctorView.vue'),
      meta: { requiresAuth: true, roles: ['doctor'] },
    },
    {
      path: '/doctor/patients/:id',
      name: 'DoctorPatientJourney',
      component: () => import('./views/DoctorPatientJourneyView.vue'),
      meta: { requiresAuth: true, roles: ['doctor'] },
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
      meta: { requiresAuth: true, roles: ['patient'] },
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

const DASHBOARD_BY_ROLE = {
  patient: 'DashboardPatient',
  doctor: 'DashboardDoctor',
}

function isAuthenticated(selfStore) {
  return !!selfStore.item?.id
}

function userRole(selfStore) {
  return selfStore.item?.role || 'patient'
}

function dashboardRouteFor(role) {
  return DASHBOARD_BY_ROLE[role] || 'DashboardPatient'
}

function hasAccess(to, selfStore) {
  if (to.meta?.guest) return true
  if (to.meta?.requiresAuth && !isAuthenticated(selfStore)) return false
  if (Array.isArray(to.meta?.roles) && to.meta.roles.length > 0) {
    return to.meta.roles.includes(userRole(selfStore))
  }
  return true
}

router.beforeEach(async (to, from, next) => {
  const selfStore = useSelfStore()
  const authenticated = isAuthenticated(selfStore)

  if (to.name === 'Home' && authenticated) {
    next({ name: dashboardRouteFor(userRole(selfStore)) })
    return
  }

  if (to.meta?.requiresAuth && !authenticated) {
    next({ name: 'Login' })
    return
  }

  if (!hasAccess(to, selfStore)) {
    next({ name: dashboardRouteFor(userRole(selfStore)) })
    return
  }

  next()
})


export default router
