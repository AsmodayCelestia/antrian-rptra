<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🏠</div>
        <h1 class="text-2xl font-bold">Admin Login</h1>
        <p class="text-gray-500 text-sm mt-1">RPTRA Management System</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="admin@example.com"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
          >
        </div>
        
        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <span class="animate-spin">⏳</span> Loading...
          </span>
          <span v-else>Masuk</span>
        </button>
      </form>
      
      <p class="text-center text-xs text-gray-400 mt-6">
        Masukkan email dan password admin RPTRA Anda
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, loading, error } from '../../composables/useAuth'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const result = await login(email.value, password.value)
  
  if (result.success) {
    const redirect = route.query.redirect || '/admin/dashboard'
    router.push(redirect)
  }
}
</script>