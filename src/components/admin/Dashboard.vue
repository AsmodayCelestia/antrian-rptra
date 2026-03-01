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
      <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-600">
        <p class="text-gray-500 text-sm">Dipanggil</p>
        <p class="text-2xl font-bold text-blue-600">{{ stats.dipanggil }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
        <p class="text-gray-500 text-sm">Selesai</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.selesai }}</p>
      </div>
    </div>

    <!-- Kuota Control -->
    <div v-if="!isModerator" class="bg-white rounded-xl shadow-lg p-6 mb-6">
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
    </div>

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
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
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
              <td class="px-4 py-3 text-xs text-gray-500">
                {{ formatTime(item.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button 
                    v-if="item.status === 'menunggu'"
                    @click="updateStatus(item.id, 'dipanggil')"
                    class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    Panggil
                  </button>
                  <button 
                    v-if="item.status === 'dipanggil'"
                    @click="updateStatus(item.id, 'selesai')"
                    class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Selesai
                  </button>
                  <button 
                    v-if="item.status !== 'batal'"
                    @click="updateStatus(item.id, 'batal')"
                    class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-200"
                  >
                    Batal
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="antrianList.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { user, isModerator } from '../../composables/useAuth'
import { getAllAntrian, getStats, updateStatusAntrian, getKuotaAktif } from '../../composables/useAntrian'
import { createKuota, updateKuota, toggleKuotaStatus, checkKuotaExists } from '../../composables/useKuota'
import { supabase } from '../../lib/supabase'

const antrianList = ref([])
const stats = ref({ total: 0, menunggu: 0, dipanggil: 0, selesai: 0 })
const kuotaAktif = ref(null)
const kuotaLoading = ref(false)
const loading = ref(false)

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const showCreateKuota = ref(false)
const showEditKuota = ref(false)

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
  'dipanggil': 'bg-blue-100 text-blue-700',
  'selesai': 'bg-green-100 text-green-700',
  'batal': 'bg-gray-100 text-gray-500'
}[status])

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
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