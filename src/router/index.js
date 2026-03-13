import { createRouter, createWebHistory } from 'vue-router'
import { checkSession, user, canManageKuota, canViewDashboard } from '../composables/useAuth'

const routes = [
  {
    path: '/',
    component: () => import('../pages/UserView.vue'), // ⭐ Welcome + QR Scanner
    name: 'Home'
  },
  {
    path: '/daftar/:kuotaId',
    name: 'DaftarKuota',
    component: () => import('../pages/DaftarPage.vue'), // ⭐ Form pendaftaran (existing)
    props: true
  },
  {
    path: '/nomor-antrian/:id',
    component: () => import('../components/user/NomorAntrian.vue'),
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/admin/LoginForm.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/admin',
    component: () => import('../pages/AdminView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'Dashboard' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../components/admin/Dashboard.vue'),
        meta: { allowedRoles: ['admin', 'moderator', 'staff'] }
      },
      {
        path: 'kuota',
        name: 'Kuota',
        component: () => import('../components/admin/KuotaManager.vue'),
        meta: { allowedRoles: ['admin', 'moderator'] } // ⭐ Staff ga bisa akses
      },
      {
        path: 'scan',
        name: 'Scan',
        component: () => import('../components/admin/QRScanner.vue'),
        meta: { allowedRoles: ['admin', 'moderator', 'staff'] }
      }
    ]
  },
  {
    path: '/admin/didaftarkanmanualbyadmin/:kuotaId',
    name: 'AdminFormManual',
    component: () => import('../pages/AdminFormManual.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin', 'moderator'] // ⭐ Staff ga bisa manual input
    },
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ⭐ UPDATED: Role-based route protection
router.beforeEach((to, from, next) => {
  const isLoggedIn = checkSession()
  const userRole = user.value?.role
  
  // Guest only routes (login)
  if (to.meta.guestOnly && isLoggedIn) {
    return next('/admin/dashboard')
  }
  
  // Auth required routes
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  
  // ⭐ NEW: Check allowed roles
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userRole)) {
    // Staff coba akses Kuota? Redirect ke dashboard
    return next('/admin/dashboard')
  }
  
  // Legacy support: adminOnly meta
  if (to.meta.adminOnly && userRole !== 'admin') {
    return next('/admin/dashboard')
  }
  
  next()
})

export default router