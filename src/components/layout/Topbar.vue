<template>
  <header class="bg-blue-600 text-white h-16 flex items-center px-4 shadow-md sticky top-0 z-20">
    <button 
      @click="$emit('toggle-sidebar')" 
      class="p-2 hover:bg-blue-700 rounded-lg lg:hidden"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
    
    <h1 class="ml-4 text-xl font-bold truncate">Program Pangan Bersubsidi - RPTRA</h1>
    
    <div class="ml-auto flex items-center gap-4">
      <span v-if="user" class="text-sm hidden sm:block">{{ user.email }}</span>
      <button 
        v-if="user" 
        @click="handleLogout"
        class="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg"
      >
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { user, logout } from '../../composables/useAuth'
import { useRouter } from 'vue-router'

const router = useRouter()
defineEmits(['toggle-sidebar'])

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>