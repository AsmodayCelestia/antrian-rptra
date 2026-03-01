<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex space-x-8 h-14 items-center">
          <router-link 
            v-for="item in menuItems" 
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center px-1 py-2 border-b-2 text-sm font-medium',
              isActive(item.path)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            <span class="mr-2">{{ item.icon }}</span>
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { path: '/admin/dashboard', name: 'Dashboard', icon: '📊' },
  { path: '/admin/scan', name: 'Scan QR', icon: '📷' }
]

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>