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

        <!-- Reset & Export Excel -->
        <div class="flex gap-2">
          <button 
            @click="resetFilters"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Reset
          </button>
          <button 
            @click="downloadExcel"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>📊</span> Export Excel
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
import * as XLSX from 'xlsx'
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

// ⭐ EXPORT EXCEL DENGAN STYLING
const downloadExcel = () => {
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // ==================== SHEET 1: DATA LENGKAP ====================
  
  // Header info rows
  const headerRows = [
    ['LAPORAN ANTRIAN RPTRA - DATA LENGKAP'],
    [''],
    [`Periode: ${months[filterBulan.value - 1]} ${filterTahun.value}`],
    [`RPTRA: ${!isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'}`],
    [`Dicetak: ${new Date().toLocaleString('id-ID')} | Total Data: ${filteredRows.value.length}`],
    ['']
  ]
  
  // Data rows
  const data = filteredRows.value.map(item => ({
    'No Antrian': `#${item.nomor_antrian?.toString().padStart(3, '0')}`,
    'Nama Pemilik ATM': item.nama_pemilik_atm,
    'Email': item.email || '-',
    'WhatsApp': item.whatsapp,
    'Nomor KK': `'${item.nomor_kk}`, // Tambah apostrophe biar Excel treat as string
    'Nomor ATM': `'${item.nomor_atm}`, // Biar ga ilang leading zero
    'Kelurahan': item.kelurahan,
    'RT': item.rt,
    'RW': item.rw,
    'Alamat Lengkap': item.alamat,
    'Kartu Pemanfaat': item.kartu_pemanfaat,
    'Status': item.status?.toUpperCase(),
    'Alasan Ditolak': item.alasan_ditolak || '-',
    'Waktu Daftar': formatTime(item.created_at),
    'RPTRA': item.rptra?.nama || '-'
  }))

  // Convert data to sheet
  const wsData = XLSX.utils.json_to_sheet(data)
  
  // Combine header + data
  const ws = XLSX.utils.aoa_to_sheet([
    ...headerRows,
    ...XLSX.utils.sheet_to_json(wsData, { header: 1 })
  ])

  // ==================== STYLING ====================
  const range = XLSX.utils.decode_range(ws['!ref'])

  // 1. Style Judul Besar (Row 0)
  ws['A1'].s = {
    font: { bold: true, size: 16, color: { rgb: '1E40AF' } },
    alignment: { horizontal: 'left' }
  }
  // Merge A1 sampai akhir untuk judul
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }]

  // 2. Style Info Periode (Row 2-4)
  for (let r = 2; r <= 4; r++) {
    const addr = `A${r + 1}` // +1 karena array 0-based, Excel 1-based
    if (ws[addr]) {
      ws[addr].s = {
        font: { size: 11, color: { rgb: '374151' } }
      }
    }
  }

  // 3. Style Header Tabel (Row 6 - setelah 5 baris info + 1 baris kosong)
  const headerRowIndex = 6 // Excel row 7 (1-based)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + headerRowIndex
    if (!ws[address]) continue
    
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 10 },
      fill: { fgColor: { rgb: '2563EB' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '1E40AF' } },
        bottom: { style: 'thin', color: { rgb: '1E40AF' } },
        left: { style: 'thin', color: { rgb: '1E40AF' } },
        right: { style: 'thin', color: { rgb: '1E40AF' } }
      }
    }
  }

  // 4. Style Data Rows (borders + zebra striping opsional)
  for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[address]) continue
      
      // Default style untuk semua cell data
      ws[address].s = {
        font: { size: 10 },
        alignment: { vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
          left: { style: 'thin', color: { rgb: 'E5E7EB' } },
          right: { style: 'thin', color: { rgb: 'E5E7EB' } }
        }
      }
      
      // Zebra striping (optional - setiap baris ganjil)
      if ((R - headerRowIndex) % 2 === 0) {
        ws[address].s.fill = { fgColor: { rgb: 'F9FAFB' }, patternType: 'solid' }
      }
    }
  }

  // 5. Style khusus untuk Status column (col index 11)
  for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
    const statusAddr = XLSX.utils.encode_cell({ r: R, c: 11 }) // Kolom Status
    if (!ws[statusAddr]) continue
    
    const statusValue = ws[statusAddr].v?.toString().toLowerCase()
    
    if (statusValue === 'selesai') {
      ws[statusAddr].s = {
        ...ws[statusAddr].s,
        font: { bold: true, color: { rgb: '059669' }, size: 10 },
        fill: { fgColor: { rgb: 'D1FAE5' }, patternType: 'solid' }
      }
    } else if (statusValue === 'ditolak') {
      ws[statusAddr].s = {
        ...ws[statusAddr].s,
        font: { bold: true, color: { rgb: 'DC2626' }, size: 10 },
        fill: { fgColor: { rgb: 'FEE2E2' }, patternType: 'solid' }
      }
    } else if (statusValue === 'menunggu') {
      ws[statusAddr].s = {
        ...ws[statusAddr].s,
        font: { bold: true, color: { rgb: 'D97706' }, size: 10 },
        fill: { fgColor: { rgb: 'FEF3C7' }, patternType: 'solid' }
      }
    }
  }

  // ==================== COLUMN WIDTHS ====================
  ws['!cols'] = [
    { wch: 12 },  // No Antrian
    { wch: 25 },  // Nama
    { wch: 25 },  // Email
    { wch: 15 },  // WhatsApp
    { wch: 20 },  // Nomor KK
    { wch: 20 },  // Nomor ATM
    { wch: 15 },  // Kelurahan
    { wch: 5 },   // RT
    { wch: 5 },   // RW
    { wch: 35 },  // Alamat Lengkap
    { wch: 20 },  // Kartu Pemanfaat
    { wch: 12 },  // Status
    { wch: 25 },  // Alasan Ditolak
    { wch: 20 },  // Waktu Daftar
    { wch: 20 }   // RPTRA
  ]

  // ==================== ROW HEIGHTS ====================
  ws['!rows'] = [
    { hpt: 25 },  // Row 1: Judul
    { hpt: 5 },   // Row 2: Kosong
    { hpt: 18 },  // Row 3: Periode
    { hpt: 18 },  // Row 4: RPTRA
    { hpt: 18 },  // Row 5: Dicetak
    { hpt: 5 },   // Row 6: Kosong
    { hpt: 35 },  // Row 7: Header tabel (tinggi buat wrap text)
    ...Array(range.e.r - 6).fill({ hpt: 20 }) // Sisanya 20pt
  ]

  // ==================== FREEZE PANES ====================
  // Freeze di header tabel (baris 6 / Excel row 7)
  ws['!freeze'] = { xSplit: 0, ySplit: 6 }

  // Add sheet ke workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap')

  // ==================== SHEET 2: RINGKASAN ====================
  const summaryData = [
    ['RINGKASAN LAPORAN'],
    [''],
    ['Informasi Umum'],
    ['Periode', `${months[filterBulan.value - 1]} ${filterTahun.value}`],
    ['RPTRA', !isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'],
    ['Total Data', filteredRows.value.length],
    [''],
    ['Status Breakdown'],
    ['Menunggu', filteredRows.value.filter(d => d.status === 'menunggu').length, `${((filteredRows.value.filter(d => d.status === 'menunggu').length / filteredRows.value.length) * 100).toFixed(1)}%`],
    ['Selesai', filteredRows.value.filter(d => d.status === 'selesai').length, `${((filteredRows.value.filter(d => d.status === 'selesai').length / filteredRows.value.length) * 100).toFixed(1)}%`],
    ['Ditolak', filteredRows.value.filter(d => d.status === 'ditolak').length, `${((filteredRows.value.filter(d => d.status === 'ditolak').length / filteredRows.value.length) * 100).toFixed(1)}%`],
    ['Batal', filteredRows.value.filter(d => d.status === 'batal').length, `${((filteredRows.value.filter(d => d.status === 'batal').length / filteredRows.value.length) * 100).toFixed(1)}%`],
    [''],
    ['Filter yang Aktif'],
    ['Kartu', filterKartu.value || 'Semua'],
    ['Pencarian KK/ATM', searchKKATM.value || '-'],
    [''],
    ['Dicetak', new Date().toLocaleString('id-ID')]
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Style summary
  wsSummary['A1'].s = {
    font: { bold: true, size: 14, color: { rgb: '1E40AF' } }
  }
  
  // Style section headers
  const summaryHeaders = ['A3', 'A8', 'A14']
  summaryHeaders.forEach(addr => {
    if (wsSummary[addr]) {
      wsSummary[addr].s = {
        font: { bold: true, size: 11, color: { rgb: '374151' } },
        fill: { fgColor: { rgb: 'F3F4F6' }, patternType: 'solid' }
      }
    }
  })
  
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

  // ==================== DOWNLOAD ====================
  const fileName = `Laporan_Antrian_${months[filterBulan.value - 1]}_${filterTahun.value}_${new Date().getTime()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

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