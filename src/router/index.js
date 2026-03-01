import { createRouter, createWebHistory } from 'vue-router'
import { checkSession } from '../composables/useAuth'

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
  // ⭐ PINDAH KE SINI - route publik untuk QR scan
  {
    path: '/daftar/:kuotaId',
    name: 'DaftarKuota',
    component: () => import('../pages/DaftarPage.vue'),
    props: true
  },
  {
    path: '/login',
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
        redirect: '/admin/dashboard'
      },
      // ⭐ HAPUS DARI SINI
      // {
      //   path: 'daftar/:kuotaId',
      //   name: 'DaftarKuota',
      //   component: () => import('../pages/DaftarPage.vue')
      // },
      {
        path: 'dashboard',
        component: () => import('../components/admin/Dashboard.vue')
      },
      {
        path: 'kuota',
        component: () => import('../components/admin/KuotaManager.vue')
      },
      {
        path: 'scan',
        component: () => import('../components/admin/QRScanner.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = checkSession()
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ path: '/login', replace: true })
  }
  
  if (to.meta.guestOnly && isLoggedIn) {
    return next({ path: '/admin/dashboard', replace: true })
  }
  
  next()
})

export default router