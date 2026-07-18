<template>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p class="text-gray-500 text-sm">Kelola antrian dan kuota</p>
    </div>
    
    <div class="flex items-center gap-3">
      <span class="px-3 py-1 rounded-full text-sm font-medium"
        :class="{
          'bg-purple-100 text-purple-700': isModerator,
          'bg-blue-100 text-blue-700': isAdmin,
          'bg-green-100 text-green-700': isStaff
        }"
      >
        {{ isModerator ? '👑 Moderator' : isAdmin ? '🏠 Admin' : '👷 Staff' }}
      </span>
      <span v-if="user?.rptra" class="text-sm text-gray-500">
        {{ user.rptra.nama }}
      </span>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
      <p class="text-gray-500 text-sm">Total Antrian</p>
      <p class="text-2xl font-bold text-gray-800">{{ stats.total }}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
      <p class="text-gray-500 text-sm">Menunggu</p>
      <p class="text-2xl font-bold text-yellow-600">{{ stats.menunggu }}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
      <p class="text-gray-500 text-sm">Terverifikasi</p>
      <p class="text-2xl font-bold text-blue-600">{{ stats.terverifikasi }}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
      <p class="text-gray-500 text-sm">Ditolak</p>
      <p class="text-2xl font-bold text-red-600">{{ stats.ditolak }}</p>
    </div>
    <div class="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
      <p class="text-gray-500 text-sm">Selesai</p>
      <p class="text-2xl font-bold text-green-600">{{ stats.selesai }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: Object,
  isModerator: Boolean,
  isAdmin: Boolean,
  isStaff: Boolean,
  stats: Object
})
</script>