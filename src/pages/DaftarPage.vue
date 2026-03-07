<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin text-4xl mb-4">⏳</div>
        <p>Memuat data...</p>
      </div>

      <!-- Invalid / Closed -->
      <div v-else-if="!kuota || !isAvailable" class="bg-red-50 text-red-700 p-6 rounded-xl text-center">
        <div class="text-4xl mb-2">🔒</div>
        <h3 class="font-bold text-lg">{{ errorMessage }}</h3>
        <router-link to="/" class="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke Beranda
        </router-link>
      </div>

      <!-- Available -->
      <div v-else>
        <!-- Info Card -->
        <div class="bg-blue-600 text-white rounded-xl p-6 mb-6 text-center">
          <h1 class="text-2xl font-bold mb-2">Pendaftaran Antrian</h1>
          <p class="text-blue-100">{{ kuota.rptra?.nama }}</p>
          <p class="font-medium text-lg">{{ formatMonthYear(kuota.bulan, kuota.tahun) }}</p>
          
          <div class="mt-4 bg-white/20 rounded-lg p-3 inline-block text-sm">
            Kuota: <strong>{{ kuota.kuota }}</strong> | 
            Terdaftar: <strong>{{ terdaftar }}</strong> | 
            Sisa: <strong :class="sisa <= 5 ? 'text-yellow-300' : ''">{{ sisa }}</strong>
          </div>
        </div>

        <!-- Form -->
        <FormPendaftaran
          :kuota-id="kuotaId"
          :rptra-id="kuota.rptra_id"
          @success="onSuccess"
        />
      </div>
    </div>

    <!-- ⭐ MODAL POPUP KETENTUAN -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-blue-600 text-white p-4 rounded-t-xl sticky top-0">
          <h2 class="text-lg font-bold text-center">PELAKSANAAN PANGAN MURAH</h2>
          <p class="text-center text-blue-100 text-sm">SISTEM ONLINE</p>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4 text-sm text-gray-700">
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
        </div>

        <!-- Footer Button -->
        <div class="p-4 border-t bg-gray-50 rounded-b-xl sticky bottom-0">
          <button 
            @click="showModal = false"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Saya Mengerti dan Setuju
          </button>
          <p class="text-center text-xs text-gray-500 mt-2">
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
import { getKuotaById } from '../composables/useKuota'
import { supabase } from '../lib/supabase'
import FormPendaftaran from '../components/user/FormPendaftaran.vue'

const route = useRoute()
const router = useRouter()

const kuotaId = route.params.kuotaId

const kuota = ref(null)
const terdaftar = ref(0)
const loading = ref(true)

// ⭐ MODAL STATE
const showModal = ref(true) // Default true, muncul pas buka halaman

const sisa = computed(() => {
  if (!kuota.value) return 0
  return Math.max(0, kuota.value.kuota - terdaftar.value)
})

const isAvailable = computed(() => {
  if (!kuota.value) return false
  if (!kuota.value.dibuka) return false
  if (sisa.value <= 0) return false
  return true
})

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

onMounted(async () => {
  try {
    const data = await getKuotaById(kuotaId)
    kuota.value = data

    if (data) {
      const { count } = await supabase
        .from('antrian')
        .select('*', { count: 'exact', head: true })
        .eq('kuota_id', kuotaId)
      
      terdaftar.value = count || 0
    }
  } catch (err) {
    console.error('Load error:', err)
  } finally {
    loading.value = false
  }
})
</script>