<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin text-4xl mb-4">⏳</div>
        <p>Memuat data...</p>
      </div>

      <!-- Schedule Not Open Yet -->
      <div v-else-if="scheduleStatus === 'not_yet_open'" class="bg-orange-50 text-orange-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">⏰</div>
        <h3 class="font-bold text-lg mb-2">Pendaftaran Belum Dibuka</h3>
        <p class="mb-4">Pendaftaran akan dibuka pada:</p>
        <p class="text-xl font-bold mb-4">{{ formatWIB(kuota.target_open_time) }}</p>
        <p class="text-sm">Silakan kembali lagi nanti.</p>
      </div>

      <!-- Schedule Already Closed -->
      <div v-else-if="scheduleStatus === 'already_closed'" class="bg-red-50 text-red-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">🔒</div>
        <h3 class="font-bold text-lg mb-2">Pendaftaran Sudah Ditutup</h3>
        <p class="mb-4">Pendaftaran ditutup pada:</p>
        <p class="text-xl font-bold mb-4">{{ formatWIB(kuota.target_close_time) }}</p>
        <router-link to="/" class="text-blue-600 hover:underline">
          Kembali ke Beranda
        </router-link>
      </div>

      <!-- Manual Closed -->
      <div v-else-if="scheduleStatus === 'manual_closed'" class="bg-red-50 text-red-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">🔒</div>
        <h3 class="font-bold text-lg">{{ errorMessage }}</h3>
        <router-link to="/" class="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke Beranda
        </router-link>
      </div>

      <!-- Full -->
      <div v-else-if="scheduleStatus === 'full'" class="bg-red-50 text-red-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">📛</div>
        <h3 class="font-bold text-lg">Kuota Penuh</h3>
        <p class="mt-2">Semua kuota telah terisi. Silakan tunggu periode berikutnya.</p>
      </div>

      <!-- Available -->
      <div v-else-if="isAvailable">
        <div class="bg-blue-600 text-white rounded-xl p-6 mb-6 text-center">
          <h1 class="text-2xl font-bold mb-2">Pendaftaran Antrian</h1>
          <p class="text-blue-100">{{ kuota.rptra?.nama }}</p>
          <!-- <p class="font-medium text-lg">{{ formatMonthYear(kuota.bulan, kuota.tahun) }}</p>
          
          <div v-if="kuota.target_close_time" class="mt-3 bg-white/20 rounded-lg p-2 text-sm">
            ⏰ Ditutup otomatis: {{ formatWIB(kuota.target_close_time) }}
          </div> -->
        </div>

        <FormPendaftaran
          :kuota-id="kuotaId"
          :rptra-id="kuota.rptra_id"
          @success="onSuccess"
        />
      </div>

      <div v-else class="bg-red-50 text-red-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">⚠️</div>
        <h3 class="font-bold text-lg">{{ errorMessage || 'Tidak tersedia' }}</h3>
        <router-link to="/" class="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke Beranda
        </router-link>
      </div>
    </div>

    <!-- Modal Ketentuan -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="bg-blue-600 text-white p-4 rounded-t-xl shrink-0">
          <h2 class="text-lg font-bold text-center">PELAKSANAAN PANGAN MURAH</h2>
          <p class="text-center text-blue-100 text-sm">SISTEM ONLINE</p>
        </div>

        <div 
          ref="contentRef"
          class="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-700 scroll-smooth"
          @scroll="handleScroll"
        >
          <p class="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">
            Berdasarkan ketentuan dari <strong>Dinas KPKP</strong> serta <strong>Koperasi Melati Jaya</strong>, 
            Pelaksanaan Pangan Murah di <strong>RPTRA Patimura, Kelurahan Pademangan Timur</strong> 
            dilaksanakan dengan sistem pendaftaran online.
          </p>

          <div>
            <h3 class="font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1">
              KETENTUAN DAN PERSYARATAN:
            </h3>
            <ul class="space-y-2 text-xs">
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">1.</span>
                <span>Wajib melakukan pendaftaran melalui link online.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">2.</span>
                <span>Pendaftaran hanya berlaku untuk warga wilayah <strong>Kelurahan Pademangan Timur</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">3.</span>
                <span>Satu (1) Kartu Keluarga (KK) hanya dapat mendaftar satu kali.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">4.</span>
                <span>Nomor KK tidak dapat digunakan lebih dari satu kali.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">5.</span>
                <span>Pendaftaran akan ditutup otomatis apabila kuota telah terpenuhi.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">6.</span>
                <span>Wajib membawa <strong>screenshot (tangkapan layar)</strong> bukti pendaftaran.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">7.</span>
                <span>Wajib membawa <strong>fotokopi Kartu Keluarga (KK)</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">8.</span>
                <span>Menunjukkan <strong>KTP asli</strong> saat verifikasi.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">9.</span>
                <span>Jadwal penggesekan pukul <strong>08.00 s/d 11.00 WIB</strong> dihari berikutnya (H+1).</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">10.</span>
                <span>Apabila penggesekan melewati batas waktu yang ditentukan maka nomor antrian dinyatakan <strong class="text-red-600">hangus</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">11.</span>
                <span>Nomor antrian <strong class="text-red-600">tidak dapat dipindahtangankan</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">12.</span>
                <span><strong class="text-red-600">Tidak melayani titip nomor antrian</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">13.</span>
                <span>Data akan diverifikasi oleh petugas.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">14.</span>
                <span>Petugas berhak <strong class="text-red-600">membatalkan pendaftaran</strong> apabila data tidak sesuai.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">15.</span>
                <span>Kesalahan pengisian data menjadi <strong>tanggung jawab pendaftar</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">16.</span>
                <span>Persediaan pangan terbatas sesuai kuota.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">17.</span>
                <span>Wajib menjaga ketertiban dan kebersihan.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">18.</span>
                <span class="text-red-600 font-semibold">Tidak diperkenankan anak dibawah umur untuk melakukan antrian swipe kartu dan pada saat pengambilan barang komoditas.</span>
              </li>
            </ul>
          </div>

          <div class="h-4"></div>
        </div>

        <div class="px-6 py-2 bg-gray-50 border-t">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress membaca</span>
            <span>{{ Math.round(scrollProgress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${scrollProgress}%` }"
            ></div>
          </div>
          <p v-if="!hasScrolledToBottom" class="text-xs text-orange-600 mt-1 text-center">
            ⬇️ Scroll ke bawah untuk melanjutkan
          </p>
        </div>

        <div class="p-4 border-t bg-gray-50 rounded-b-xl shrink-0 space-y-3">
          <label 
            class="flex items-start gap-3 cursor-pointer p-3 rounded-lg transition-colors"
            :class="hasScrolledToBottom ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'"
          >
            <input 
              type="checkbox" 
              v-model="hasAgreed"
              :disabled="!hasScrolledToBottom"
              class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5 shrink-0 disabled:cursor-not-allowed"
            >
            <span class="text-sm text-gray-700 select-none">
              Saya sudah membaca dan menyetujui semua ketentuan yang berlaku
            </span>
          </label>

          <button 
            @click="closeModal"
            :disabled="!hasScrolledToBottom || !hasAgreed"
            class="w-full py-3 rounded-lg font-bold transition-all duration-200"
            :class="[
              hasScrolledToBottom && hasAgreed
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <span v-if="!hasScrolledToBottom">Scroll ke bawah terlebih dahulu</span>
            <span v-else-if="!hasAgreed">Centang persetujuan di atas</span>
            <span v-else>Ya, Saya Setuju</span>
          </button>
          
          <p class="text-center text-xs text-gray-500">
            Dengan menekan tombol di atas, Anda menyetujui semua ketentuan yang berlaku.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getKuotaById, checkAndTriggerOpen } from '../composables/useKuota'
import { formatWIB } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import FormPendaftaran from '../components/user/FormPendaftaran.vue'

const route = useRoute()
const router = useRouter()

const kuotaId = route.params.kuotaId

const kuota = ref(null)
const terdaftar = ref(0)
const loading = ref(true)
const scheduleStatus = ref('checking')

const showModal = ref(true)
const contentRef = ref(null)
const hasScrolledToBottom = ref(false)
const hasAgreed = ref(false)
const scrollProgress = ref(0)

const sisa = computed(() => {
  if (!kuota.value) return 0
  return Math.max(0, kuota.value.kuota - terdaftar.value)
})

const isAvailable = computed(() => scheduleStatus.value === 'open')

const errorMessage = computed(() => {
  if (!kuota.value) return 'Kuota tidak ditemukan'
  if (!kuota.value.dibuka) return 'Pendaftaran ditutup'
  if (sisa.value <= 0) return 'Kuota habis'
  return 'Tidak tersedia'
})

const formatMonthYear = (bulan, tahun) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${months[bulan - 1]} ${tahun}`
}

const onSuccess = (antrianId) => {
  router.push(`/nomor-antrian/${antrianId}`)
}

const handleScroll = () => {
  if (!contentRef.value) return
  
  const element = contentRef.value
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight - element.clientHeight
  
  scrollProgress.value = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
  
  const threshold = 0.95
  hasScrolledToBottom.value = scrollTop >= scrollHeight * threshold
}

const closeModal = () => {
  if (hasScrolledToBottom.value && hasAgreed.value) {
    showModal.value = false
  }
}

// ⭐ FUNGSI BARU: Cek apakah sudah lewat close time - FIX: sama dengan useAntrian
const checkAlreadyClosed = (kuotaData) => {
  if (!kuotaData.target_close_time) return false
  
  // Database simpan UTC tanpa Z, kita append Z supaya parse sebagai UTC
  const closeTimeStr = kuotaData.target_close_time + 'Z'
  const closeTime = new Date(closeTimeStr).getTime()
  const now = Date.now()
  
  return now > closeTime
}

onMounted(async () => {
  try {
    const data = await getKuotaById(kuotaId)
    kuota.value = data

    if (!data) {
      scheduleStatus.value = 'manual_closed'
      loading.value = false
      return
    }

    const { count } = await supabase
      .from('antrian')
      .select('*', { count: 'exact', head: true })
      .eq('kuota_id', kuotaId)
    
    terdaftar.value = count || 0

    if (terdaftar.value >= data.kuota) {
      scheduleStatus.value = 'full'
      loading.value = false
      return
    }

    // ⭐ CEK: Sudah lewat close time tapi masih dibuka secara manual
    if (data.dibuka && checkAlreadyClosed(data)) {
      // Auto close
      await supabase
        .from('kuota_bulanan')
        .update({ dibuka: false })
        .eq('id', kuotaId)
      
      scheduleStatus.value = 'already_closed'
      loading.value = false
      return
    }

    // ⭐ CEK: Sudah lewat close time dan memang tertutup
    if (!data.dibuka && checkAlreadyClosed(data)) {
      scheduleStatus.value = 'already_closed'
      loading.value = false
      return
    }

    if (!data.dibuka) {
      const result = await checkAndTriggerOpen(kuotaId)
      
      if (result.opened) {
        scheduleStatus.value = 'open'
        kuota.value = result.kuota
      } else {
        scheduleStatus.value = result.reason
      }
    } else {
      scheduleStatus.value = 'open'
    }
    
  } catch (err) {
    console.error('Load error:', err)
    scheduleStatus.value = 'manual_closed'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.scroll-smooth {
  scroll-behavior: smooth;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>