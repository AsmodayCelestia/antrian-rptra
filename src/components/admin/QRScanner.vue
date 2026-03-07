<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6 text-center">Verifikasi Pengambilan Sembako</h1>

    <!-- Scanner -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div v-if="!scanning && !scannedData" class="text-center py-8">
        <div class="text-6xl mb-4">📷</div>
        <button 
          @click="startScan" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Mulai Scan QR
        </button>
        <p class="text-gray-500 text-sm mt-2">atau input manual di bawah</p>
      </div>
      
      <div v-else-if="scanning" class="relative">
        <div ref="qrReaderRef" class="w-64 h-64 mx-auto rounded-lg overflow-hidden bg-black"></div>
        <button 
          @click="stopScan" 
          class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm z-10"
        >
          ✕ Batal
        </button>
        <p class="text-center text-sm text-gray-500 mt-2">Arahkan QR Code ke kamera</p>
      </div>
    </div>

    <!-- Manual Input -->
    <div v-if="!scannedData" class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 class="font-semibold mb-4 text-gray-700">Input Manual</h3>
      <div class="space-y-3">
        <div>
          <label class="text-sm text-gray-600">Nomor Antrian</label>
          <input 
            v-model="manualNomor" 
            type="number" 
            placeholder="Contoh: 12"
            class="w-full border rounded-lg px-4 py-2 mt-1"
          >
        </div>
        <div>
          <label class="text-sm text-gray-600">Bulan/Kuota</label>
          <select v-model="manualKuota" class="w-full border rounded-lg px-4 py-2 mt-1 bg-white">
            <option v-for="k in kuotaOptions" :key="k.id" :value="k.id">
              {{ formatMonthYear(k.bulan, k.tahun) }} - {{ k.rptra?.nama }}
            </option>
          </select>
        </div>
        <button 
          @click="cariManual" 
          :disabled="!manualNomor || !manualKuota || loading"
          class="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2 rounded-lg font-medium"
        >
          {{ loading ? 'Mencari...' : 'Cari Data' }}
        </button>
      </div>
    </div>

    <!-- Hasil Scan/Data -->
    <div v-if="scannedData" class="bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- Header Status -->
      <div 
        :class="{
          'bg-yellow-500': scannedData.status === 'menunggu',
          'bg-green-500': scannedData.status === 'selesai',
          'bg-red-500': scannedData.status === 'ditolak',
          'bg-gray-500': scannedData.status === 'batal'
        }" 
        class="text-white p-4 text-center"
      >
        <div class="text-5xl font-bold mb-1">
          #{{ scannedData.nomor_antrian.toString().padStart(3, '0') }}
        </div>
        <div class="text-white/90 text-sm uppercase tracking-wide">
          {{ scannedData.status }}
        </div>
      </div>

      <!-- Detail Data -->
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500 text-xs uppercase">Nama Pemilik ATM</p>
            <p class="font-semibold text-gray-800">{{ scannedData.nama_pemilik_atm }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase">No. ATM</p>
            <p class="font-semibold text-gray-800">{{ scannedData.nomor_atm }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase">Kartu Pemanfaat</p>
            <p class="font-semibold text-gray-800">{{ scannedData.kartu_pemanfaat }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase">Kelurahan</p>
            <p class="font-semibold text-gray-800">{{ scannedData.kelurahan }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-gray-500 text-xs uppercase">Alamat</p>
            <p class="font-semibold text-gray-800">{{ scannedData.alamat }} RT {{ scannedData.rt }}/RW {{ scannedData.rw }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase">WhatsApp</p>
            <p class="font-semibold text-gray-800">{{ scannedData.whatsapp }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase">No. KK</p>
            <p class="font-semibold text-gray-800">{{ scannedData.nomor_kk }}</p>
          </div>
        </div>

        <!-- Alasan Ditolak (kalo status ditolak) -->
        <div v-if="scannedData.status === 'ditolak'" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700 font-semibold mb-1">❌ Ditolak</p>
          <p class="text-red-600 text-sm">{{ scannedData.alasan_ditolak || 'Tidak ada keterangan' }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 border-t space-y-3">
          <!-- Belum diproses (menunggu) -->
          <template v-if="scannedData.status === 'menunggu'">
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="showTolakModal = true"
                class="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all"
              >
                ❌ TOLAK
              </button>
              <button 
                @click="verifikasiPengambilan"
                :disabled="verifying"
                class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all"
              >
                {{ verifying ? '...' : '✓ VERIFIKASI' }}
              </button>
            </div>
            <p class="text-center text-xs text-gray-500">
              Pilih "TOLAK" jika data tidak valid / warga tidak berhak
            </p>
          </template>

          <!-- Sudah selesai -->
          <div v-else-if="scannedData.status === 'selesai'" class="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <div class="text-4xl mb-2">✅</div>
            <p class="font-bold text-green-800">Sudah Diambil</p>
            <p class="text-sm text-green-600 mt-1">
              {{ formatDate(scannedData.selesai_at) }}
            </p>
          </div>

          <!-- Sudah ditolak -->
          <div v-else-if="scannedData.status === 'ditolak'" class="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <div class="text-4xl mb-2">🚫</div>
            <p class="font-bold text-red-800">Pendaftaran Ditolak</p>
          </div>

          <!-- Batal -->
          <div v-else class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center text-gray-500">
            <div class="text-4xl mb-2">⛔</div>
            <p class="font-bold">Antrian Dibatalkan</p>
          </div>

          <button 
            @click="resetScan"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium"
          >
            Scan Lainnya
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tolak -->
    <div v-if="showTolakModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-red-600 mb-2">Tolak Pendaftaran</h3>
        <p class="text-gray-600 text-sm mb-4">
          Nomor Antrian #{{ scannedData?.nomor_antrian }} akan ditolak.
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
            <option value="Nomor antrian hangus">Nomor antrian hangus (melewati waktu)</option>
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
            @click="showTolakModal = false"
            class="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
          >
            Batal
          </button>
          <button 
            @click="tolakPendaftaran"
            :disabled="!alasanTolak || (alasanTolak === 'Lainnya' && !alasanLainnya)"
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg"
          >
            Ya, Tolak
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center mt-4">
      <div class="text-2xl mb-2">⚠️</div>
      <p>{{ error }}</p>
      <button 
        @click="error = null" 
        class="mt-2 text-sm text-red-600 underline"
      >
        Tutup
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { updateStatusAntrian } from '../../composables/useAntrian'
import { getAllKuota } from '../../composables/useKuota'
import { user } from '../../composables/useAuth'
import { supabase } from '../../lib/supabase'

const qrReaderRef = ref(null)
const html5QrCode = ref(null)
const scanning = ref(false)
const scannedData = ref(null)
const error = ref(null)
const loading = ref(false)
const verifying = ref(false)

const manualNomor = ref('')
const manualKuota = ref('')
const kuotaOptions = ref([])

// Modal Tolak
const showTolakModal = ref(false)
const alasanTolak = ref('')
const alasanLainnya = ref('')

const formatMonthYear = (bulan, tahun) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${months[bulan - 1]} ${tahun}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchAntrianData = async (nomor, kuota_id) => {
  loading.value = true
  error.value = null
  
  try {
    const { data, error: supaError } = await supabase
      .from('antrian')
      .select('*, rptra(nama), kuota_bulanan(bulan, tahun)')
      .eq('nomor_antrian', parseInt(nomor, 10))
      .eq('kuota_id', kuota_id)
      .maybeSingle()
    
    if (supaError) throw supaError
    
    if (!data) {
      error.value = 'Data antrian tidak ditemukan'
      return false
    }
    
    scannedData.value = data
    return true
  } catch (err) {
    console.error('Fetch error:', err)
    error.value = 'Gagal mengambil data: ' + err.message
    return false
  } finally {
    loading.value = false
  }
}

const startScan = async () => {
  error.value = null
  scanning.value = true
  
  await nextTick()
  
  setTimeout(async () => {
    try {
      if (!qrReaderRef.value) {
        error.value = 'Scanner element tidak ready'
        scanning.value = false
        return
      }
      
      const elementId = 'qr-reader-' + Date.now()
      qrReaderRef.value.id = elementId
      
      html5QrCode.value = new Html5Qrcode(elementId)
      
      await html5QrCode.value.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 }
        },
        (decodedText) => {
          console.log('QR Code detected:', decodedText)
          handleScanResult(decodedText)
        },
        () => {}
      )
    } catch (err) {
      console.error('Start scan error:', err)
      error.value = 'Gagal memulai kamera: ' + err.message
      scanning.value = false
    }
  }, 100)
}

const stopScan = async () => {
  scanning.value = false
  
  if (html5QrCode.value) {
    try {
      await html5QrCode.value.stop()
      await html5QrCode.value.clear()
    } catch (e) {
      console.log('Stop scan error:', e)
    }
    html5QrCode.value = null
  }
}

const handleScanResult = async (qrText) => {
  try {
    let nomor, kuota_id
    
    try {
      const parsed = JSON.parse(qrText.trim())
      nomor = parsed.nomor
      kuota_id = parsed.kuota_id
    } catch {
      const parts = qrText.trim().split('|')
      if (parts.length === 2) {
        nomor = parts[0]
        kuota_id = parts[1]
      } else {
        throw new Error('Format QR tidak dikenali')
      }
    }
    
    if (!nomor || !kuota_id) {
      throw new Error('Data QR tidak lengkap')
    }
    
    await stopScan()
    await fetchAntrianData(nomor, kuota_id)
    
  } catch (err) {
    console.error('QR Error:', err)
    error.value = 'QR Code tidak valid: ' + err.message
    await stopScan()
  }
}

const cariManual = async () => {
  if (!manualNomor.value || !manualKuota.value) return
  await fetchAntrianData(manualNomor.value, manualKuota.value)
}

const verifikasiPengambilan = async () => {
  if (!scannedData.value) return
  
  verifying.value = true
  
  try {
    await updateStatusAntrian(scannedData.value.id, 'selesai')
    await fetchAntrianData(scannedData.value.nomor_antrian, scannedData.value.kuota_id)
  } catch (err) {
    alert('Gagal verifikasi: ' + err.message)
  } finally {
    verifying.value = false
  }
}

const tolakPendaftaran = async () => {
  if (!scannedData.value) return
  
  const alasan = alasanTolak.value === 'Lainnya' 
    ? alasanLainnya.value 
    : alasanTolak.value
  
  verifying.value = true
  
  try {
    await updateStatusAntrian(scannedData.value.id, 'ditolak', alasan)
    showTolakModal.value = false
    alasanTolak.value = ''
    alasanLainnya.value = ''
    await fetchAntrianData(scannedData.value.nomor_antrian, scannedData.value.kuota_id)
  } catch (err) {
    alert('Gagal menolak: ' + err.message)
  } finally {
    verifying.value = false
  }
}

const resetScan = () => {
  scannedData.value = null
  error.value = null
  manualNomor.value = ''
  alasanTolak.value = ''
  alasanLainnya.value = ''
}

onMounted(async () => {
  kuotaOptions.value = await getAllKuota(user.value?.rptra_id)
  if (kuotaOptions.value.length > 0) {
    manualKuota.value = kuotaOptions.value[0].id
  }
})

onUnmounted(async () => {
  await stopScan()
})
</script>