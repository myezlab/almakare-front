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
      path: '/patients',
      name: 'Patients',
      component: () => import('./views/PatientsView.vue'),
      meta: { requiresAuth: true, roles: ['doctor'] },
    },
    {
      path: '/doctor/patients/:id',
      name: 'DoctorPatientJourney',
      component: () => import('./views/PatientView.vue'),
      meta: { requiresAuth: true, roles: ['doctor'] },
    },
    {
      path: '/equipe',
      name: 'Team',
      component: () => import('./views/TeamView.vue'),
      meta: { requiresAuth: true, roles: ['coordinator'] },
    },
    {
      path: '/centre-sommeil',
      name: 'CentreSommeil',
      component: () => import('./views/CentreSommeilView.vue'),
      props: { variant: 'centre' },
      meta: { requiresAuth: true, roles: ['coordinator'], establishment: 'centre' },
    },
    {
      path: '/cabinet-medical',
      name: 'CabinetMedical',
      component: () => import('./views/CentreSommeilView.vue'),
      props: { variant: 'cabinet' },
      meta: { requiresAuth: true, roles: ['coordinator'], establishment: 'cabinet' },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('./views/ProfileView.vue'),
      meta: { requiresAuth: true, roles: ['patient'] },
    },
    {
      path: '/profil-professionnel',
      name: 'ProfileProfessional',
      component: () => import('./views/ProfileProfessionalView.vue'),
      meta: { requiresAuth: true, roles: ['doctor', 'coordinator', 'technician'] },
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
  doctor: 'Patients',
}

function isAuthenticated(selfStore) {
  return !!selfStore.item?.id
}

function userRole(selfStore) {
  return selfStore.item?.role || 'patient'
}

function userRoles(selfStore) {
  const item = selfStore.item || {}
  if (Array.isArray(item.roles) && item.roles.length > 0) return item.roles
  if (item.role) return [item.role]
  return ['patient']
}

function userEstablishment(selfStore) {
  return selfStore.item?.establishment || null
}

const PROFILE_BY_ROLE = {
  patient: 'Profile',
  doctor: 'ProfileProfessional',
  coordinator: 'ProfileProfessional',
  technician: 'ProfileProfessional',
}

function profileRouteFor(role) {
  return PROFILE_BY_ROLE[role] || 'Profile'
}

function landingRouteFor(role, establishment) {
  if (role === 'coordinator') {
    if (establishment === 'centre') return 'CentreSommeil'
    if (establishment === 'cabinet') return 'CabinetMedical'
    return profileRouteFor(role)
  }
  return DASHBOARD_BY_ROLE[role] || profileRouteFor(role)
}

function hasAccess(to, selfStore) {
  if (to.meta?.guest) return true
  if (to.meta?.requiresAuth && !isAuthenticated(selfStore)) return false
  if (Array.isArray(to.meta?.roles) && to.meta.roles.length > 0) {
    const roles = userRoles(selfStore)
    if (!to.meta.roles.some((r) => roles.includes(r))) return false
  }
  if (to.meta?.establishment) {
    if (userEstablishment(selfStore) !== to.meta.establishment) return false
  }
  return true
}

router.beforeEach(async (to, from, next) => {
  const selfStore = useSelfStore()
  const authenticated = isAuthenticated(selfStore)

  if (to.name === 'Home' && authenticated) {
    const target = landingRouteFor(userRole(selfStore), userEstablishment(selfStore))
    if (target === to.name) {
      next()
      return
    }
    next({ name: target })
    return
  }

  if (to.meta?.requiresAuth && !authenticated) {
    next({ name: 'Login' })
    return
  }

  if (!hasAccess(to, selfStore)) {
    const target = landingRouteFor(userRole(selfStore), userEstablishment(selfStore))
    if (target === to.name) {
      next()
      return
    }
    next({ name: target })
    return
  }

  next()
})


export default router
