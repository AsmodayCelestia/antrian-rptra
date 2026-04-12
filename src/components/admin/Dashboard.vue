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

    <!-- Pendaftaran Manual - Hanya admin & moderator -->
    <div v-if="canEditAntrian" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-bold text-gray-800">Pendaftaran Manual</h3>
          <p class="text-sm text-gray-600">Tambah pendaftar untuk warga yang membutuhkan bantuan</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="openPilihKuotaModal"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <span>➕</span> Tambah Manual
          </button>
          <button 
            @click="openCSVModal"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <span>📤</span> Upload CSV
          </button>
          <button 
            @click="downloadCSVTemplate"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <span>📥</span> Template
          </button>
        </div>
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
            v-if="canEditAntrian"
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
                <div v-else-if="item.status === 'terverifikasi'" class="text-blue-600 text-xs">Menunggu swipe...</div>
                <div v-else-if="item.status === 'batal'" class="text-gray-500 text-xs">Dibatalkan</div>
                <div v-else class="text-gray-400 text-xs">-</div>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                {{ formatTime(item.created_at) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-1 flex-wrap justify-center">
                  <!-- Lihat detail -->
                  <button 
                    @click="showDetail(item)"
                    class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                    title="Lihat Detail"
                  >
                    👁️
                  </button>
                  
                  <!-- Download QR -->
                  <button 
                    @click="downloadQR(item)"
                    class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                    title="Download QR"
                  >
                    📥
                  </button>
                  
                  <!-- WhatsApp -->
                  <button 
                    @click="openWhatsApp(item)"
                    class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs"
                    title="Kirim WhatsApp"
                  >
                    💬
                  </button>
                  
                  <!-- Edit Data - Hanya admin & moderator -->
                  <button 
                    v-if="canEditAntrian"
                    @click="openEditModal(item)"
                    class="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1 rounded text-xs"
                    title="Edit Data"
                  >
                    ✏️
                  </button>
                  
                  <!-- Verifikasi & Tolak untuk status menunggu -->
                  <template v-if="canEditAntrian && item.status === 'menunggu'">
                    <button 
                      @click="updateStatus(item.id, 'terverifikasi')"
                      class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      title="Verifikasi"
                    >
                      ✓
                    </button>
                    <button 
                      @click="showTolakModal(item)"
                      class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      title="Tolak"
                    >
                      ✕
                    </button>
                  </template>

                  <!-- Status terverifikasi: tunggu swipe di QR Scanner -->
                  <template v-else-if="canEditAntrian && item.status === 'terverifikasi'">
                    <span class="text-blue-600 text-xs px-2 py-1">QR Scanner →</span>
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
      
      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white gap-4">
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

        <div class="text-sm text-gray-500">
          {{ paginationStart }} - {{ paginationEnd }} dari {{ filteredRows.length }} data
        </div>

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

    <!-- Modal: Pilih Kuota (Untuk Manual) -->
    <div v-if="showPilihKuota && !csvMode" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
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

    <!-- Modal: Pilih Kuota (Untuk CSV) -->
    <div v-if="showPilihKuota && csvMode" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div class="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h3 class="text-xl font-bold">📤 Upload CSV - Pilih Kuota</h3>
          <button @click="closePilihKuota" class="text-white hover:bg-blue-700 p-2 rounded-lg">✕</button>
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
              class="border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50"
              :class="selectedKuota?.id === k.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
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

          <div class="mt-6 space-y-3">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p class="font-semibold mb-1">📋 Ketentuan CSV:</p>
              <ul class="list-disc list-inside text-xs space-y-1">
                <li>Maksimal 100 row per upload</li>
                <li>Format: email,kartu_pemanfaat,alamat,rt,rw,nomor_kk,nomor_atm,nama_pemilik_atm,whatsapp</li>
                <li>Kelurahan otomatis: Pademangan Timur</li>
                <li>Duplikat KK akan di-skip</li>
              </ul>
            </div>
            
            <div class="flex gap-3">
              <button @click="closePilihKuota" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg">Batal</button>
              <button 
                @click="lanjutKeCSVUpload"
                :disabled="!selectedKuota || (selectedKuota.kuota - (selectedKuota.terdaftar || 0)) <= 0"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg font-medium"
              >
                Lanjut Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: CSV Upload & Preview -->
    <div v-if="showCSVUploadModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">📤 Upload File CSV</h3>
            <p class="text-blue-100 text-sm">{{ formatMonthYear(selectedKuota?.bulan, selectedKuota?.tahun) }} - Sisa Kuota: {{ selectedKuota?.kuota - (selectedKuota?.terdaftar || 0) }}</p>
          </div>
          <button @click="closeCSVUploadModal" class="text-white hover:bg-blue-700 p-2 rounded-lg">✕</button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <!-- File Input -->
          <div v-if="!csvFile" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <input 
              type="file" 
              accept=".csv" 
              @change="handleCSVFileChange"
              class="hidden" 
              id="csvInput"
            >
            <label for="csvInput" class="cursor-pointer">
              <div class="text-4xl mb-2">📁</div>
              <p class="text-gray-700 font-medium">Klik untuk pilih file CSV</p>
              <p class="text-gray-500 text-sm mt-1">atau drag & drop file di sini</p>
              <p class="text-gray-400 text-xs mt-2">Maksimal 5MB, 100 row</p>
            </label>
          </div>

          <!-- Preview Table -->
          <div v-else-if="csvPreview.length > 0" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-gray-800">Preview Data (5 row pertama)</h4>
              <button 
                @click="csvFile = null; csvPreview = []"
                class="text-red-600 hover:text-red-700 text-sm"
              >
                Ganti File
              </button>
            </div>

            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left">Row</th>
                    <th class="px-3 py-2 text-left">Nama</th>
                    <th class="px-3 py-2 text-left">KK</th>
                    <th class="px-3 py-2 text-left">Kartu</th>
                    <th class="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="item in csvPreview" :key="item.row" :class="!item.valid ? 'bg-red-50' : ''">
                    <td class="px-3 py-2">{{ item.row }}</td>
                    <td class="px-3 py-2">{{ item.data.nama_pemilik_atm || '-' }}</td>
                    <td class="px-3 py-2 font-mono text-xs">{{ item.data.nomor_kk || '-' }}</td>
                    <td class="px-3 py-2">{{ item.data.kartu_pemanfaat || '-' }}</td>
                    <td class="px-3 py-2 text-center">
                      <span v-if="item.valid" class="text-green-600 text-lg">✓</span>
                      <span v-else class="text-red-600 text-lg">✕</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Validation Errors -->
            <div v-if="csvPreview.some(p => !p.valid)" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-red-700 font-semibold text-sm mb-2">⚠️ Error ditemukan di preview:</p>
              <ul class="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                <li v-for="item in csvPreview.filter(p => !p.valid)" :key="item.row">
                  Row {{ item.row }}: {{ item.errors.join(', ') }}
                </li>
              </ul>
              <p class="text-xs text-red-600 mt-2">Row dengan error akan di-skip saat upload.</p>
            </div>

            <div v-else class="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              ✅ Preview valid! Semua row akan diproses. Duplikat KK akan di-skip otomatis.
            </div>
          </div>
        </div>

        <div v-if="csvFile" class="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            @click="closeCSVUploadModal"
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitCSVUpload"
            :disabled="csvLoading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <span v-if="csvLoading">⏳ Memproses...</span>
            <span v-else>🚀 Upload Data</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: CSV Results -->
    <div v-if="csvResults.total > 0" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div 
          class="p-4 text-white flex justify-between items-center"
          :class="csvResults.failed === 0 && csvResults.skipped === 0 ? 'bg-green-600' : csvResults.failed > 0 ? 'bg-red-600' : 'bg-yellow-600'"
        >
          <h3 class="text-xl font-bold">📊 Hasil Upload CSV</h3>
          <button @click="closeCSVResultsModal" class="text-white hover:bg-black/20 p-2 rounded-lg">✕</button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <!-- Summary Cards -->
          <div class="grid grid-cols-4 gap-3 mb-6">
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-blue-600">{{ csvResults.total }}</p>
              <p class="text-xs text-gray-600">Total</p>
            </div>
            <div class="bg-green-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-green-600">{{ csvResults.success }}</p>
              <p class="text-xs text-gray-600">Sukses</p>
            </div>
            <div class="bg-yellow-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-yellow-600">{{ csvResults.skipped }}</p>
              <p class="text-xs text-gray-600">Skip (Duplikat)</p>
            </div>
            <div class="bg-red-50 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-red-600">{{ csvResults.failed }}</p>
              <p class="text-xs text-gray-600">Gagal</p>
            </div>
          </div>

          <!-- Details List -->
          <div v-if="csvResults.details.length > 0" class="space-y-2">
            <h4 class="font-bold text-gray-800 mb-2">Detail per Row:</h4>
            <div class="max-h-64 overflow-y-auto space-y-1">
              <div 
                v-for="detail in csvResults.details" 
                :key="detail.row"
                class="flex items-center gap-3 p-2 rounded text-sm"
                :class="{
                  'bg-green-50': detail.status === 'success',
                  'bg-yellow-50': detail.status === 'skipped',
                  'bg-red-50': detail.status === 'error'
                }"
              >
                <span class="text-lg">
                  {{ detail.status === 'success' ? '✅' : detail.status === 'skipped' ? '⏭️' : '❌' }}
                </span>
                <div class="flex-1">
                  <p class="font-medium">
                    Row {{ detail.row }} - {{ detail.data?.nama_pemilik_atm || 'Unknown' }}
                  </p>
                  <p class="text-xs text-gray-600">{{ detail.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            @click="downloadCSVReport"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            📥 Download Report
          </button>
          <button 
            @click="closeCSVResultsModal"
            class="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Edit Data -->
    <div v-if="editItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="bg-yellow-500 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">✏️ Edit Data Pendaftaran</h3>
            <p class="text-yellow-100 text-sm">Nomor Antrian #{{ editItem.nomor_antrian }}</p>
          </div>
          <button @click="closeEditModal" class="text-white hover:bg-yellow-600 p-2 rounded-lg">✕</button>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p class="font-semibold">ℹ️ Informasi:</p>
            <p>Nomor Antrian tidak dapat diubah. Status diubah via tombol Verifikasi/Tolak.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik ATM <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.nama_pemilik_atm"
                type="text"
                class="w-full border rounded-lg px-3 py-2"
                :class="{ 'border-red-500': editErrors.nama_pemilik_atm }"
              >
              <p v-if="editErrors.nama_pemilik_atm" class="text-red-500 text-xs mt-1">{{ editErrors.nama_pemilik_atm }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                v-model="editForm.email"
                type="email"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.whatsapp"
                type="text"
                class="w-full border rounded-lg px-3 py-2"
                :class="{ 'border-red-500': editErrors.whatsapp }"
              >
              <p v-if="editErrors.whatsapp" class="text-red-500 text-xs mt-1">{{ editErrors.whatsapp }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nomor KK <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.nomor_kk"
                type="text"
                maxlength="16"
                class="w-full border rounded-lg px-3 py-2 font-mono"
                :class="{ 'border-red-500': editErrors.nomor_kk }"
              >
              <p v-if="editErrors.nomor_kk" class="text-red-500 text-xs mt-1">{{ editErrors.nomor_kk }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nomor ATM <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.nomor_atm"
                type="text"
                maxlength="16"
                class="w-full border rounded-lg px-3 py-2 font-mono"
                :class="{ 'border-red-500': editErrors.nomor_atm }"
              >
              <p v-if="editErrors.nomor_atm" class="text-red-500 text-xs mt-1">{{ editErrors.nomor_atm }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kartu Pemanfaat <span class="text-red-500">*</span></label>
              <select 
                v-model="editForm.kartu_pemanfaat"
                class="w-full border rounded-lg px-3 py-2 bg-white"
                :class="{ 'border-red-500': editErrors.kartu_pemanfaat }"
              >
                <option v-for="k in kartuOptions" :key="k" :value="k">{{ k }}</option>
              </select>
              <p v-if="editErrors.kartu_pemanfaat" class="text-red-500 text-xs mt-1">{{ editErrors.kartu_pemanfaat }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kelurahan <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.kelurahan"
                type="text"
                class="w-full border rounded-lg px-3 py-2"
                :class="{ 'border-red-500': editErrors.kelurahan }"
              >
              <p v-if="editErrors.kelurahan" class="text-red-500 text-xs mt-1">{{ editErrors.kelurahan }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">RT <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.rt"
                type="text"
                maxlength="3"
                class="w-full border rounded-lg px-3 py-2"
                :class="{ 'border-red-500': editErrors.rt }"
              >
              <p v-if="editErrors.rt" class="text-red-500 text-xs mt-1">{{ editErrors.rt }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">RW <span class="text-red-500">*</span></label>
              <input 
                v-model="editForm.rw"
                type="text"
                maxlength="3"
                class="w-full border rounded-lg px-3 py-2"
                :class="{ 'border-red-500': editErrors.rw }"
              >
              <p v-if="editErrors.rw" class="text-red-500 text-xs mt-1">{{ editErrors.rw }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap <span class="text-red-500">*</span></label>
            <textarea 
              v-model="editForm.alamat"
              rows="3"
              class="w-full border rounded-lg px-3 py-2"
              :class="{ 'border-red-500': editErrors.alamat }"
            ></textarea>
            <p v-if="editErrors.alamat" class="text-red-500 text-xs mt-1">{{ editErrors.alamat }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nomor Antrian (Read-only)</label>
              <p class="text-sm font-bold text-gray-800">#{{ editItem.nomor_antrian?.toString().padStart(3, '0') }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Status (Read-only)</label>
              <p class="text-sm font-medium text-gray-800">{{ editItem.status?.toUpperCase() }}</p>
            </div>
          </div>

          <div v-if="editError" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {{ editError }}
          </div>

          <div class="flex gap-3 pt-4 border-t">
            <button 
              @click="closeEditModal"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium"
            >
              Batal
            </button>
            <button 
              @click="submitEdit"
              :disabled="editLoading"
              class="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <span v-if="editLoading">⏳ Menyimpan...</span>
              <span v-else>💾 Simpan Perubahan</span>
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
            
            <!-- WhatsApp Button -->
            <button 
              @click="openWhatsApp(detailItem); closeDetail()"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              💬 Kirim WhatsApp
            </button>
            
            <!-- Verifikasi & Tolak untuk menunggu -->
            <template v-if="canEditAntrian && detailItem.status === 'menunggu'">
              <button @click="updateStatus(detailItem.id, 'terverifikasi'); closeDetail()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">✓ Verifikasi</button>
              <button @click="showTolakModal(detailItem); closeDetail()" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">✕ Tolak</button>
            </template>
            
            <!-- Terverifikasi: suruh ke QR Scanner -->
            <template v-else-if="detailItem.status === 'terverifikasi'">
              <div class="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-center text-sm flex items-center justify-center gap-2">
                <span>⏳</span> Menunggu swipe kartu
              </div>
            </template>
            
            <!-- Staff ga bisa verifikasi -->
            <template v-else-if="detailItem.status === 'menunggu'">
              <div class="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 py-2 rounded-lg text-center text-sm flex items-center justify-center gap-2">
                <span>🔒</span> Verifikasi via QR Scanner
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Tolak -->
    <div v-if="showTolakItem && canEditAntrian" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
import { user, isModerator, isAdmin, isStaff, canEditAntrian } from '../../composables/useAuth'
import { getAllAntrian, updateStatusAntrian, getKuotaAktif, updateAntrian } from '../../composables/useAntrian'
import { getAllKuota } from '../../composables/useKuota'
import { formatWIB } from '../../lib/supabase'
import useCSVUpload from '../../composables/useCSVUpload'
import QRCode from 'qrcode'
import { uploadQR } from '../../lib/cloudinary'
import { supabase } from '../../lib/supabase'


const router = useRouter()

const antrianList = ref([])
const kuotaAktif = ref(null)

const now = new Date()
const filterBulan = ref(now.getMonth() + 1)
const filterTahun = ref(now.getFullYear())
const filterKartu = ref('')
const searchKKATM = ref('')

const currentPage = ref(1)
const perPage = ref(20)

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})
const kartuOptions = ['KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta', 'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS']

const filteredRows = computed(() => {
  let result = [...antrianList.value]
  
  result = result.filter(item => {
    const date = new Date(item.created_at)
    return date.getMonth() + 1 === filterBulan.value && date.getFullYear() === filterTahun.value
  })
  
  if (filterKartu.value) {
    result = result.filter(item => item.kartu_pemanfaat === filterKartu.value)
  }
  
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

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / perPage.value) || 1)
const paginationStart = computed(() => filteredRows.value.length > 0 ? (currentPage.value - 1) * perPage.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * perPage.value, filteredRows.value.length))

const verifyDetailAccess = (item) => {
  if (isModerator.value) return true
  return item.rptra_id === user.value?.rptra_id
}

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

const stats = computed(() => ({
  total: filteredRows.value.length,
  menunggu: filteredRows.value.filter(d => d.status === 'menunggu').length,
  terverifikasi: filteredRows.value.filter(d => d.status === 'terverifikasi').length,
  ditolak: filteredRows.value.filter(d => d.status === 'ditolak').length,
  selesai: filteredRows.value.filter(d => d.status === 'selesai').length
}))

watch([filterBulan, filterTahun, filterKartu, searchKKATM], () => {
  currentPage.value = 1
})

const showPilihKuota = ref(false)
const kuotaList = ref([])
const loadingKuotaList = ref(false)
const selectedKuota = ref(null)
const detailItem = ref(null)
const showTolakItem = ref(null)
const alasanTolak = ref('')
const alasanLainnya = ref('')

const editItem = ref(null)
const editForm = ref({})
const editErrors = ref({})
const editError = ref('')
const editLoading = ref(false)

// CSV Upload State
const csvMode = ref(false)
const showCSVUploadModal = ref(false)
const csvFile = ref(null)
const csvPreview = ref([])

const {
  loading: csvLoading,
  progress: csvProgress,
  currentRow: csvCurrentRow,
  results: csvResults,
  processCSV,
  downloadTemplate,
  resetResults,
  validateRow
} = useCSVUpload()

// ⭐ WHATSAPP METHOD
const openWhatsApp = async (item) => {
  const phone = item.whatsapp?.replace(/\D/g, '')
  if (!phone) {
    alert('Nomor WhatsApp tidak valid')
    return
  }
  
  let formattedPhone = phone
  if (phone.startsWith('0')) {
    formattedPhone = '62' + phone.substring(1)
  } else if (!phone.startsWith('62')) {
    formattedPhone = '62' + phone
  }

  let qrUrl = item.qr_cloudinary_url
  
  // ⭐ KALAU BELUM ADA, GENERATE & UPLOAD DULU
  if (!qrUrl) {
    try {
      const qrData = JSON.stringify({ 
        nomor: item.nomor_antrian, 
        kuota_id: item.kuota_id 
      })
      
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, qrData, { width: 400, margin: 2 })
      
      const dataUrl = canvas.toDataURL('image/png')
      const uploadResult = await uploadQR(dataUrl, `antrian-${item.id}`)
      
      qrUrl = uploadResult.secure_url
      
      // Update database biar next time cepat
      await supabase
        .from('antrian')
        .update({ qr_cloudinary_url: qrUrl })
        .eq('id', item.id)
        
    } catch (err) {
      alert('Gagal upload QR: ' + err.message)
      return
    }
  }

  const message = encodeURIComponent(
    `Halo ${item.nama_pemilik_atm},\n\n` +
    `Pendaftaran Anda di *${item.rptra?.nama || 'RPTRA'}* telah berhasil!\n\n` +
    `📋 *Detail Pendaftaran:*\n` +
    `• Nomor Antrian: *#${item.nomor_antrian?.toString().padStart(3, '0')}*\n` +
    `• Kartu: ${item.kartu_pemanfaat}\n` +
    `• Kelurahan: ${item.kelurahan}\n\n` +
    `🔗 *Link QR Code:*\n${qrUrl}\n\n` +
    `⏰ *Jadwal Pengambilan:*\n` +
    `Hari berikutnya (H+1) pukul 08.00 - 11.00 WIB\n\n` +
    `⚠️ *Catatan Penting:*\n` +
    `• Tunjukkan QR code saat pengambilan\n` +
    `• Bawa Kartu ATM, Fotokopi KK dan KTP asli\n` +
    `• Nomor antrian tidak dapat dipindahtangankan\n\n` +
    `Terima kasih.`
  )
  
  window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
}

const openEditModal = (item) => {
  editItem.value = { ...item }
  editForm.value = {
    nama_pemilik_atm: item.nama_pemilik_atm,
    email: item.email || '',
    whatsapp: item.whatsapp,
    nomor_kk: item.nomor_kk,
    nomor_atm: item.nomor_atm,
    kartu_pemanfaat: item.kartu_pemanfaat,
    kelurahan: item.kelurahan,
    rt: item.rt,
    rw: item.rw,
    alamat: item.alamat
  }
  editErrors.value = {}
  editError.value = ''
}

const closeEditModal = () => {
  editItem.value = null
  editForm.value = {}
  editErrors.value = {}
  editError.value = ''
  editLoading.value = false
}

const validateEditForm = () => {
  const errors = {}
  
  if (!editForm.value.nama_pemilik_atm?.trim()) {
    errors.nama_pemilik_atm = 'Nama wajib diisi'
  }
  
  if (!editForm.value.whatsapp?.trim()) {
    errors.whatsapp = 'WhatsApp wajib diisi'
  }
  
  if (!editForm.value.nomor_kk?.trim()) {
    errors.nomor_kk = 'Nomor KK wajib diisi'
  } else if (editForm.value.nomor_kk.length < 16) {
    errors.nomor_kk = 'Nomor KK harus 16 digit'
  }
  
  if (!editForm.value.nomor_atm?.trim()) {
    errors.nomor_atm = 'Nomor ATM wajib diisi'
  }
  
  if (!editForm.value.kartu_pemanfaat?.trim()) {
    errors.kartu_pemanfaat = 'Kartu pemanfaat wajib dipilih'
  }
  
  if (!editForm.value.kelurahan?.trim()) {
    errors.kelurahan = 'Kelurahan wajib diisi'
  }
  
  if (!editForm.value.rt?.trim()) {
    errors.rt = 'RT wajib diisi'
  }
  
  if (!editForm.value.rw?.trim()) {
    errors.rw = 'RW wajib diisi'
  }
  
  if (!editForm.value.alamat?.trim()) {
    errors.alamat = 'Alamat wajib diisi'
  }
  
  editErrors.value = errors
  return Object.keys(errors).length === 0
}

const submitEdit = async () => {
  if (!validateEditForm()) return
  
  editLoading.value = true
  editError.value = ''
  
  try {
    await updateAntrian(editItem.value.id, {
      nama_pemilik_atm: editForm.value.nama_pemilik_atm,
      email: editForm.value.email || null,
      whatsapp: editForm.value.whatsapp,
      nomor_kk: editForm.value.nomor_kk,
      nomor_atm: editForm.value.nomor_atm,
      kartu_pemanfaat: editForm.value.kartu_pemanfaat,
      kelurahan: editForm.value.kelurahan,
      rt: editForm.value.rt,
      rw: editForm.value.rw,
      alamat: editForm.value.alamat
    })
    
    await fetchAntrian()
    closeEditModal()
    
  } catch (err) {
    console.error('Edit error:', err)
    editError.value = 'Gagal menyimpan perubahan: ' + err.message
  } finally {
    editLoading.value = false
  }
}

const downloadExcel = () => {
  const data = filteredRows.value.map(item => ({
    'No Antrian': `#${item.nomor_antrian?.toString().padStart(3, '0')}`,
    'Nama Pemilik ATM': item.nama_pemilik_atm,
    'Email': item.email || '-',
    'WhatsApp': item.whatsapp,
    'Nomor KK': `'${item.nomor_kk}`,
    'Nomor ATM': `'${item.nomor_atm}`,
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

  const wb = XLSX.utils.book_new()
  const wsData = XLSX.utils.json_to_sheet(data)
  
  const headerRows = [
    ['LAPORAN ANTRIAN RPTRA - DATA LENGKAP'],
    [''],
    [`Periode: ${months[filterBulan.value - 1]} ${filterTahun.value}`],
    [`RPTRA: ${!isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'}`],
    [`Dicetak: ${new Date().toLocaleString('id-ID')} | Total Data: ${filteredRows.value.length}`],
    ['']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet([
    ...headerRows,
    ...XLSX.utils.sheet_to_json(wsData, { header: 1 })
  ])

  const range = XLSX.utils.decode_range(ws['!ref'])
  
  ws['A1'].s = { font: { bold: true, size: 16, color: { rgb: '1E40AF' } } }
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }]
  
  const headerRowIndex = 6
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + headerRowIndex
    if (!ws[address]) continue
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 10 },
      fill: { fgColor: { rgb: '2563EB' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  }

  ws['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
    { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 5 },
    { wch: 5 }, { wch: 35 }, { wch: 20 }, { wch: 12 },
    { wch: 25 }, { wch: 20 }, { wch: 20 }
  ]
  
  ws['!freeze'] = { xSplit: 0, ySplit: 6 }
  XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap')

  const summaryData = [
    ['RINGKASAN LAPORAN'],
    [''],
    ['Informasi Umum'],
    ['Periode', `${months[filterBulan.value - 1]} ${filterTahun.value}`],
    ['RPTRA', !isModerator.value && user.value?.rptra ? user.value.rptra.nama : 'Semua RPTRA (Moderator)'],
    ['Total Data', filteredRows.value.length],
    [''],
    ['Status Breakdown'],
    ['Menunggu', filteredRows.value.filter(d => d.status === 'menunggu').length],
    ['Terverifikasi', filteredRows.value.filter(d => d.status === 'terverifikasi').length],
    ['Selesai', filteredRows.value.filter(d => d.status === 'selesai').length],
    ['Ditolak', filteredRows.value.filter(d => d.status === 'ditolak').length],
    ['Batal', filteredRows.value.filter(d => d.status === 'batal').length],
    [''],
    ['Dicetak', new Date().toLocaleString('id-ID')]
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['A1'].s = { font: { bold: true, size: 14, color: { rgb: '1E40AF' } } }
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

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

const formatMonthYear = (bulan, tahun) => {
  return `${months[bulan - 1]} ${tahun}`
}

const formatMonthYearFromItem = (item) => {
  if (!item.kuota_bulanan) return '-'
  return formatMonthYear(item.kuota_bulanan.bulan, item.kuota_bulanan.tahun)
}

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
  csvMode.value = false
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

const openCSVModal = async () => {
  csvMode.value = true
  showPilihKuota.value = true
  loadingKuotaList.value = true
  selectedKuota.value = null
  csvFile.value = null
  csvPreview.value = []
  resetResults()
  
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
  csvMode.value = false
}

const pilihKuota = (k) => { selectedKuota.value = k }

const lanjutKeForm = () => {
  if (!selectedKuota.value) return
  showPilihKuota.value = false
  router.push(`/admin/didaftarkanmanualbyadmin/${selectedKuota.value.id}`)
}

const lanjutKeCSVUpload = () => {
  if (!selectedKuota.value) return
  showPilihKuota.value = false
  showCSVUploadModal.value = true
}

const closeCSVUploadModal = () => {
  showCSVUploadModal.value = false
  csvFile.value = null
  csvPreview.value = []
  selectedKuota.value = null
  csvMode.value = false
}

const closeCSVResultsModal = () => {
  resetResults()
  csvFile.value = null
  csvPreview.value = []
  selectedKuota.value = null
  csvMode.value = false
}

const handleCSVFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File terlalu besar. Maksimal 5MB.')
    event.target.value = ''
    return
  }
  
  if (!file.name.endsWith('.csv')) {
    alert('File harus format CSV')
    event.target.value = ''
    return
  }
  
  csvFile.value = file
  
  // Preview first 5 rows
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        alert('CSV kosong atau tidak valid')
        csvFile.value = null
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
      
      csvPreview.value = lines.slice(1, 6).map((line, index) => {
        // Handle quoted values with commas
        const values = []
        let current = ''
        let inQuotes = false
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())
        
        const rowData = {}
        headers.forEach((h, i) => {
          rowData[h] = values[i] ? values[i].replace(/"/g, '').trim() : ''
        })
        
        const validation = validateRow(rowData, index)
        return {
          ...validation,
          raw: rowData
        }
      })
    } catch (err) {
      console.error('Preview error:', err)
      alert('Gagal membaca file CSV')
      csvFile.value = null
      csvPreview.value = []
    }
  }
  reader.readAsText(file)
}

const submitCSVUpload = async () => {
  if (!csvFile.value || !selectedKuota.value) return
  
  try {
    await processCSV(csvFile.value, selectedKuota.value.id, user.value?.rptra_id)
    await fetchAntrian() // Refresh data
    showCSVUploadModal.value = false
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

const downloadCSVTemplate = () => {
  downloadTemplate()
}

const downloadCSVReport = () => {
  const reportData = csvResults.value.details.map(d => ({
    'Row': d.row,
    'Status': d.status === 'success' ? 'Sukses' : d.status === 'skipped' ? 'Skip (Duplikat)' : 'Gagal',
    'Nama': d.data?.nama_pemilik_atm || '-',
    'KK': d.data?.nomor_kk || '-',
    'Kartu': d.data?.kartu_pemanfaat || '-',
    'Keterangan': d.message
  }))
  
  const summary = [
    ['LAPORAN UPLOAD CSV'],
    [''],
    ['Periode', formatMonthYear(selectedKuota.value?.bulan, selectedKuota.value?.tahun)],
    ['RPTRA', user.value?.rptra?.nama || '-'],
    ['Waktu Upload', new Date().toLocaleString('id-ID')],
    [''],
    ['Ringkasan'],
    ['Total Row', csvResults.value.total],
    ['Sukses', csvResults.value.success],
    ['Skip (Duplikat KK)', csvResults.value.skipped],
    ['Gagal', csvResults.value.failed],
    ['']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet([
    ...summary,
    ['Row', 'Status', 'Nama', 'KK', 'Kartu', 'Keterangan'],
    ...reportData.map(r => [r.Row, r.Status, r.Nama, r.KK, r.Kartu, r.Keterangan])
  ])
  
  ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 40 }]
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report Upload')
  
  const fileName = `Report_Upload_CSV_${new Date().getTime()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

const showDetail = (item) => {
  // ⭐ FIX: Cek akses sebelum show detail
  if (!verifyDetailAccess(item)) {
    return // Silent fail
  }
  detailItem.value = { ...item }
}
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