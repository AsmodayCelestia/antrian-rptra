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

    <!-- ⭐ TOMBOL BARU: Tambah Manual -->
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

    <!-- Kuota Control -->
    <!-- <div v-if="!isModerator" class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="font-bold text-lg">Kuota Bulan Ini</h3>
          <p class="text-sm text-gray-500">{{ currentMonthYear }}</p>
        </div>
        <div class="flex gap-2">
          <button 
            v-if="kuotaAktif"
            @click="showEditKuota = true"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ✏️ Edit Kuota
          </button>
          <button 
            v-if="kuotaAktif"
            @click="toggleKuota"
            :disabled="kuotaLoading"
            :class="kuotaAktif?.dibuka ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
            class="text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {{ kuotaLoading ? '...' : (kuotaAktif?.dibuka ? '🔒 Tutup' : '🔓 Buka') }}
          </button>
          <button 
            v-else
            @click="showCreateKuota = true"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ➕ Buat Kuota
          </button>
        </div>
      </div>
      
      <div v-if="kuotaAktif" class="grid grid-cols-3 gap-4 text-center">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs">Total Kuota</p>
          <p class="text-xl font-bold">{{ kuotaAktif.kuota }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs">Terdaftar</p>
          <p class="text-xl font-bold text-blue-600">{{ stats.total }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-gray-500 text-xs">Sisa</p>
          <p class="text-xl font-bold" :class="sisaKuota < 10 ? 'text-red-600' : 'text-green-600'">
            {{ sisaKuota }}
          </p>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        <div class="text-4xl mb-2">📭</div>
        <p class="mb-2">Belum ada kuota untuk bulan ini</p>
        <p class="text-sm">Klik "Buat Kuota" untuk mengatur</p>
      </div>
    </div> -->

    <!-- Antrian List -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-lg">Daftar Antrian</h3>
        <button @click="fetchAntrian" class="text-blue-600 hover:text-blue-800 text-sm">
          🔄 Refresh
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kartu</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in antrianList" :key="item.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-bold text-blue-600">#{{ item.nomor_antrian }}</td>
              <td class="px-4 py-3">
                <div class="font-medium">{{ item.nama_pemilik_atm }}</div>
                <div class="text-xs text-gray-500">{{ item.whatsapp }}</div>
              </td>
              <td class="px-4 py-3 text-sm">{{ item.kartu_pemanfaat }}</td>
              <td class="px-4 py-3">
                <span :class="statusClass(item.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ item.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm max-w-xs">
                <div v-if="item.status === 'selesai'" class="text-green-600 font-medium">
                  ✓ Sudah ambil
                </div>
                <div v-else-if="item.status === 'ditolak'" class="text-red-600">
                  {{ item.alasan_ditolak || 'Ditolak' }}
                </div>
                <div v-else-if="item.status === 'batal'" class="text-gray-500">
                  Dibatalkan
                </div>
                <div v-else class="text-gray-400">-</div>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500">
                {{ formatTime(item.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 flex-wrap justify-center">
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
                  <span v-else class="text-gray-400 text-xs">-</span>
                </div>
              </td>
            </tr>
            <tr v-if="antrianList.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                Belum ada antrian
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create Kuota -->
    <div v-if="showCreateKuota" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Buat Kuota Baru</h3>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select v-model="form.bulan" class="w-full border rounded-lg px-3 py-2">
                <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input v-model.number="form.tahun" type="number" class="w-full border rounded-lg px-3 py-2">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Kuota</label>
            <input 
              v-model.number="form.kuota" 
              type="number" 
              min="1"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="100"
            >
          </div>
          
          <div class="flex items-center gap-2">
            <input v-model="form.dibuka" type="checkbox" id="dibuka" class="w-4 h-4">
            <label for="dibuka" class="text-sm">Buka pendaftaran langsung</label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            @click="showCreateKuota = false"
            class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitCreate"
            :disabled="!form.kuota || form.kuota < 1"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Edit Kuota -->
    <div v-if="showEditKuota" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-2">Edit Kuota</h3>
        <p class="text-sm text-gray-500 mb-4">{{ currentMonthYear }}</p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Kuota</label>
          <input 
            v-model.number="editForm.kuota" 
            type="number" 
            :min="kuotaAktif?.terdaftar || 0"
            class="w-full border rounded-lg px-3 py-2"
          >
          <p class="text-xs text-gray-500 mt-1" v-if="kuotaAktif?.terdaftar > 0">
            Minimal {{ kuotaAktif.terdaftar }} (sudah terdaftar)
          </p>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            @click="showEditKuota = false"
            class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitEdit"
            :disabled="!editForm.kuota || editForm.kuota < (kuotaAktif?.terdaftar || 0)"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Tolak -->
    <div v-if="showTolakItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-red-600 mb-2">Tolak Pendaftaran</h3>
        <p class="text-gray-600 text-sm mb-4">
          Nomor #{{ showTolakItem.nomor_antrian }} - {{ showTolakItem.nama_pemilik_atm }}
        </p>
        
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
          <textarea 
            v-if="alasanTolak === 'Lainnya'"
            v-model="alasanLainnya"
            rows="2"
            class="w-full border rounded-lg px-3 py-2 mt-2"
            placeholder="Sebutkan alasan..."
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button 
            @click="closeTolakModal"
            class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitTolak"
            :disabled="!alasanTolak || (alasanTolak === 'Lainnya' && !alasanLainnya)"
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg"
          >
            Tolak
          </button>
        </div>
      </div>
    </div>

    <!-- ⭐ MODAL BARU: Pilih Kuota untuk Pendaftaran Manual -->
    <div v-if="showPilihKuota" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div class="bg-purple-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h3 class="text-xl font-bold">Pilih Periode Pendaftaran</h3>
          <button 
            @click="closePilihKuota"
            class="text-white hover:bg-purple-700 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div class="p-6">
          <p class="text-gray-600 text-sm mb-4">
            Pilih kuota yang tersedia untuk didaftarkan manual:
          </p>

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
                  <p 
                    class="font-bold"
                    :class="(k.kuota - (k.terdaftar || 0)) <= 0 ? 'text-red-600' : 'text-green-600'"
                  >
                    {{ k.kuota - (k.terdaftar || 0) }}
                  </p>
                </div>
              </div>

              <p v-if="(k.kuota - (k.terdaftar || 0)) <= 0" class="mt-2 text-xs text-red-600 text-center">
                ⚠️ Kuota penuh - perlu edit kuota terlebih dahulu
              </p>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button 
              @click="closePilihKuota"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
            >
              Batal
            </button>
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

    <!-- Modal: Detail Pendaftaran -->
    <div v-if="detailItem" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">Detail Pendaftaran</h3>
            <p class="text-blue-100 text-sm">Nomor Antrian #{{ detailItem.nomor_antrian }}</p>
          </div>
          <button 
            @click="closeDetail"
            class="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="flex items-center gap-3">
            <span :class="statusClass(detailItem.status)" class="px-3 py-1 rounded-full text-sm font-medium">
              {{ detailItem.status.toUpperCase() }}
            </span>
            <span class="text-gray-500 text-sm">
              Terdaftar: {{ formatTime(detailItem.created_at) }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                👤 Data Pribadi
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Nama:</span>
                  <span class="font-medium">{{ detailItem.nama_pemilik_atm }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Email:</span>
                  <span class="font-medium">{{ detailItem.email || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">WhatsApp:</span>
                  <span class="font-medium">{{ detailItem.whatsapp }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                🏠 Alamat & Kartu
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Kelurahan:</span>
                  <span class="font-medium">{{ detailItem.kelurahan }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">RT/RW:</span>
                  <span class="font-medium">RT {{ detailItem.rt }} / RW {{ detailItem.rw }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Kartu:</span>
                  <span class="font-medium">{{ detailItem.kartu_pemanfaat }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 md:col-span-2">
              <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                📍 Alamat Lengkap
              </h4>
              <p class="text-sm">{{ detailItem.alamat }}</p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                🪪 Nomor Kartu
              </h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-500 block text-xs">Nomor KK:</span>
                  <span class="font-medium font-mono text-lg tracking-wider">{{ detailItem.nomor_kk }}</span>
                </div>
                <div>
                  <span class="text-gray-500 block text-xs">Nomor ATM:</span>
                  <span class="font-medium font-mono text-lg tracking-wider">{{ detailItem.nomor_atm }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                ℹ️ Info Tambahan
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">RPTRA:</span>
                  <span class="font-medium">{{ detailItem.rptra?.nama || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Periode:</span>
                  <span class="font-medium">{{ formatMonthYearFromItem(detailItem) }}</span>
                </div>
                <div v-if="detailItem.alasan_ditolak" class="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                  <span class="font-semibold">Alasan Ditolak:</span><br>
                  {{ detailItem.alasan_ditolak }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t">
            <button 
              @click="downloadQR(detailItem)"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              📥 Download QR
            </button>
            <button 
              v-if="detailItem.status === 'menunggu'"
              @click="updateStatus(detailItem.id, 'selesai'); closeDetail()"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
            >
              ✓ Verifikasi
            </button>
            <button 
              v-if="detailItem.status === 'menunggu'"
              @click="showTolakModal(detailItem); closeDetail()"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
            >
              ✕ Tolak
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { user, isModerator } from '../../composables/useAuth'
import { getAllAntrian, getStats, updateStatusAntrian, getKuotaAktif } from '../../composables/useAntrian'
import { createKuota, updateKuota, toggleKuotaStatus, checkKuotaExists, getAllKuota } from '../../composables/useKuota'
import { supabase } from '../../lib/supabase'
import { formatWIB } from '../../lib/supabase'
import QRCode from 'qrcode'

const router = useRouter()

const antrianList = ref([])
const stats = ref({ total: 0, menunggu: 0, ditolak: 0, selesai: 0 })
const kuotaAktif = ref(null)
const kuotaLoading = ref(false)
const loading = ref(false)

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const showCreateKuota = ref(false)
const showEditKuota = ref(false)
const showTolakItem = ref(null)
const alasanTolak = ref('')
const alasanLainnya = ref('')

// ⭐ STATE BARU: Pilih Kuota Modal
const showPilihKuota = ref(false)
const kuotaList = ref([])
const loadingKuotaList = ref(false)
const selectedKuota = ref(null)

const detailItem = ref(null)

const form = ref({
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  kuota: 100,
  dibuka: false
})

const editForm = ref({ kuota: 100 })

const currentMonthYear = computed(() => {
  const now = new Date()
  return `${months[now.getMonth()]} ${now.getFullYear()}`
})

const sisaKuota = computed(() => {
  if (!kuotaAktif.value) return 0
  return Math.max(0, kuotaAktif.value.kuota - stats.value.total)
})

const statusClass = (status) => ({
  'menunggu': 'bg-yellow-100 text-yellow-700',
  'ditolak': 'bg-red-100 text-red-700',
  'selesai': 'bg-green-100 text-green-700',
  'batal': 'bg-gray-100 text-gray-500'
}[status])


const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  // Parse UTC dari database, convert ke WIB
  const date = new Date(timestamp)
  // WIB = UTC+7
  const wibTime = new Date(date.getTime() + (7 * 60 * 60 * 1000))
  
  return wibTime.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'  // ⭐ Penting: treat sebagai UTC supaya gak di-convert lagi
  }) + ' WIB'
}

const formatMonthYear = (bulan, tahun) => {
  return `${months[bulan - 1]} ${tahun}`
}

const formatMonthYearFromItem = (item) => {
  if (!item.kuota_bulanan) return '-'
  const b = item.kuota_bulanan.bulan
  const t = item.kuota_bulanan.tahun
  return `${months[b - 1]} ${t}`
}

// ⭐ FUNGSI BARU: Buka Modal Pilih Kuota
const openPilihKuotaModal = async () => {
  showPilihKuota.value = true
  loadingKuotaList.value = true
  selectedKuota.value = null
  
  try {
    const result = await getAllKuota(user.value?.rptra_id)
    // Sort: yang ada sisa dulu, then by date desc
    kuotaList.value = (result || []).sort((a, b) => {
      const sisaA = a.kuota - (a.terdaftar || 0)
      const sisaB = b.kuota - (b.terdaftar || 0)
      if (sisaA > 0 && sisaB <= 0) return -1
      if (sisaA <= 0 && sisaB > 0) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  } catch (err) {
    console.error('Error loading kuota:', err)
    alert('Gagal memuat daftar kuota')
  } finally {
    loadingKuotaList.value = false
  }
}

const closePilihKuota = () => {
  showPilihKuota.value = false
  selectedKuota.value = null
}

const pilihKuota = (k) => {
  selectedKuota.value = k
}

const lanjutKeForm = () => {
  if (!selectedKuota.value) return
  
  // Redirect ke halaman form manual
  router.push(`/admin/didaftarkanmanualbyadmin/${selectedKuota.value.id}`)
}

const showDetail = (item) => {
  detailItem.value = { ...item }
}

const closeDetail = () => {
  detailItem.value = null
}

const downloadQR = async (item) => {
  try {
    const qrData = JSON.stringify({
      nomor: item.nomor_antrian,
      kuota_id: item.kuota_id
    })
    
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, qrData, { width: 400, margin: 2 })
    
    const link = document.createElement('a')
    link.download = `QR-Antrian-${item.nomor_antrian.toString().padStart(3, '0')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    alert('Gagal generate QR: ' + err.message)
  }
}

const fetchAntrian = async () => {
  loading.value = true
  try {
    const [antrian, statData, kuota] = await Promise.all([
      getAllAntrian(),
      getStats(),
      getKuotaAktif(user.value.rptra_id)
    ])
    antrianList.value = antrian
    stats.value = statData
    kuotaAktif.value = kuota
    
    if (kuota) {
      const { count } = await supabase
        .from('antrian')
        .select('*', { count: 'exact', head: true })
        .eq('kuota_id', kuota.id)
      
      if (kuotaAktif.value) {
        kuotaAktif.value.terdaftar = count || 0
      }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  try {
    await updateStatusAntrian(id, status)
    await fetchAntrian()
  } catch (err) {
    alert('Gagal update status: ' + err.message)
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
  
  const alasan = alasanTolak.value === 'Lainnya' 
    ? alasanLainnya.value 
    : alasanTolak.value
  
  try {
    await updateStatusAntrian(showTolakItem.value.id, 'ditolak', alasan)
    closeTolakModal()
    await fetchAntrian()
  } catch (err) {
    alert('Gagal menolak: ' + err.message)
  }
}

const toggleKuota = async () => {
  if (!kuotaAktif.value) return
  
  kuotaLoading.value = true
  try {
    await toggleKuotaStatus(kuotaAktif.value.id, kuotaAktif.value.dibuka)
    await fetchAntrian()
  } catch (err) {
    alert('Gagal update kuota: ' + err.message)
  } finally {
    kuotaLoading.value = false
  }
}

const submitCreate = async () => {
  try {
    const exists = await checkKuotaExists(user.value.rptra_id, form.value.bulan, form.value.tahun)
    if (exists) {
      alert('Kuota untuk bulan ini sudah ada!')
      return
    }
    
    await createKuota({
      ...form.value,
      rptra_id: user.value.rptra_id
    })
    
    showCreateKuota.value = false
    form.value = {
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
      kuota: 100,
      dibuka: false
    }
    await fetchAntrian()
    alert('Kuota berhasil dibuat!')
  } catch (err) {
    alert('Gagal buat kuota: ' + err.message)
  }
}

const submitEdit = async () => {
  if (!kuotaAktif.value) return
  
  try {
    await updateKuota(kuotaAktif.value.id, { kuota: editForm.value.kuota })
    showEditKuota.value = false
    await fetchAntrian()
    alert('Kuota berhasil diupdate!')
  } catch (err) {
    alert('Gagal update kuota: ' + err.message)
  }
}

watch(showEditKuota, (val) => {
  if (val && kuotaAktif.value) {
    editForm.value.kuota = kuotaAktif.value.kuota
  }
})

onMounted(fetchAntrian)
</script>