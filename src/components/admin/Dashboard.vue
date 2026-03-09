<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500 text-sm">Kelola antrian dan kuota</p>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-full text-sm font-medium"
          :class="isModerator ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
        >
          {{ isModerator ? '👑 Moderator' : '🏠 Admin' }}
        </span>
        <span v-if="!isModerator && user?.rptra" class="text-sm text-gray-500">
          {{ user.rptra.nama }}
        </span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
        <p class="text-gray-500 text-sm">Total Antrian</p>
        <p class="text-2xl font-bold text-gray-800">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
        <p class="text-gray-500 text-sm">Menunggu</p>
        <p class="text-2xl font-bold text-yellow-600">{{ stats.menunggu }}</p>
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

    <!-- Tombol Tambah Manual -->
    <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-gray-800">Pendaftaran Manual</h3>
          <p class="text-sm text-gray-600">Tambah pendaftar untuk warga yang membutuhkan bantuan</p>
        </div>
        <button 
          @click="openPilihKuotaModal"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <span>➕</span> Tambah Manual
        </button>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Filter Bulan -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
          <select 
            v-model="filterBulan"
            class="border rounded-lg px-3 py-2 bg-white min-w-[150px]"
          >
            <option v-for="m in 12" :key="m" :value="m">{{ months[m-1] }} {{ filterTahun }}</option>
          </select>
        </div>

        <!-- Filter Tahun -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
          <select 
            v-model="filterTahun"
            class="border rounded-lg px-3 py-2 bg-white min-w-[100px]"
          >
            <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Filter Kartu -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kartu</label>
          <select 
            v-model="filterKartu"
            class="border rounded-lg px-3 py-2 bg-white min-w-[180px]"
          >
            <option value="">Semua Kartu</option>
            <option v-for="k in kartuOptions" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>

        <!-- Search KK/ATM -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Cari KK / ATM</label>
          <div class="relative">
            <input 
              v-model="searchKKATM"
              type="text"
              placeholder="Masukkan nomor..."
              class="w-full border rounded-lg px-3 py-2 pl-9"
              maxlength="16"
            >
            <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <!-- Reset & Print -->
        <div class="flex gap-2">
          <button 
            @click="resetFilters"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Reset
          </button>
          <button 
            @click="printTable"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>🖨️</span> Print
          </button>
        </div>
      </div>
      
      <p class="text-sm text-gray-500 mt-3">
        Menampilkan {{ paginatedRows.length }} dari {{ filteredRows.length }} data 
        <span v-if="searchKKATM">(filter pencarian aktif)</span>
      </p>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">No Antrian</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nama</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Kartu</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Keterangan</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Waktu Daftar</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in paginatedRows" :key="item.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="font-bold text-blue-600">#{{ item.nomor_antrian?.toString().padStart(3, '0') }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium">{{ item.nama_pemilik_atm }}</div>
                <div class="text-xs text-gray-500">{{ item.whatsapp }}</div>
              </td>
              <td class="px-4 py-3 text-sm whitespace-nowrap">{{ item.kartu_pemanfaat }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span :class="statusClass(item.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ item.status?.toUpperCase() }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm max-w-xs">
                <div v-if="item.status === 'selesai'" class="text-green-600 font-medium text-xs">✓ Sudah ambil</div>
                <div v-else-if="item.status === 'ditolak'" class="text-red-600 text-xs">{{ item.alasan_ditolak || 'Ditolak' }}</div>
                <div v-else-if="item.status === 'batal'" class="text-gray-500 text-xs">Dibatalkan</div>
                <div v-else class="text-gray-400 text-xs">-</div>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                {{ formatTime(item.created_at) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-1 flex-wrap justify-center">
                  <button 
                    @click="showDetail(item)"
                    class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                    title="Lihat Detail"
                  >
                    👁️
                  </button>
                  <button 
                    @click="downloadQR(item)"
                    class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                    title="Download QR"
                  >
                    📥
                  </button>
                  <template v-if="item.status === 'menunggu'">
                    <button 
                      @click="updateStatus(item.id, 'selesai')"
                      class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      ✓
                    </button>
                    <button 
                      @click="showTolakModal(item)"
                      class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedRows.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                Belum ada antrian
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination & Rows Per Page -->
      <div class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white gap-4">
        <!-- Rows Per Page -->
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Tampilkan:</span>
          <select 
            v-model="perPage" 
            class="border rounded px-2 py-1 text-sm"
            @change="currentPage = 1"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span>baris</span>
        </div>

        <!-- Pagination Info -->
        <div class="text-sm text-gray-500">
          {{ paginationStart }} - {{ paginationEnd }} dari {{ filteredRows.length }} data
        </div>

        <!-- Page Navigation -->
        <div class="flex gap-2">
          <button 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ⟪
          </button>
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ←
          </button>
          
          <div class="flex gap-1">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              @click="currentPage = page"
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
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            →
          </button>
          <button 
            @click="currentPage = totalPages" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ⟫
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Pilih Kuota -->
    <div v-if="showPilihKuota" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div class="bg-purple-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h3 class="text-xl font-bold">Pilih Periode Pendaftaran</h3>
          <button @click="closePilihKuota" class="text-white hover:bg-purple-700 p-2 rounded-lg">✕</button>
        </div>

        <div class="p-6">
          <div v-if="loadingKuotaList" class="text-center py-8">
            <div class="animate-spin text-2xl mb-2">⏳</div>
            <p class="text-gray-500 text-sm">Memuat kuota...</p>
          </div>

          <div v-else-if="kuotaList.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📭</div>
            <p>Belum ada kuota tersedia</p>
          </div>

          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div 
              v-for="k in kuotaList" 
              :key="k.id"
              @click="pilihKuota(k)"
              class="border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-purple-500 hover:bg-purple-50"
              :class="selectedKuota?.id === k.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-gray-800">{{ formatMonthYear(k.bulan, k.tahun) }}</h4>
                  <p class="text-sm text-gray-500">{{ k.rptra?.nama }}</p>
                </div>
                <span 
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="k.dibuka ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ k.dibuka ? 'Dibuka' : 'Ditutup' }}
                </span>
              </div>
              
              <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div class="bg-gray-100 rounded p-2">
                  <p class="text-gray-500 text-xs">Kuota</p>
                  <p class="font-bold">{{ k.kuota }}</p>
                </div>
                <div class="bg-blue-50 rounded p-2">
                  <p class="text-gray-500 text-xs">Terdaftar</p>
                  <p class="font-bold text-blue-600">{{ k.terdaftar || 0 }}</p>
                </div>
                <div 
                  class="rounded p-2"
                  :class="(k.kuota - (k.terdaftar || 0)) <= 0 ? 'bg-red-100' : 'bg-green-100'"
                >
                  <p class="text-gray-500 text-xs">Sisa</p>
                  <p :class="(k.kuota - (k.terdaftar || 0)) <= 0 ? 'text-red-600' : 'text-green-600'">
                    {{ k.kuota - (k.terdaftar || 0) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="closePilihKuota" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg">Batal</button>
            <button 
              @click="lanjutKeForm"
              :disabled="!selectedKuota || (selectedKuota.kuota - (selectedKuota.terdaftar || 0)) <= 0"
              class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2 rounded-lg font-medium"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Detail -->
    <div v-if="detailItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">Detail Pendaftaran</h3>
            <p class="text-blue-100 text-sm">Nomor Antrian #{{ detailItem.nomor_antrian }}</p>
          </div>
          <button @click="closeDetail" class="text-white hover:bg-blue-700 p-2 rounded-lg">✕</button>
        </div>

        <div class="p-6 space-y-6">
          <div class="flex items-center gap-3">
            <span :class="statusClass(detailItem.status)" class="px-3 py-1 rounded-full text-sm font-medium">
              {{ detailItem.status.toUpperCase() }}
            </span>
            <span class="text-gray-500 text-sm">Terdaftar: {{ formatTime(detailItem.created_at) }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3">👤 Data Pribadi</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-500">Nama:</span><span class="font-medium">{{ detailItem.nama_pemilik_atm }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Email:</span><span class="font-medium">{{ detailItem.email || '-' }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">WhatsApp:</span><span class="font-medium">{{ detailItem.whatsapp }}</span></div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3">🏠 Alamat & Kartu</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-500">Kelurahan:</span><span class="font-medium">{{ detailItem.kelurahan }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">RT/RW:</span><span class="font-medium">RT {{ detailItem.rt }} / RW {{ detailItem.rw }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Kartu:</span><span class="font-medium">{{ detailItem.kartu_pemanfaat }}</span></div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 md:col-span-2">
              <h4 class="font-bold text-gray-800 mb-3">📍 Alamat Lengkap</h4>
              <p class="text-sm">{{ detailItem.alamat }}</p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3">🪪 Nomor Kartu</h4>
              <div class="space-y-2 text-sm">
                <div><span class="text-gray-500 block text-xs">Nomor KK:</span><span class="font-medium font-mono text-lg tracking-wider">{{ detailItem.nomor_kk }}</span></div>
                <div><span class="text-gray-500 block text-xs">Nomor ATM:</span><span class="font-medium font-mono text-lg tracking-wider">{{ detailItem.nomor_atm }}</span></div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3">ℹ️ Info Tambahan</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-500">RPTRA:</span><span class="font-medium">{{ detailItem.rptra?.nama || '-' }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Periode:</span><span class="font-medium">{{ formatMonthYearFromItem(detailItem) }}</span></div>
                <div v-if="detailItem.alasan_ditolak" class="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                  <span class="font-semibold">Alasan Ditolak:</span><br>{{ detailItem.alasan_ditolak }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t">
            <button @click="downloadQR(detailItem)" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2">📥 Download QR</button>
            <button v-if="detailItem.status === 'menunggu'" @click="updateStatus(detailItem.id, 'selesai'); closeDetail()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">✓ Verifikasi</button>
            <button v-if="detailItem.status === 'menunggu'" @click="showTolakModal(detailItem); closeDetail()" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">✕ Tolak</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Tolak -->
    <div v-if="showTolakItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-red-600 mb-2">Tolak Pendaftaran</h3>
        <p class="text-gray-600 text-sm mb-4">Nomor #{{ showTolakItem.nomor_antrian }} - {{ showTolakItem.nama_pemilik_atm }}</p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan <span class="text-red-500">*</span></label>
          <select v-model="alasanTolak" class="w-full border rounded-lg px-3 py-2 bg-white">
            <option value="" disabled>Pilih alasan</option>
            <option value="Bukan warga Pademangan Timur">Bukan warga Pademangan Timur</option>
            <option value="KK sudah pernah daftar">KK sudah pernah daftar</option>
            <option value="Data KK tidak valid">Data KK tidak valid</option>
            <option value="Kartu pemanfaat tidak valid">Kartu pemanfaat tidak valid</option>
            <option value="Tidak membawa dokumen lengkap">Tidak membawa dokumen lengkap</option>
            <option value="Nomor antrian hangus">Nomor antrian hangus</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <textarea v-if="alasanTolak === 'Lainnya'" v-model="alasanLainnya" rows="2" class="w-full border rounded-lg px-3 py-2 mt-2" placeholder="Sebutkan alasan..."></textarea>
        </div>

        <div class="flex gap-3">
          <button @click="closeTolakModal" class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg">Batal</button>
          <button @click="submitTolak" :disabled="!alasanTolak || (alasanTolak === 'Lainnya' && !alasanLainnya)" class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg">Tolak</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { user, isModerator } from '../../composables/useAuth'
import { getAllAntrian, updateStatusAntrian, getKuotaAktif } from '../../composables/useAntrian'
import { getAllKuota } from '../../composables/useKuota'
import QRCode from 'qrcode'

const router = useRouter()

// Data
const antrianList = ref([])
const kuotaAktif = ref(null)

// Filter State - Default bulan & tahun sekarang
const now = new Date()
const filterBulan = ref(now.getMonth() + 1)
const filterTahun = ref(now.getFullYear())
const filterKartu = ref('')
const searchKKATM = ref('')

// Pagination State - Default 20
const currentPage = ref(1)
const perPage = ref(20)

// Options
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})
const kartuOptions = ['KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta', 'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS']

// Computed: Filtered Rows (Semua data yang difilter, untuk print dan stats)
const filteredRows = computed(() => {
  let result = [...antrianList.value]
  
  // Filter bulan/tahun dari created_at
  result = result.filter(item => {
    const date = new Date(item.created_at)
    return date.getMonth() + 1 === filterBulan.value && date.getFullYear() === filterTahun.value
  })
  
  // Filter kartu
  if (filterKartu.value) {
    result = result.filter(item => item.kartu_pemanfaat === filterKartu.value)
  }
  
  // Search KK/ATM (partial match, hanya angka)
  if (searchKKATM.value) {
    const q = searchKKATM.value.replace(/\D/g, '')
    if (q.length > 0) {
      result = result.filter(item => 
        (item.nomor_kk && item.nomor_kk.includes(q)) || 
        (item.nomor_atm && item.nomor_atm.includes(q))
      )
    }
  }
  
  return result
})

// Computed: Paginated Rows (Data yang ditampilkan di table dengan pagination)
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

// Computed: Pagination Meta
const totalPages = computed(() => Math.ceil(filteredRows.value.length / perPage.value) || 1)
const paginationStart = computed(() => filteredRows.value.length > 0 ? (currentPage.value - 1) * perPage.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * perPage.value, filteredRows.value.length))

// Computed: Visible Page Numbers (max 5 buttons)
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Stats
const stats = computed(() => ({
  total: filteredRows.value.length,
  menunggu: filteredRows.value.filter(d => d.status === 'menunggu').length,
  ditolak: filteredRows.value.filter(d => d.status === 'ditolak').length,
  selesai: filteredRows.value.filter(d => d.status === 'selesai').length
}))

// Watch: Reset page when filter change
watch([filterBulan, filterTahun, filterKartu, searchKKATM], () => {
  currentPage.value = 1
})

// Modal States
const showPilihKuota = ref(false)
const kuotaList = ref([])
const loadingKuotaList = ref(false)
const selectedKuota = ref(null)
const detailItem = ref(null)
const showTolakItem = ref(null)
const alasanTolak = ref('')
const alasanLainnya = ref('')

// Print - CARA 2: window.open()
// const printTable = () => {
//   // Generate HTML untuk print dengan informasi lengkap
//   const printWindow = window.open('', '_blank', 'width=1400,height=800')
  
//   const rowsHtml = filteredRows.value.map((item, index) => `
//     <tr style="page-break-inside: avoid;">
//       <td style="border:1px solid #000;padding:6px;text-align:center;vertical-align:top;">
//         <strong>#${item.nomor_antrian?.toString().padStart(3, '0')}</strong>
//       </td>
//       <td style="border:1px solid #000;padding:6px;vertical-align:top;">
//         <div style="font-weight:bold;font-size:11px;">${item.nama_pemilik_atm}</div>
//         <div style="font-size:9px;color:#666;">WA: ${item.whatsapp}</div>
//         <div style="font-size:9px;color:#666;">Email: ${item.email || '-'}</div>
//       </td>
//       <td style="border:1px solid #000;padding:6px;vertical-align:top;">
//         <div style="font-size:10px;">${item.kartu_pemanfaat}</div>
//       </td>
//       <td style="border:1px solid #000;padding:6px;vertical-align:top;font-family:monospace;font-size:10px;">
//         <div><strong>KK:</strong> ${item.nomor_kk}</div>
//         <div style="margin-top:2px;"><strong>ATM:</strong> ${item.nomor_atm}</div>
//       </td>
//       <td style="border:1px solid #000;padding:6px;vertical-align:top;font-size:9px;">
//         <div style="font-weight:bold;">${item.kelurahan}</div>
//         <div>RT ${item.rt} / RW ${item.rw}</div>
//         <div style="margin-top:2px;color:#555;word-break:break-word;">${item.alamat}</div>
//       </td>
//       <td style="border:1px solid #000;padding:6px;text-align:center;vertical-align:top;">
//         <span style="font-size:10px;font-weight:bold;text-transform:uppercase;
//           ${item.status === 'selesai' ? 'color:#059669;' : ''}
//           ${item.status === 'ditolak' ? 'color:#dc2626;' : ''}
//           ${item.status === 'menunggu' ? 'color:#d97706;' : ''}
//           ${item.status === 'batal' ? 'color:#6b7280;' : ''}
//         ">
//           ${item.status?.toUpperCase()}
//         </span>
//         ${item.status === 'ditolak' ? `<div style="font-size:8px;color:#dc2626;margin-top:2px;">${item.alasan_ditolak}</div>` : ''}
//       </td>
//       <td style="border:1px solid #000;padding:6px;font-size:9px;vertical-align:top;">
//         ${formatTime(item.created_at)}
//       </td>
//     </tr>
//   `).join('')

//   const html = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>Laporan Antrian Lengkap - ${months[filterBulan.value - 1]} ${filterTahun.value}</title>
//         <style>
//           @page { size: landscape; margin: 8mm; }
//           body { font-family: Arial, sans-serif; font-size: 10px; margin: 15px; }
//           h1 { text-align: center; margin-bottom: 5px; font-size: 16px; }
//           .subtitle { text-align: center; color: #666; margin-bottom: 5px; font-size: 12px; }
//           .meta { text-align: center; font-size: 9px; color: #999; margin-bottom: 15px; }
//           table { width: 100%; border-collapse: collapse; }
//           th { background-color: #f3f4f6; font-weight: bold; text-align: center; font-size: 9px; padding: 6px; }
//           tr:nth-child(even) { background-color: #f9fafb; }
//           .total { text-align: right; margin-top: 10px; font-size: 10px; color: #666; font-weight: bold; }
//           .rptra-info { text-align: center; font-size: 11px; color: #444; margin-bottom: 10px; }
//         </style>
//       </head>
//       <body onload="window.print(); setTimeout(() => window.close(), 500);">
//         <h1>LAPORAN ANTRIAN RPTRA - DATA LENGKAP</h1>
//         <div class="subtitle">
//           Periode: ${months[filterBulan.value - 1]} ${filterTahun.value}
//           ${filterKartu.value ? ` | Filter Kartu: ${filterKartu.value}` : ''}
//           ${searchKKATM.value ? ` | Pencarian: ${searchKKATM.value}` : ''}
//         </div>
//         <div class="rptra-info">
//           ${!isModerator.value && user.value?.rptra ? `RPTRA: ${user.value.rptra.nama}` : 'Semua RPTRA (Moderator)'}
//         </div>
//         <div class="meta">Dicetak: ${new Date().toLocaleString('id-ID')} | Total Data: ${filteredRows.value.length}</div>
        
//         <table>
//           <thead>
//             <tr>
//               <th style="border:1px solid #000;width:60px;">No Antrian</th>
//               <th style="border:1px solid #000;width:150px;">Data Pribadi</th>
//               <th style="border:1px solid #000;width:120px;">Kartu Pemanfaat</th>
//               <th style="border:1px solid #000;width:140px;">Nomor Kartu<br>(KK / ATM)</th>
//               <th style="border:1px solid #000;width:200px;">Alamat Lengkap<br>(Kelurahan, RT/RW)</th>
//               <th style="border:1px solid #000;width:80px;">Status</th>
//               <th style="border:1px solid #000;width:100px;">Waktu Daftar</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${rowsHtml}
//           </tbody>
//         </table>
        
//         <div class="total">
//           Total Data: ${filteredRows.value.length} | 
//           Menunggu: ${filteredRows.value.filter(d => d.status === 'menunggu').length} | 
//           Selesai: ${filteredRows.value.filter(d => d.status === 'selesai').length} | 
//           Ditolak: ${filteredRows.value.filter(d => d.status === 'ditolak').length}
//         </div>
//       </body>
//     </html>
//   `
  
//   printWindow.document.write(html)
//   printWindow.document.close()
// }

const printTable = () => {
  // Header
  const headers = [
    'No Antrian',
    'Nama Pemilik ATM',
    'Email',
    'WhatsApp',
    'Nomor KK',
    'Nomor ATM',
    'Kelurahan',
    'RT',
    'RW',
    'Alamat Lengkap',
    'Kartu Pemanfaat',
    'Status',
    'Alasan Ditolak',
    'Waktu Daftar',
    'RPTRA'
  ]
  
  // Rows
  const rows = filteredRows.value.map(item => [
    `#${item.nomor_antrian?.toString().padStart(3, '0')}`,
    item.nama_pemilik_atm,
    item.email || '',
    item.whatsapp,
    item.nomor_kk,
    item.nomor_atm,
    item.kelurahan,
    item.rt,
    item.rw,
    item.alamat,
    item.kartu_pemanfaat,
    item.status,
    item.alasan_ditolak || '',
    formatTime(item.created_at),
    item.rptra?.nama || ''
  ])
  
  // Combine
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n')
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Laporan_Antrian_${months[filterBulan.value - 1]}_${filterTahun.value}.csv`
  link.click()
}

// Print Title (untuk reference)
const printTitle = computed(() => {
  const parts = [`${months[filterBulan.value - 1]} ${filterTahun.value}`]
  if (filterKartu.value) parts.push(filterKartu.value)
  if (searchKKATM.value) parts.push(`Pencarian: ${searchKKATM.value}`)
  return parts.join(' | ')
})

const resetFilters = () => {
  const n = new Date()
  filterBulan.value = n.getMonth() + 1
  filterTahun.value = n.getFullYear()
  filterKartu.value = ''
  searchKKATM.value = ''
  currentPage.value = 1
}

// Helpers
const statusClass = (status) => ({
  'menunggu': 'bg-yellow-100 text-yellow-700',
  'ditolak': 'bg-red-100 text-red-700',
  'selesai': 'bg-green-100 text-green-700',
  'batal': 'bg-gray-100 text-gray-500'
}[status])

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const wibTime = new Date(date.getTime() + (7 * 60 * 60 * 1000))
  return wibTime.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  }) + ' WIB'
}

const formatMonthYear = (bulan, tahun) => {
  return `${months[bulan - 1]} ${tahun}`
}

const formatMonthYearFromItem = (item) => {
  if (!item.kuota_bulanan) return '-'
  return formatMonthYear(item.kuota_bulanan.bulan, item.kuota_bulanan.tahun)
}

// Actions
const fetchAntrian = async () => {
  try {
    const [antrian, kuota] = await Promise.all([
      getAllAntrian(),
      getKuotaAktif(user.value?.rptra_id)
    ])
    antrianList.value = antrian
    kuotaAktif.value = kuota
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

const openPilihKuotaModal = async () => {
  showPilihKuota.value = true
  loadingKuotaList.value = true
  selectedKuota.value = null
  try {
    const result = await getAllKuota(user.value?.rptra_id)
    kuotaList.value = (result || []).sort((a, b) => {
      const sisaA = a.kuota - (a.terdaftar || 0)
      const sisaB = b.kuota - (b.terdaftar || 0)
      if (sisaA > 0 && sisaB <= 0) return -1
      if (sisaA <= 0 && sisaB > 0) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  } catch (err) {
    alert('Gagal memuat kuota')
  } finally {
    loadingKuotaList.value = false
  }
}

const closePilihKuota = () => {
  showPilihKuota.value = false
  selectedKuota.value = null
}

const pilihKuota = (k) => { selectedKuota.value = k }

const lanjutKeForm = () => {
  if (!selectedKuota.value) return
  router.push(`/admin/didaftarkanmanualbyadmin/${selectedKuota.value.id}`)
}

const showDetail = (item) => { detailItem.value = { ...item } }
const closeDetail = () => { detailItem.value = null }

const downloadQR = async (item) => {
  try {
    const qrData = JSON.stringify({ nomor: item.nomor_antrian, kuota_id: item.kuota_id })
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, qrData, { width: 400, margin: 2 })
    const link = document.createElement('a')
    link.download = `QR-${item.nomor_antrian.toString().padStart(3, '0')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    alert('Gagal generate QR')
  }
}

const updateStatus = async (id, status) => {
  try {
    await updateStatusAntrian(id, status)
    await fetchAntrian()
  } catch (err) {
    alert('Gagal update status')
  }
}

const showTolakModal = (item) => {
  showTolakItem.value = item
  alasanTolak.value = ''
  alasanLainnya.value = ''
}

const closeTolakModal = () => {
  showTolakItem.value = null
  alasanTolak.value = ''
  alasanLainnya.value = ''
}

const submitTolak = async () => {
  if (!showTolakItem.value) return
  const alasan = alasanTolak.value === 'Lainnya' ? alasanLainnya.value : alasanTolak.value
  try {
    await updateStatusAntrian(showTolakItem.value.id, 'ditolak', alasan)
    closeTolakModal()
    await fetchAntrian()
  } catch (err) {
    alert('Gagal menolak')
  }
}

onMounted(fetchAntrian)
</script>