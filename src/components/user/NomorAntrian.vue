<template>
  <div class="max-w-2xl mx-auto p-6">
    <div v-if="loading" class="text-center py-20">
      <div class="animate-spin text-4xl mb-4">⏳</div>
      <p class="text-gray-600">Memuat data...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 text-red-600 p-6 rounded-xl text-center">
      <p class="text-lg font-semibold mb-2">❌ {{ error }}</p>
      <router-link to="/" class="text-blue-600 hover:underline">Kembali</router-link>
    </div>
    
    <div v-else class="bg-white rounded-xl shadow-lg p-8 text-center">
      <div class="mb-6">
        <span class="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
          ✓ Pendaftaran Berhasil
        </span>
      </div>
      
      <h2 class="text-gray-600 mb-2">Nomor Antrian Anda</h2>
      <div class="text-6xl font-bold text-blue-600 mb-6">
        {{ antrian?.nomor_antrian?.toString().padStart(3, '0') }}
      </div>
      
      <!-- QR Code -->
      <div class="bg-gray-50 p-6 rounded-xl mb-6 inline-block">
        <canvas ref="qrCanvas" class="mx-auto"></canvas>
        <p class="text-xs text-gray-500 mt-2">Scan saat pengambilan</p>
      </div>
      
      <!-- Detail -->
      <div class="text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Kartu:</span>
          <span class="font-medium">{{ antrian?.kartu_pemanfaat }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Nama:</span>
          <span class="font-medium">{{ antrian?.nama_pemilik_atm }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Kelurahan:</span>
          <span class="font-medium">{{ antrian?.kelurahan }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">No. ATM:</span>
          <span class="font-medium">{{ antrian?.nomor_atm }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">WhatsApp:</span>
          <span class="font-medium">{{ antrian?.whatsapp }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Status:</span>
          <span :class="statusClass" class="font-medium px-2 py-0.5 rounded text-xs">
            {{ antrian?.status?.toUpperCase() }}
          </span>
        </div>
      </div>
      
      <div class="mt-6 space-y-3">
        <button 
          @click="downloadQR"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
        >
          📥 Download QR
        </button>
        <router-link 
          to="/" 
          class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg"
        >
          Kembali
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getAntrianById } from '../../composables/useAntrian'
import QRCode from 'qrcode'

const route = useRoute()
const antrian = ref(null)
const loading = ref(true)
const error = ref('')
const qrCanvas = ref(null)

const statusClass = computed(() => ({
  'menunggu': 'bg-yellow-100 text-yellow-700',
  'dipanggil': 'bg-blue-100 text-blue-700',
  'selesai': 'bg-green-100 text-green-700'
}[antrian.value?.status] || 'bg-gray-100'))

const generateQR = async () => {
  if (!qrCanvas.value || !antrian.value) {
    console.log('Canvas or antrian not ready')
    return
  }
  
  const qrData = JSON.stringify({
    nomor: antrian.value.nomor_antrian,
    kuota_id: antrian.value.kuota_id
  })
  
  try {
    await QRCode.toCanvas(qrCanvas.value, qrData, { width: 200, margin: 2 })
    console.log('QR generated')
  } catch (err) {
    console.error('QR gen failed:', err)
  }
}

const downloadQR = () => {
  if (!qrCanvas.value) return
  const link = document.createElement('a')
  link.download = `antrian-${antrian.value.nomor_antrian}.png`
  link.href = qrCanvas.value.toDataURL()
  link.click()
}

onMounted(async () => {
  try {
    const data = await getAntrianById(route.params.id)
    antrian.value = data
    await nextTick()
    setTimeout(generateQR, 100)
  } catch (err) {
    error.value = 'Data tidak ditemukan'
  } finally {
    loading.value = false
  }
})
</script>