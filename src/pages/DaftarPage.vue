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