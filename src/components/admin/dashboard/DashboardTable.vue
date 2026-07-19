<template>
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[900px]">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">No Antrian</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nama</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Kartu</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Tipe Kuota</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Keterangan</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Waktu Daftar</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="item in rows" :key="item.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="font-bold text-orange-600">#{{ item.nomor_antrian?.toString().padStart(3, '0') }}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="font-medium">{{ item.nama_pemilik_atm }}</div>
              <div class="text-xs text-gray-500">{{ item.whatsapp }}</div>
            </td>
            <td class="px-4 py-3 text-sm whitespace-nowrap">{{ item.kartu_pemanfaat }}</td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
              <span :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                item.kuota_bulanan?.tipe_kuota === 'pjlp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              ]">
                {{ (item.kuota_bulanan?.tipe_kuota || 'umum').toUpperCase() }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span :class="statusClass(item.status)" class="px-2 py-1 rounded text-xs font-medium">
                {{ item.status?.toUpperCase() }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm max-w-xs">
              <div v-if="item.status === 'selesai'" class="text-green-600 font-medium text-xs">✓ Sudah ambil</div>
              <div v-else-if="item.status === 'ditolak'" class="text-red-600 text-xs">{{ item.alasan_ditolak || 'Ditolak' }}</div>
              <div v-else-if="item.status === 'terverifikasi'" class="text-blue-600 text-xs">Menunggu swipe...</div>
              <div v-else-if="item.status === 'batal'" class="text-gray-500 text-xs">Dibatalkan</div>
              <div v-else class="text-gray-400 text-xs">-</div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
              {{ formatTime(item.created_at) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-1 flex-wrap justify-center">
                <button 
                  @click="$emit('show-detail', item)"
                  class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                  title="Lihat Detail"
                >
                  👁️
                </button>
                
                <button 
                  @click="$emit('download-qr', item)"
                  class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                  title="Download QR"
                >
                  📥
                </button>
                
                <button 
                  @click="$emit('open-wa', item)"
                  class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs"
                  title="Kirim WhatsApp"
                >
                  💬
                </button>
                
                <button 
                  v-if="canEdit"
                  @click="$emit('open-edit', item)"
                  class="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1 rounded text-xs"
                  title="Edit Data"
                >
                  ✏️
                </button>
                
                <template v-if="canEdit && item.status === 'menunggu'">
                  <button 
                    @click="$emit('update-status', item.id, 'terverifikasi')"
                    class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    title="Verifikasi"
                  >
                    ✓
                  </button>
                  <button 
                    @click="$emit('show-tolak', item)"
                    class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    title="Tolak"
                  >
                    ✕
                  </button>
                </template>

                <template v-else-if="canEdit && item.status === 'terverifikasi'">
                  <span class="text-blue-600 text-xs px-2 py-1">QR Scanner →</span>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-500">
              Belum ada antrian
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white gap-4">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>Tampilkan:</span>
        <select 
          :value="perPage" 
          class="border rounded px-2 py-1 text-sm"
          @change="$emit('per-page-change', Number($event.target.value))"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span>baris</span>
      </div>

      <div class="text-sm text-gray-500">
        {{ paginationStart }} - {{ paginationEnd }} dari {{ filteredCount }} data
      </div>

      <div class="flex gap-2">
        <button 
          @click="$emit('page-change', 1)" 
          :disabled="currentPage === 1"
          class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ⟪
        </button>
        <button 
          @click="$emit('page-change', currentPage - 1)" 
          :disabled="currentPage === 1"
          class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ←
        </button>
        
        <div class="flex gap-1">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="$emit('page-change', page)"
            :class="[
              'px-3 py-1 border rounded text-sm min-w-[32px]',
              currentPage === page 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="$emit('page-change', currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          →
        </button>
        <button 
          @click="$emit('page-change', totalPages)" 
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ⟫
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatWIB } from '../../../lib/supabase'

defineProps({
  rows: Array,
  canEdit: Boolean,
  currentPage: Number,
  perPage: Number,
  totalPages: Number,
  paginationStart: Number,
  paginationEnd: Number,
  visiblePages: Array,
  filteredCount: Number
})

defineEmits([
  'show-detail', 'download-qr', 'open-wa', 'open-edit',
  'update-status', 'show-tolak', 'page-change', 'per-page-change'
])

const statusClass = (status) => ({
  'menunggu': 'bg-yellow-100 text-yellow-700',
  'terverifikasi': 'bg-blue-100 text-blue-700',
  'ditolak': 'bg-red-100 text-red-700',
  'selesai': 'bg-green-100 text-green-700',
  'batal': 'bg-gray-100 text-gray-500'
}[status])

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return formatWIB(timestamp)
}
</script>