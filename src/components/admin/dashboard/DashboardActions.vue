<template>
  <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 class="font-bold text-gray-800">Pendaftaran Manual</h3>
        <p class="text-sm text-gray-600">Tambah pendaftar untuk warga yang membutuhkan bantuan</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button 
          @click="$emit('open-kuota')"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <span>➕</span> Tambah Manual
        </button>
        <button 
          @click="$emit('open-csv')"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <span>📤</span> Upload CSV
        </button>
        <button 
          @click="$emit('download-template')"
          class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <span>📥</span> Template
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['open-kuota', 'open-csv', 'download-template'])
</script>