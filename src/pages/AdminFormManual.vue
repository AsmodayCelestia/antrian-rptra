<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="bg-purple-600 text-white rounded-xl p-6 mb-6 text-center">
        <h1 class="text-2xl font-bold mb-2">Pendaftaran Manual</h1>
        <p class="text-purple-100">Admin: {{ user?.nama }}</p>
        <p class="font-medium text-lg">{{ formatMonthYear(kuota?.bulan, kuota?.tahun) }}</p>
        <p class="text-sm text-purple-200 mt-1">Sisa Kuota: {{ sisaKuota }}</p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">Formulir Pendaftaran Warga</h2>
        
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.email" 
              type="email"
              @blur="validateField('email')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="email@example.com"
            >
            <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
          </div>

          <!-- Kelurahan (Auto-lock) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Kelurahan <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.kelurahan" 
              type="text"
              readonly
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            >
            <p class="text-gray-400 text-xs mt-1">Otomatis terisi sesuai lokasi RPTRA</p>
          </div>

          <!-- Kartu Pemanfaat -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Kartu Pemanfaat <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.kartu_pemanfaat" 
              required
              @blur="validateField('kartu_pemanfaat')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white',
                errors.kartu_pemanfaat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
            >
              <option value="" disabled>Pilih kartu</option>
              <option value="KJP">KJP</option>
              <option value="PJLP">PJLP</option>
              <option value="Kartu Anak Jakarta">Kartu Anak Jakarta</option>
              <option value="Kartu Lansia Jakarta">Kartu Lansia Jakarta</option>
              <option value="Kartu Disabilitas">Kartu Disabilitas</option>
              <option value="PKK">PKK</option>
              <option value="Daswisma">Daswisma</option>
              <option value="Kartu Pekerja Jakarta">Kartu Pekerja Jakarta</option>
              <option value="Guru Non PNS">Guru Non PNS</option>
            </select>
            <p v-if="errors.kartu_pemanfaat" class="text-red-500 text-xs mt-1">{{ errors.kartu_pemanfaat }}</p>
          </div>

          <!-- Alamat -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Alamat Kartu Keluarga <span class="text-red-500">*</span>
            </label>
            <textarea 
              v-model="form.alamat" 
              rows="3" 
              required
              @blur="validateField('alamat')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all resize-none',
                errors.alamat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="Contoh: Jalan exampel 2 Gang XX No 01"
            ></textarea>
            <p v-if="errors.alamat" class="text-red-500 text-xs mt-1">{{ errors.alamat }}</p>
          </div>

          <!-- RT/RW -->
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                RT <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="form.rt" 
                type="text"
                required
                maxlength="3"
                @input="formatRT"
                @blur="validateField('rt')"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                  errors.rt ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
                ]"
                placeholder="018"
              >
              <p v-if="errors.rt" class="text-red-500 text-xs mt-1">{{ errors.rt }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                RW <span class="text-red-500">*</span>
              </label>
              <select 
                v-model="form.rw" 
                required
                @blur="validateField('rw')"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white',
                  errors.rw ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
                ]"
              >
                <option value="" disabled>Pilih RW</option>
                <option v-for="num in 12" :key="num" :value="formatRW(num)">
                  {{ formatRW(num) }}
                </option>
              </select>
              <p v-if="errors.rw" class="text-red-500 text-xs mt-1">{{ errors.rw }}</p>
            </div>
          </div>

          <!-- Nomor KK -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nomor Kartu Keluarga <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.nomor_kk" 
              type="text"
              required
              maxlength="16"
              @input="sanitizeNumber('nomor_kk')"
              @blur="validateField('nomor_kk')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                errors.nomor_kk ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="16 digit nomor KK"
            >
            <div class="flex justify-between mt-1">
              <p v-if="errors.nomor_kk" class="text-red-500 text-xs">{{ errors.nomor_kk }}</p>
              <p class="text-gray-400 text-xs">{{ form.nomor_kk.length }}/16</p>
            </div>
          </div>

          <!-- Nomor ATM -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nomor Kartu ATM <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.nomor_atm" 
              type="text"
              required
              maxlength="16"
              @input="sanitizeNumber('nomor_atm')"
              @blur="validateField('nomor_atm')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                errors.nomor_atm ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="16 digit nomor ATM"
            >
            <div class="flex justify-between mt-1">
              <p v-if="errors.nomor_atm" class="text-red-500 text-xs">{{ errors.nomor_atm }}</p>
              <p class="text-gray-400 text-xs">{{ form.nomor_atm.length }}/16</p>
            </div>
          </div>

          <!-- Nama Pemilik ATM -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nama Pemilik Kartu ATM <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.nama_pemilik_atm" 
              type="text"
              required
              @blur="validateField('nama_pemilik_atm')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                errors.nama_pemilik_atm ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="Nama lengkap sesuai ATM"
            >
            <p v-if="errors.nama_pemilik_atm" class="text-red-500 text-xs mt-1">{{ errors.nama_pemilik_atm }}</p>
          </div>

          <!-- WhatsApp -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp Aktif <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.whatsapp" 
              type="tel"
              required
              @input="sanitizeWhatsApp"
              @blur="validateField('whatsapp')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all',
                errors.whatsapp ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
              placeholder="08xxxxxxxxxx"
            >
            <p v-if="errors.whatsapp" class="text-red-500 text-xs mt-1">{{ errors.whatsapp }}</p>
            <p v-else class="text-gray-400 text-xs mt-1">Format: 08xxxxxxxxxx (min 10 digit)</p>
          </div>

          <!-- KK Exists Warning -->
          <div v-if="kkExists" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div class="flex items-center gap-2 font-semibold mb-1">
              <span>❌</span>
              <span>Nomor KK Sudah Terdaftar!</span>
            </div>
            <p class="text-sm">
              KK ini sudah terdaftar di periode ini dengan nomor antrian 
              <strong>#{{ kkExistsData?.nomor_antrian?.toString().padStart(3, '0') }}</strong>.
              Satu KK hanya bisa daftar 1 kali per periode.
            </p>
          </div>

          <!-- Global Error -->
          <div v-if="submitError" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {{ submitError }}
          </div>

          <!-- Submit -->
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="animate-spin">⏳</span>
            <span>{{ loading ? 'Memproses...' : 'Daftarkan Warga' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateNomorAntrianAdmin, checkKKExists } from '../composables/useAntrian'
import { getKuotaById } from '../composables/useKuota'
import { user } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const kuotaId = route.params.kuotaId

const kuota = ref(null)
const loading = ref(false)
const submitError = ref('')

const kkExists = ref(false)
const kkExistsData = ref(null)

const jalanKhasPademanganTimur = [
  'pademangan',
  'pesanggrahan'
]

const form = reactive({
  email: '',
  kelurahan: 'Pademangan Timur',
  kartu_pemanfaat: '',
  alamat: '',
  rt: '',
  rw: '',
  nomor_kk: '',
  nomor_atm: '',
  nama_pemilik_atm: '',
  whatsapp: ''
})

const errors = reactive({
  email: '',
  kelurahan: '',
  kartu_pemanfaat: '',
  alamat: '',
  rt: '',
  rw: '',
  nomor_kk: '',
  nomor_atm: '',
  nama_pemilik_atm: '',
  whatsapp: ''
})

const sisaKuota = computed(() => {
  if (!kuota.value) return 0
  return kuota.value.kuota - (kuota.value.terdaftar || 0)
})

const formatMonthYear = (bulan, tahun) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${months[bulan - 1]} ${tahun}`
}

const formatRW = (num) => {
  return num.toString().padStart(3, '0')
}

const formatRT = () => {
  let cleaned = form.rt.replace(/\D/g, '').slice(0, 3)
  form.rt = cleaned
}

const sanitizeNumber = (field) => {
  form[field] = form[field].replace(/\D/g, '').slice(0, 16)
  if (field === 'nomor_kk') {
    kkExists.value = false
    kkExistsData.value = null
  }
}

const sanitizeWhatsApp = () => {
  let cleaned = form.whatsapp.replace(/\D/g, '')
  
  if (cleaned.length > 0 && !cleaned.startsWith('0')) {
    if (cleaned.startsWith('8')) {
      cleaned = '0' + cleaned
    } else if (cleaned.startsWith('62')) {
      cleaned = '0' + cleaned.slice(2)
    }
  }
  
  form.whatsapp = cleaned.slice(0, 15)
}

const validateAlamatPademangan = (alamat) => {
  const lower = alamat.toLowerCase()
  return jalanKhasPademanganTimur.some(jalan => lower.includes(jalan))
}

const validators = {
  email: (val) => {
    if (!val) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val) ? '' : 'Format email tidak valid'
  },
  
  kelurahan: (val) => {
    if (!val) return 'Kelurahan wajib diisi'
    if (val !== 'Pademangan Timur') return 'Kelurahan harus Pademangan Timur'
    return ''
  },
  
  kartu_pemanfaat: (val) => {
    if (!val) return 'Pilih kartu pemanfaat'
    return ''
  },
  
  alamat: (val) => {
    if (!val.trim()) return 'Alamat wajib diisi'
    if (val.length < 10) return 'Alamat terlalu pendek (min 10 karakter)'
    if (!validateAlamatPademangan(val)) {
      return 'Alamat tidak sesuai ketentuann'
    }
    return ''
  },
  
  rt: (val) => {
    if (!val) return 'RT wajib diisi'
    if (!/^\d{1,3}$/.test(val)) return 'RT hanya angka, max 3 digit'
    return ''
  },
  
  rw: (val) => {
    if (!val) return 'RW wajib dipilih'
    if (!/^\d{3}$/.test(val)) return 'RW format harus 001-012'
    return ''
  },
  
  nomor_kk: (val) => {
    if (!val) return 'Nomor KK wajib diisi'
    if (!/^\d{16}$/.test(val)) return 'Nomor KK harus 16 digit angka'
    return ''
  },
  
  nomor_atm: (val) => {
    if (!val) return 'Nomor ATM wajib diisi'
    if (!/^\d{16}$/.test(val)) return 'Nomor ATM harus 16 digit angka'
    return ''
  },
  
  nama_pemilik_atm: (val) => {
    if (!val.trim()) return 'Nama pemilik wajib diisi'
    if (val.length < 3) return 'Nama minimal 3 karakter'
    if (!/^[a-zA-Z\s\.\']+$/.test(val)) return 'Nama hanya huruf, spasi, titik, dan apostrof'
    return ''
  },
  
  whatsapp: (val) => {
    if (!val) return 'WhatsApp wajib diisi'
    if (!/^08\d{8,13}$/.test(val)) return 'Format: 08xxxxxxxxxx (10-15 digit)'
    return ''
  }
}

const validateField = (field) => {
  errors[field] = validators[field](form[field])
}

const validateAll = () => {
  let isValid = true
  Object.keys(validators).forEach(field => {
    const error = validators[field](form[field])
    errors[field] = error
    if (error) isValid = false
  })
  return isValid
}

const handleSubmit = async () => {
  submitError.value = ''
  kkExists.value = false
  kkExistsData.value = null
  
  if (!validateAll()) {
    submitError.value = 'Mohon periksa kembali form'
    return
  }
  
  loading.value = true
  
  try {
    const checkData = await checkKKExists(form.nomor_kk, kuotaId)
    
    if (checkData) {
      kkExists.value = true
      kkExistsData.value = checkData
      submitError.value = `KK sudah terdaftar dengan nomor antrian #${checkData.nomor_antrian}`
      loading.value = false
      return
    }
    
    const data = await generateNomorAntrianAdmin({
      ...form,
      kuota_id: kuotaId,
      rptra_id: kuota.value.rptra_id
    })
    
    router.push(`/nomor-antrian/${data.id}`)
  } catch (err) {
    submitError.value = err.message || 'Terjadi kesalahan, coba lagi'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const data = await getKuotaById(kuotaId)
    kuota.value = data
    
    if (!data) {
      submitError.value = 'Kuota tidak ditemukan'
      return
    }
    
    // Cek sisa kuota
    const { count } = await supabase
      .from('antrian')
      .select('*', { count: 'exact', head: true })
      .eq('kuota_id', kuotaId)
    
    kuota.value.terdaftar = count || 0
    
    if ((kuota.value.kuota - kuota.value.terdaftar) <= 0) {
      submitError.value = 'Kuota sudah penuh. Silakan edit kuota terlebih dahulu.'
    }
  } catch (err) {
    submitError.value = 'Gagal memuat data kuota'
  }
})
</script>