<template>
  <div class="bg-white rounded-xl shadow-lg p-4 mb-6">
    <div class="flex flex-wrap gap-4 items-end">
      <!-- Filter Tipe Kuota -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Kuota</label>
        <select 
          :value="tipeKuota"
          @change="$emit('update:tipeKuota', $event.target.value)"
          class="border rounded-lg px-3 py-2 bg-white min-w-[150px]"
        >
          <option value="all">Semua Tipe</option>
          <option value="umum">Umum</option>
          <option value="pjlp">PJLP</option>
        </select>
      </div>

      <!-- Filter Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          :value="status"
          @change="$emit('update:status', $event.target.value)"
          class="border rounded-lg px-3 py-2 bg-white min-w-[150px]"
        >
          <option value="all">Semua Status</option>
          <option value="menunggu">⏳ Menunggu</option>
          <option value="terverifikasi">✓ Terverifikasi</option>
          <option value="selesai">✅ Selesai</option>
          <option value="ditolak">❌ Ditolak</option>
          <option value="batal">🚫 Batal</option>
        </select>
      </div>

      <!-- Filter Bulan -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
        <select 
          :value="bulan"
          @change="$emit('update:bulan', Number($event.target.value))"
          class="border rounded-lg px-3 py-2 bg-white min-w-[150px]"
        >
          <option v-for="m in 12" :key="m" :value="m">{{ months[m-1] }} {{ tahun }}</option>
        </select>
      </div>

      <!-- Filter Tahun -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
        <select 
          :value="tahun"
          @change="$emit('update:tahun', Number($event.target.value))"
          class="border rounded-lg px-3 py-2 bg-white min-w-[100px]"
        >
          <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <!-- Filter Kartu -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kartu</label>
        <select 
          :value="kartu"
          @change="$emit('update:kartu', $event.target.value)"
          class="border rounded-lg px-3 py-2 bg-white min-w-[180px]"
        >
          <option value="">Semua Kartu</option>
          <option v-for="k in kartuOptions" :key="k" :value="k">{{ k }}</option>
        </select>
      </div>

      <!-- Search KK/ATM -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 mb-1">Cari Nama / KK / ATM</label>
        <div class="relative">
          <input 
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            type="text"
            placeholder="Nama, nomor KK, atau nomor ATM..."
            class="w-full border rounded-lg px-3 py-2 pl-9"
            maxlength="50"
          >
          <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <!-- Reset & Export Excel -->
      <div class="flex gap-2">
        <button 
          @click="$emit('reset')"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
        >
          Reset
        </button>
        <button 
          v-if="canEdit"
          @click="$emit('export')"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📊</span> Export Excel
        </button>
      </div>
    </div>
    
    <p class="text-sm text-gray-500 mt-3">
      Menampilkan {{ paginatedCount }} dari {{ filteredCount }} data 
      <span v-if="search">(filter pencarian aktif)</span>
      <span v-if="tipeKuota !== 'all'"> | Tipe: {{ tipeKuota.toUpperCase() }}</span>
      <span v-if="status !== 'all'"> | Status: {{ status.toUpperCase() }}</span>
    </p>
  </div>
</template>

<script setup>
defineProps({
  tipeKuota: String,
  status: String,
  bulan: Number,
  tahun: Number,
  kartu: String,
  search: String,
  months: Array,
  tahunOptions: Array,
  kartuOptions: Array,
  canEdit: Boolean,
  paginatedCount: Number,
  filteredCount: Number
})

defineEmits([
  'update:tipeKuota', 'update:status', 'update:bulan', 
  'update:tahun', 'update:kartu', 'update:search',
  'reset', 'export'
])
</script>