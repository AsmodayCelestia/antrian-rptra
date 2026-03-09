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

    <!-- Pendaftaran Manual - Hanya admin & moderator -->
    <div v-if="canEditAntrian" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6">
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
                  
                  <!-- ⭐ EDIT DATA - Hanya admin & moderator -->
                  <button 
                    v-if="canEditAntrian"
                    @click="openEditModal(item)"
                    class="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1 rounded text-xs"
                    title="Edit Data"
                  >
                    ✏️
                  </button>
                  
                  <!-- Verifikasi/Tolak - Hanya admin & moderator -->
                  <template v-if="canEditAntrian && item.status === 'menunggu'">
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
    <div v-if="showPilihKuota && canEditAntrian" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
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

    <!-- ⭐ MODAL EDIT DATA -->
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
          <!-- Info Read-only -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p class="font-semibold">ℹ️ Informasi:</p>
            <p>Nomor Antrian tidak dapat diubah. Status diubah via tombol Verifikasi/Tolak.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nama Pemilik ATM -->
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

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                v-model="editForm.email"
                type="email"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>

            <!-- WhatsApp -->
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

            <!-- Nomor KK -->
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

            <!-- Nomor ATM -->
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

            <!-- Kartu Pemanfaat -->
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

            <!-- Kelurahan -->
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

            <!-- RT -->
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

            <!-- RW -->
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

          <!-- Alamat Lengkap -->
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

          <!-- Read-only info -->
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

          <!-- Error global -->
          <div v-if="editError" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {{ editError }}
          </div>

          <!-- Actions -->
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
            
            <template v-if="canEditAntrian && detailItem.status === 'menunggu'">
              <button @click="updateStatus(detailItem.id, 'selesai'); closeDetail()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">✓ Verifikasi</button>
              <button @click="showTolakModal(detailItem); closeDetail()" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">✕ Tolak</button>
            </template>
            
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
import QRCode from 'qrcode'

const router = useRouter()

// Data
const antrianList = ref([])
const kuotaAktif = ref(null)

// Filter State
const now = new Date()
const filterBulan = ref(now.getMonth() + 1)
const filterTahun = ref(now.getFullYear())
const filterKartu = ref('')
const searchKKATM = ref('')

// Pagination State
const currentPage = ref(1)
const perPage = ref(20)

// Options
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tahunOptions = computed(() => {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
})
const kartuOptions = ['KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta', 'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS']

// Computed: Filtered Rows
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

// Computed: Paginated Rows
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

// Computed: Pagination Meta
const totalPages = computed(() => Math.ceil(filteredRows.value.length / perPage.value) || 1)
const paginationStart = computed(() => filteredRows.value.length > 0 ? (currentPage.value - 1) * perPage.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * perPage.value, filteredRows.value.length))

// Computed: Visible Page Numbers
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

// ⭐ EDIT MODAL STATES
const editItem = ref(null)
const editForm = ref({})
const editErrors = ref({})
const editError = ref('')
const editLoading = ref(false)

// ⭐ OPEN EDIT MODAL
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

// ⭐ CLOSE EDIT MODAL
const closeEditModal = () => {
  editItem.value = null
  editForm.value = {}
  editErrors.value = {}
  editError.value = ''
  editLoading.value = false
}

// ⭐ VALIDATE EDIT FORM
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

// ⭐ SUBMIT EDIT
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
    
    // Refresh data
    await fetchAntrian()
    closeEditModal()
    
  } catch (err) {
    console.error('Edit error:', err)
    editError.value = 'Gagal menyimpan perubahan: ' + err.message
  } finally {
    editLoading.value = false
  }
}

// Export Excel
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