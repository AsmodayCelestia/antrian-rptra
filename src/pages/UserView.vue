<template>
  <div class="min-h-screen bg-gray-50">

    <div class="max-w-2xl mx-auto p-6 space-y-6">
      
      <!-- Info Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 text-center">
        <h2 class="text-xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
        <p class="text-gray-600 mb-4">
          Sistem pendaftaran online untuk program pangan bersubsidi RPTRA. 
        </p>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm text-yellow-800">
          <p class="font-bold mb-2">📋 Persyaratan:</p>
          <ul class="space-y-1 list-disc list-inside">
            <li>Memiliki Kartu Pemanfaat (KJP, PJLP, dll)</li>
            <li>KK dan KTP asli</li>
            <li>Nomor WhatsApp aktif</li>
          </ul>
        </div>
      </div>

      <!-- Pilih Tipe Kuota -->
      <div v-if="!selectedTipe" class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">Pilih Jenis Pendaftaran</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="selectedTipe = 'umum'"
            class="border-2 border-blue-200 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl p-6 text-center transition-all"
          >
            <div class="text-4xl mb-3">👥</div>
            <h4 class="font-bold text-gray-800">Umum</h4>
            <p class="text-sm text-gray-600 mt-1">KJP, Kartu Anak, Kartu Lansia, dll</p>
          </button>
          
          <button 
            @click="selectedTipe = 'pjlp'"
            class="border-2 border-green-200 hover:border-green-500 bg-green-50 hover:bg-green-100 rounded-xl p-6 text-center transition-all"
          >
            <div class="text-4xl mb-3">🏢</div>
            <h4 class="font-bold text-gray-800">PJLP</h4>
            <p class="text-sm text-gray-600 mt-1">Khusus PJLP</p>
          </button>
        </div>
      </div>

      <!-- QR Scanner Section -->
      <div v-else class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">
            Scan QR Code {{ selectedTipe === 'pjlp' ? 'PJLP' : 'Umum' }}
          </h3>
          <button 
            @click="selectedTipe = null"
            class="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Ganti Tipe
          </button>
        </div>
        
        <div v-if="!scanning && !scannedKuota" class="text-center py-8">
          <div class="text-6xl mb-4">📷</div>
          <button 
            @click="startScan" 
            class="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform active:scale-95 transition-all"
          >
            📱 Buka Kamera & Scan QR
          </button>
          <p class="text-gray-500 text-sm mt-4">
            Arahkan kamera ke QR code pendaftaran {{ selectedTipe === 'pjlp' ? 'PJLP' : 'umum' }} yang dibagikan petugas
          </p>
        </div>

        <div v-else-if="scanning" class="relative">
          <div ref="qrReaderRef" class="w-64 h-64 mx-auto rounded-lg overflow-hidden bg-black"></div>
          <button 
            @click="stopScan" 
            class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm z-10"
          >
            ✕ Batal
          </button>
          <p class="text-center text-sm text-gray-500 mt-2">Arahkan QR code ke kamera</p>
        </div>

        <div v-else-if="scannedKuota" class="text-center py-4">
          <div class="text-4xl mb-2">✅</div>
          <p class="text-green-600 font-bold mb-2">QR Code Terdeteksi!</p>
          <p class="text-gray-600 text-sm mb-4">
            Periode: {{ formatMonthYear(scannedKuota.bulan, scannedKuota.tahun) }}
            <span v-if="scannedKuota.tipe_kuota" :class="tipeBadgeClass" class="ml-2 px-2 py-0.5 rounded text-xs">
              {{ scannedKuota.tipe_kuota.toUpperCase() }}
            </span>
          </p>
          <div class="flex gap-3">
            <button 
              @click="resetScan"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium"
            >
              Scan Ulang
            </button>
            <button 
              @click="keFormPendaftaran"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
            >
              Lanjutkan ➔
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import { getKuotaById } from '../composables/useKuota'

const router = useRouter()
const qrReaderRef = ref(null)
const html5QrCode = ref(null)
const scanning = ref(false)
const scannedKuota = ref(null)
const selectedTipe = ref(null)

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const tipeBadgeClass = computed(() => ({
  'umum': 'bg-blue-100 text-blue-700',
  'pjlp': 'bg-green-100 text-green-700'
}[scannedKuota.value?.tipe_kuota] || 'bg-gray-100'))

const formatMonthYear = (bulan, tahun) => {
  return `${months[bulan - 1]} ${tahun}`
}

const startScan = async () => {
  scanning.value = true
  scannedKuota.value = null
  
  await nextTick()
  
  setTimeout(async () => {
    try {
      if (!qrReaderRef.value) {
        scanning.value = false
        return
      }
      
      const elementId = 'qr-reader-' + Date.now()
      qrReaderRef.value.id = elementId
      
      html5QrCode.value = new Html5Qrcode(elementId)
      
      await html5QrCode.value.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          handleScanResult(decodedText)
        },
        () => {}
      )
    } catch (err) {
      console.error('Start scan error:', err)
      alert('Gagal memulai kamera: ' + err.message)
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
    let kuotaId = null
    
    const urlMatch = qrText.match(/\/daftar\/([a-f0-9-]{36})/i)
    if (urlMatch) {
      kuotaId = urlMatch[1]
    } else if (qrText.match(/^[a-f0-9-]{36}$/i)) {
      kuotaId = qrText
    } else {
      throw new Error('Format QR tidak valid')
    }
    
    const kuota = await getKuotaById(kuotaId)
    if (!kuota) {
      throw new Error('Kuota tidak ditemukan')
    }
    
    if (kuota.tipe_kuota !== selectedTipe.value) {
      throw new Error(`QR code ini untuk kuota ${kuota.tipe_kuota.toUpperCase()}. Silakan pilih tipe yang sesuai.`)
    }
    
    await stopScan()
    scannedKuota.value = kuota
    
  } catch (err) {
    console.error('QR Error:', err)
    alert('QR Code tidak valid: ' + err.message)
    await stopScan()
  }
}

const resetScan = () => {
  scannedKuota.value = null
}

const keFormPendaftaran = () => {
  if (!scannedKuota.value) return
  router.push(`/daftar/${scannedKuota.value.id}`)
}
</script>