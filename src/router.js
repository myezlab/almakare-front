import { getAuth, onAuthStateChanged } from "firebase/auth"
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
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./views/DashboardView.vue'),
      meta: { requiresAuth: true },
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

async function isAuthenticated() {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (userMetaData) => {
        removeListener()
        resolve(!!(userMetaData && userMetaData.uid))
      },
      reject
    )
  })
}

async function isAdmin() {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      async (userMetaData) => {
        removeListener()
        if (!userMetaData) return resolve(false)
        resolve((await userMetaData.getIdTokenResult()).claims["isAdmin"])
      },
      reject
    )
  })
}

let isFirstNavigation = true

router.beforeEach(async (to, from, next) => {
  const firstNav = isFirstNavigation
  isFirstNavigation = false

  // Redirect invalid locations (e.g., empty path) to Home
  if (!to.path || !to.matched.length) {
    return next({ name: 'Home' })
  }

  const authenticated = await isAuthenticated()

  // Guest-only routes: redirect authenticated users to their default page
  if (to.meta.guest) {
    if (authenticated) {
      // On first navigation, restore last visited page if available
      if (firstNav) {
        const lastPath = localStorage.getItem('lastVisitedPath')
        if (lastPath) return next(lastPath)
      }
      if (await isAdmin()) return next({ name: 'Dashboard' })
    }
    return next()
  }

  // Protected routes: must be authenticated
  if (to.meta.requiresAuth) {
    if (!authenticated) return next({ name: 'Home' })

    // If specific roles are required, check them
    if (to.meta.roles) {
      if (to.meta.roles.includes('admin') && await isAdmin()) return next()
      // User is authenticated but lacks the required role
      if (await isAdmin()) return next({ name: 'Dashboard' })
    }

    // No specific roles required — any authenticated user can access
    return next()
  }

  // Allow navigation to all other routes
  next()
})

// Save last visited authenticated route to localStorage
router.afterEach((to) => {
  if (to.meta.requiresAuth) {
    localStorage.setItem('lastVisitedPath', to.fullPath)
  }
})

export default router
