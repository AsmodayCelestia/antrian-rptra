<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <Topbar 
      v-if="showLayout" 
      @toggle-sidebar="sidebarOpen = !sidebarOpen" 
    />
    
    <div class="flex flex-1">
      <Sidebar 
        v-if="showLayout"
        :isOpen="sidebarOpen" 
        @close="sidebarOpen = false"
        :isAdmin="isAdminRoute"
      />
      
      <main :class="['flex-1 p-6 overflow-auto', !showLayout && 'w-full']">
        <router-view />
      </main>
    </div>
    
    <Footer v-if="showLayout" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { checkSession } from './composables/useAuth'
import Topbar from './components/layout/Topbar.vue'
import Sidebar from './components/layout/Sidebar.vue'
import Footer from './components/layout/Footer.vue'

const route = useRoute()
const sidebarOpen = ref(false)

const showLayout = computed(() => route.path !== '/login')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  checkSession()
})
</script>