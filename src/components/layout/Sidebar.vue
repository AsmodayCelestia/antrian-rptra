<template>
  <div 
    v-if="isOpen" 
    @click="$emit('close')"
    class="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
  />
  
  <aside 
    :class="[
      'fixed lg:static inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col',
      'transition-transform duration-300 ease-in-out z-40',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div class="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
      <h2 class="font-bold text-gray-800 text-lg">Menu Navigasi</h2>
      <p v-if="userRole" class="text-xs text-gray-500 mt-1">
        Role: <span class="font-semibold" :class="roleBadgeClass">{{ userRole.toUpperCase() }}</span>
        <span v-if="user?.rptra?.nama"> | {{ user.rptra.nama }}</span>
      </p>
    </div>
    
    <nav class="p-3 space-y-1 flex-1">
      <!-- ⭐ SEMUA ROLE (admin, moderator, staff) bisa akses dashboard & scan -->
      <template v-if="canViewDashboard">
        <router-link 
          to="/admin/dashboard" 
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-all"
          active-class="bg-blue-100 text-blue-700 font-semibold"
        >
          <span>📊</span> 
          <span>Dashboard</span>
        </router-link>
        
        <!-- ⭐ HANYA admin & moderator bisa lihat Kuota Manager -->
        <router-link 
          v-if="canManageKuota"
          to="/admin/kuota" 
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-all"
          active-class="bg-blue-100 text-blue-700 font-semibold"
        >
          <span>📅</span> 
          <span>Manajemen Kuota</span>
        </router-link>
        
        <router-link 
          to="/admin/scan" 
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-all"
          active-class="bg-blue-100 text-blue-700 font-semibold"
        >
          <span>📷</span> 
          <span>Scan QR</span>
        </router-link>
      </template>
      
      <!-- User Menu (non-admin) -->
      <template v-else>
        <router-link 
          to="/" 
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-all"
          active-class="bg-blue-100 text-blue-700 font-semibold"
        >
          <span>📝</span> 
          <span>Ambil Antrian</span>
        </router-link>
      </template>
    </nav>
    
    <!-- User Info & Logout -->
    <div class="p-4 border-t border-gray-100">
      <div v-if="user" class="mb-3 text-sm">
        <p class="font-medium text-gray-800">{{ user.nama }}</p>
        <p class="text-xs text-gray-500">{{ user.email }}</p>
      </div>
      <button 
        @click="logout"
        class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        🚪 Logout
      </button>
    </div>
    
    <div class="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
      RPTRA System v1.0
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { user, canViewDashboard, canManageKuota, logout } from '../../composables/useAuth'

const props = defineProps({
  isOpen: Boolean
})

defineEmits(['close'])

const userRole = computed(() => user.value?.role || null)

const roleBadgeClass = computed(() => {
  const role = user.value?.role
  if (role === 'admin') return 'text-blue-600'
  if (role === 'moderator') return 'text-purple-600'
  if (role === 'staff') return 'text-green-600'
  return 'text-gray-600'
})
</script>