<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Manajemen Kuota Bulanan</h1>
        <p class="text-gray-500">Atur kuota pendaftaran untuk setiap bulan</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <span>➕</span> Buat Kuota Baru
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin text-4xl mb-4">⏳</div>
      <p>Memuat data...</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan/Tahun</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kuota</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Terdaftar</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sisa</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jadwal (WIB)</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">QR Code</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in kuotaList" :key="item.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-medium">{{ formatMonthYear(item.bulan, item.tahun) }}</div>
                <div class="text-xs text-gray-500">{{ item.rptra?.nama || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-center font-bold">{{ item.kuota }}</td>
              <td class="px-4 py-3 text-center" :class="item.terdaftar > 0 ? 'text-blue-600' : 'text-gray-400'">
                {{ item.terdaftar || 0 }}
              </td>
              <td class="px-4 py-3 text-center font-medium" :class="getSisaClass(item)">
                {{ (item.kuota || 0) - (item.terdaftar || 0) }}
              </td>
              <td class="px-4 py-3 text-center">
                <button 
                  @click="toggleStatus(item)"
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    item.dibuka 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  ]"
                >
                  {{ item.dibuka ? '🔓 Dibuka' : '🔒 Ditutup' }}
                </button>
              </td>
              <td class="px-4 py-3 text-center text-xs">
                <div v-if="item.target_open_time && item.target_close_time">
                  <div class="text-gray-600">{{ formatWIB(item.target_open_time) }}</div>
                  <div class="text-gray-400">s/d</div>
                  <div class="text-gray-600">{{ formatWIB(item.target_close_time) }}</div>
                </div>
                <div v-else class="text-gray-400">Manual</div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex flex-col items-center gap-2">
                  <img 
                    v-if="item.qr_form_url" 
                    :src="item.qr_form_url" 
                    class="w-16 h-16 rounded"
                    alt="QR Code"
                  >
                  <div v-else class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No QR
                  </div>
                  <div class="flex gap-1">
                    <button 
                      v-if="item.qr_form_url"
                      @click="downloadQR(item)"
                      class="text-xs text-blue-600 underline"
                    >
                      Download
                    </button>
                    <button 
                      @click="copyLink(item)"
                      class="text-xs text-gray-500 underline"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <button 
                    @click="editKuota(item)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit Kuota"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="confirmDelete(item)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus Kuota"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            
            <tr v-if="!kuotaList || kuotaList.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                <div class="text-4xl mb-2">📭</div>
                <p>Belum ada kuota. Klik "Buat Kuota Baru" untuk mulai.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create Kuota -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">Buat Kuota Baru</h3>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select v-model="form.bulan" class="w-full border rounded-lg px-3 py-2 bg-white">
                <option v-for="(month, index) in months" :key="index" :value="index + 1">
                  {{ month }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input 
                v-model.number="form.tahun" 
                type="number" 
                class="w-full border rounded-lg px-3 py-2"
                min="2024"
                max="2030"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Kuota *</label>
            <input 
              v-model.number="form.kuota" 
              type="number" 
              min="1"
              required
              class="w-full border rounded-lg px-3 py-2"
              placeholder="Contoh: 100"
            >
          </div>

          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-800 mb-3">⏰ Jadwal Otomatis (Opsional)</h4>
            <p class="text-xs text-gray-500 mb-3">
              Kosongkan untuk kontrol manual. Isi untuk auto open/close.
            </p>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Buka Pendaftaran (WIB)</label>
                <input 
                  v-model="form.target_open_time" 
                  type="datetime-local"
                  class="w-full border rounded-lg px-3 py-2"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tutup Pendaftaran (WIB)</label>
                <input 
                  v-model="form.target_close_time" 
                  type="datetime-local"
                  class="w-full border rounded-lg px-3 py-2"
                >
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input 
              v-model="form.dibuka" 
              type="checkbox" 
              id="bukaPendaftaran"
              class="w-4 h-4 text-blue-600 rounded"
            >
            <label for="bukaPendaftaran" class="text-sm text-gray-700">
              Buka pendaftaran sekarang (manual)
            </label>
          </div>
          
          <p v-if="form.target_open_time && !form.dibuka" class="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ Pendaftaran akan otomatis terbuka sesuai jadwal WIB
          </p>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            @click="closeCreateModal"
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitCreate"
            :disabled="!isFormValid || checkingExists"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg"
          >
            {{ checkingExists ? 'Mengecek...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Edit Kuota -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-2">Edit Kuota</h3>
        <p class="text-sm text-gray-500 mb-4">{{ formatMonthYear(editingItem.bulan, editingItem.tahun) }}</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Kuota</label>
            <input 
              v-model.number="editForm.kuota" 
              type="number" 
              :min="editingItem.terdaftar || 0"
              class="w-full border rounded-lg px-3 py-2"
            >
            <p class="text-xs text-gray-500 mt-1" v-if="editingItem.terdaftar > 0">
              Minimal {{ editingItem.terdaftar }} (sudah terdaftar)
            </p>
          </div>

          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-800 mb-3">⏰ Jadwal Otomatis</h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Buka Pendaftaran (WIB)</label>
                <input 
                  v-model="editForm.target_open_time" 
                  type="datetime-local"
                  class="w-full border rounded-lg px-3 py-2"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tutup Pendaftaran (WIB)</label>
                <input 
                  v-model="editForm.target_close_time" 
                  type="datetime-local"
                  class="w-full border rounded-lg px-3 py-2"
                >
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input 
              v-model="editForm.dibuka" 
              type="checkbox" 
              id="editBukaPendaftaran"
              class="w-4 h-4 text-blue-600 rounded"
            >
            <label for="editBukaPendaftaran" class="text-sm text-gray-700">
              Buka pendaftaran
            </label>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            @click="closeEditModal"
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitEdit"
            :disabled="!isEditValid"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Delete Confirmation -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-center">
        <div class="text-4xl mb-2">⚠️</div>
        <h3 class="text-xl font-bold text-red-600 mb-2">Hapus Kuota?</h3>
        
        <p class="text-gray-600 mb-4">
          Kuota <strong>{{ formatMonthYear(deletingItem.bulan, deletingItem.tahun) }}</strong> akan dihapus permanen.
        </p>
        
        <div v-if="deletingItem.terdaftar > 0" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-red-700">
            ⚠️ Perhatian: Ada <strong>{{ deletingItem.terdaftar }}</strong> pendaftar!<br>
            Semua data antrian akan ikut terhapus.
          </p>
        </div>

        <div class="flex gap-3">
          <button 
            @click="closeDeleteModal"
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="submitDelete"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { user } from '../../composables/useAuth'
import QRCode from 'qrcode'
import { uploadQR } from '../../lib/cloudinary'
import { 
  getAllKuota, 
  createKuota, 
  updateKuota, 
  deleteKuota,
  toggleKuotaStatus,
  checkKuotaExists,
  toDateTimeLocal,
  fromDateTimeLocal
} from '../../composables/useKuota'
import { formatWIB } from '../../lib/supabase' // ⭐ Import langsung dari supabase.js

const kuotaList = ref([])
const loading = ref(false)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const checkingExists = ref(false)

const form = ref({
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  kuota: 100,
  dibuka: false,
  target_open_time: '',
  target_close_time: ''
})

const editForm = ref({
  kuota: 100,
  dibuka: false,
  target_open_time: '',
  target_close_time: ''
})

const editingItem = ref(null)
const deletingItem = ref(null)

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const isFormValid = computed(() => {
  return form.value.kuota && form.value.kuota >= 1 && form.value.tahun >= 2024
})

const isEditValid = computed(() => {
  const minKuota = editingItem.value?.terdaftar || 0
  return editForm.value.kuota && editForm.value.kuota >= minKuota
})

const formatMonthYear = (bulan, tahun) => {
  return `${months[bulan - 1]} ${tahun}`
}

const getSisaClass = (item) => {
  const sisa = (item.kuota || 0) - (item.terdaftar || 0)
  if (sisa <= 0) return 'text-red-600 font-bold'
  if (sisa <= 5) return 'text-orange-600'
  return 'text-green-600'
}

const fetchKuotaList = async () => {
  loading.value = true
  try {
    const result = await getAllKuota(user.value?.rptra_id)
    kuotaList.value = result || []
  } catch (err) {
    console.error('Error fetching kuota:', err)
    alert('Gagal memuat data kuota: ' + err.message)
    kuotaList.value = []
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  const now = new Date()
  form.value = {
    bulan: now.getMonth() + 1,
    tahun: now.getFullYear(),
    kuota: 100,
    dibuka: false,
    target_open_time: '',
    target_close_time: ''
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const submitCreate = async () => {
  checkingExists.value = true
  try {
    const exists = await checkKuotaExists(user.value.rptra_id, form.value.bulan, form.value.tahun)
    if (exists) {
      alert(`Kuota untuk ${formatMonthYear(form.value.bulan, form.value.tahun)} sudah ada!`)
      return
    }

    const kuotaData = {
      ...form.value,
      rptra_id: user.value.rptra_id,
      target_open_time: form.value.target_open_time ? fromDateTimeLocal(form.value.target_open_time) : null,
      target_close_time: form.value.target_close_time ? fromDateTimeLocal(form.value.target_close_time) : null
    }

    const newKuota = await createKuota(kuotaData)

    const qrUrl = `${window.location.origin}/daftar/${newKuota.id}`
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, qrUrl, { width: 400, margin: 2 })
    
    const base64Image = qrCanvas.toDataURL('image/png')
    const uploadResult = await uploadQR(base64Image, newKuota.id)

    await updateKuota(newKuota.id, {
      qr_form_url: uploadResult.secure_url,
      qr_form_public_id: uploadResult.public_id
    })

    closeCreateModal()
    await fetchKuotaList()
    alert('Kuota berhasil dibuat! QR Code sudah tersedia.')
  } catch (err) {
    console.error('Create error:', err)
    alert('Gagal membuat kuota: ' + err.message)
  } finally {
    checkingExists.value = false
  }
}

const editKuota = (item) => {
  editingItem.value = { ...item }
  editForm.value = {
    kuota: item.kuota,
    dibuka: item.dibuka,
    target_open_time: toDateTimeLocal(item.target_open_time),
    target_close_time: toDateTimeLocal(item.target_close_time)
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingItem.value = null
}

const submitEdit = async () => {
  try {
    const updateData = {
      kuota: editForm.value.kuota,
      dibuka: editForm.value.dibuka,
      target_open_time: editForm.value.target_open_time ? fromDateTimeLocal(editForm.value.target_open_time) : null,
      target_close_time: editForm.value.target_close_time ? fromDateTimeLocal(editForm.value.target_close_time) : null
    }

    await updateKuota(editingItem.value.id, updateData)

    closeEditModal()
    await fetchKuotaList()
    alert('Kuota berhasil diupdate!')
  } catch (err) {
    alert('Gagal mengupdate kuota: ' + err.message)
  }
}

const confirmDelete = (item) => {
  deletingItem.value = { ...item }
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingItem.value = null
}

const submitDelete = async () => {
  try {
    await deleteKuota(deletingItem.value.id)
    closeDeleteModal()
    await fetchKuotaList()
    alert('Kuota berhasil dihapus!')
  } catch (err) {
    alert('Gagal menghapus kuota: ' + err.message)
  }
}

const toggleStatus = async (item) => {
  try {
    await toggleKuotaStatus(item.id, item.dibuka)
    await fetchKuotaList()
  } catch (err) {
    alert('Gagal mengubah status: ' + err.message)
  }
}

const downloadQR = (item) => {
  if (!item.qr_form_url) {
    alert('QR Code belum tersedia')
    return
  }
  
  const a = document.createElement('a')
  a.href = item.qr_form_url
  a.download = `qr-pendaftaran-${item.bulan}-${item.tahun}.png`
  a.target = '_blank'
  a.click()
}

const copyLink = (item) => {
  const link = `${window.location.origin}/daftar/${item.id}`
  navigator.clipboard.writeText(link)
  alert('Link disalin: ' + link)
}

onMounted(() => {
  fetchKuotaList()
})
</script>