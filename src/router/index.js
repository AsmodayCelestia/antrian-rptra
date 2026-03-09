import { createRouter, createWebHistory } from 'vue-router'
import { checkSession, user } from '../composables/useAuth'

const routes = [
  {
    path: '/',
    component: () => import('../pages/UserView.vue'),
    children: [
      {
        path: '',
        component: () => import('../components/user/FormPendaftaran.vue')
      },
      {
        path: 'nomor-antrian/:id',
        component: () => import('../components/user/NomorAntrian.vue'),
        props: true
      }
    ]
  },
  {
    path: '/daftar/:kuotaId',
    name: 'DaftarKuota',
    component: () => import('../pages/DaftarPage.vue'),
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
        component: () => import('../components/admin/Dashboard.vue')
      },
      {
        path: 'kuota',
        name: 'Kuota',
        component: () => import('../components/admin/KuotaManager.vue'),
        meta: { adminOnly: true }
      },
      {
        path: 'scan',
        name: 'Scan',
        component: () => import('../components/admin/QRScanner.vue')
      }
    ]
  },
  {
  path: '/admin/didaftarkanmanualbyadmin/:kuotaId',
  name: 'AdminFormManual',
  component: () => import('../pages/AdminFormManual.vue'),
  meta: { requiresAuth: true },
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

// ⭐ SIMPLIFIED: Cukup cek localStorage, tidak perlu async complex
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
  
  // Admin only routes
  if (to.meta.adminOnly && userRole !== 'admin') {
    return next('/admin/dashboard')
  }
  
  next()
})

export default router