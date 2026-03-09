<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <template v-if="authChecked">
      <Topbar 
        v-if="showLayout" 
        @toggle-sidebar="sidebarOpen = !sidebarOpen" 
      />
      
      <div class="flex flex-1">
        <!-- ⭐ FIX: Sidebar hanya muncul kalau authenticated DAN punya role -->
        <Sidebar 
          v-if="showLayout && (isAuthenticated || userRole)"
          :isOpen="sidebarOpen" 
          @close="sidebarOpen = false"
          :userRole="userRole"
        />
        
        <main :class="['flex-1 p-6 overflow-auto', !showLayout && 'w-full']">
          <router-view />
        </main>
      </div>
      
      <Footer v-if="showLayout" />
    </template>
    
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin text-4xl mb-4">⏳</div>
        <p>Memuat...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkSession, user } from './composables/useAuth'
import Topbar from './components/layout/Topbar.vue'
import Sidebar from './components/layout/Sidebar.vue'
import Footer from './components/layout/Footer.vue'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const authChecked = ref(false)

const showLayout = computed(() => route.path !== '/login')

// ⭐ FIX: Computed yang reactive ke user ref
const isAuthenticated = computed(() => !!user.value)
const userRole = computed(() => user.value?.role || null)

// ⭐ WATCH: Debug untuk lihat perubahan
watch(user, (newVal) => {
  console.log('User changed:', newVal)
}, { immediate: true })

watch(userRole, (newVal) => {
  console.log('UserRole changed:', newVal)
}, { immediate: true })

onMounted(async () => {
  console.log('App mounted, checking session...')
  const hasSession = checkSession()
  console.log('Has session:', hasSession)
  console.log('User after check:', user.value)
  
  if (route.meta.requiresAuth && !hasSession) {
    router.push('/login')
  }
  
  await new Promise(resolve => setTimeout(resolve, 50))
  authChecked.value = true
  console.log('Auth checked complete')
})
</script>