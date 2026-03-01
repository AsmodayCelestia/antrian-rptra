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
    </div>
    
    <nav class="p-3 space-y-1 flex-1">
      <!-- Admin Menu -->
      <template v-if="isAdmin">
        <router-link 
          to="/admin/dashboard" 
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-all"
          active-class="bg-blue-100 text-blue-700 font-semibold"
        >
          <span>📊</span> 
          <span>Dashboard</span>
        </router-link>
        
        <router-link 
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
      
      <!-- User Menu -->
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
    
    <div class="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
      RPTRA System v1.0
    </div>
  </aside>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  isAdmin: Boolean
})
defineEmits(['close'])
</script>