<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="bg-purple-600 text-white rounded-xl p-6 mb-6 text-center">
        <h1 class="text-2xl font-bold mb-2">Pendaftaran Manual</h1>
        <p class="text-purple-100 text-sm">Admin: {{ user?.nama }}</p>
        <p class="text-purple-200 text-xs mt-1">{{ user?.rptra?.nama }}</p>
        <div class="mt-4 pt-4 border-t border-purple-500">
          <p class="font-medium text-lg">{{ formatMonthYear(kuota?.bulan, kuota?.tahun) }}</p>
          <div class="flex justify-center gap-4 mt-2 text-sm">
            <span>Kuota: <strong>{{ kuota?.kuota || 0 }}</strong></span>
            <span>Terdaftar: <strong>{{ kuota?.terdaftar || 0 }}</strong></span>
            <span :class="sisaKuota <= 5 ? 'text-yellow-300 font-bold' : 'text-purple-200'">
              Sisa: <strong>{{ sisaKuota }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Alert Kuota Penuh -->
      <div v-if="sisaKuota <= 0" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <p class="font-bold text-red-700">Kuota Sudah Penuh!</p>
            <p class="text-sm text-red-600">Silakan edit kuota terlebih dahulu untuk menambah slot.</p>
          </div>
        </div>
        <button 
          @click="router.push('/admin/kuota')"
          class="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium"
        >
          Edit Kuota
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="bg-white rounded-xl shadow-lg p-8 text-center">
        <div class="animate-spin text-3xl mb-4">⏳</div>
        <p class="text-gray-600">Memuat data...</p>
      </div>

      <!-- Config Error -->
      <div v-else-if="configError" class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <p class="text-red-700 font-semibold mb-2">❌ Gagal memuat konfigurasi</p>
        <p class="text-red-600 text-sm">{{ configError }}</p>
        <button @click="reloadConfig" class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Coba Lagi
        </button>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-800">Formulir Pendaftaran Warga</h2>
          <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Admin Mode</span>
        </div>
        
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email <span class="text-gray-400">(opsional)</span>
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

          <!-- Kelurahan (Auto-lock dari config) -->
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
            <p class="text-gray-400 text-xs mt-1">Otomatis terisi sesuai lokasi RPTRA: {{ rptraData?.nama }}</p>
          </div>

          <!-- Kartu Pemanfaat (Dynamic dari config) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Kartu Pemanfaat <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.kartu_pemanfaat" 
              required
              @change="onKartuChange"
              @blur="validateField('kartu_pemanfaat')"
              :class="[
                'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white',
                errors.kartu_pemanfaat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-purple-500'
              ]"
            >
              <option value="" disabled>Pilih kartu</option>
              <option v-for="k in validKartuList" :key="k" :value="k">{{ k }}</option>
            </select>
            <p v-if="errors.kartu_pemanfaat" class="text-red-500 text-xs mt-1">{{ errors.kartu_pemanfaat }}</p>
          </div>

          <!-- Alamat dengan Validasi Dynamic -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Alamat Kartu Keluarga <span class="text-red-500">*</span>
              <span v-if="isPJLP" class="text-purple-600 font-normal text-xs ml-1">(PJLP: Bebas wilayah)</span>
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
              :placeholder="isPJLP ? `Contoh: Jl. Sudirman No 1, Jakarta` : `Contoh: Jl. ${jalanKhasExample} No 01`"
            ></textarea>
            <p v-if="errors.alamat" class="text-red-500 text-xs mt-1">{{ errors.alamat }}</p>
            <p v-else-if="!isPJLP" class="text-gray-400 text-xs mt-1">
              Harus berada di wilayah {{ rptraConfig?.kelurahan }} 
              <span v-if="jalanKhasList.length">(mengandung: {{ jalanKhasList.join(', ') }})</span>
            </p>
            <p v-else class="text-purple-600 text-xs mt-1">
              PJLP dapat mengisi alamat di luar {{ rptraConfig?.kelurahan }}
            </p>
          </div>

          <!-- RT/RW (Dynamic range dari config) -->
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                RT <span class="text-red-500">*</span>
                <span v-if="rtRangeText" class="text-gray-400 text-xs font-normal">({{ rtRangeText }})</span>
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
                placeholder="001"
              >
              <p v-if="errors.rt" class="text-red-500 text-xs mt-1">{{ errors.rt }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                RW <span class="text-red-500">*</span>
                <span v-if="rwRangeText" class="text-gray-400 text-xs font-normal">({{ rwRangeText }})</span>
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
                <option v-for="num in rwOptions" :key="num" :value="formatRWValue(num)">
                  {{ formatRWValue(num) }}
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
            :disabled="loading || isLoading || sisaKuota <= 0"
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="animate-spin">⏳</span>
            <span>{{ loading ? 'Memproses...' : sisaKuota <= 0 ? 'Kuota Penuh' : 'Daftarkan Warga' }}</span>
          </button>

          <!-- Back to Dashboard -->
          <button 
            type="button"
            @click="router.push('/admin/dashboard')"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
          >
            ← Kembali ke Dashboard
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { generateNomorAntrianAdmin, checkKKExists } from '../composables/useAntrian'
import { getKuotaById } from '../composables/useKuota'
import { user } from '../composables/useAuth'
import { useRPTRA, rptraConfig, rptraData } from '../composables/useRPTRA'
import { supabase } from '../lib/supabase'

const props = defineProps({
  kuotaId: {
    type: String,
    required: true
  }
})

const router = useRouter()

const { 
  loadConfig, 
  validateAlamat, 
  validateRT, 
  validateRW, 
  getValidKartu, 
  getRWOptions, 
  getJalanKhasList, 
  isLoading, 
  error: configError,
  reloadConfig 
} = useRPTRA()

const kuota = ref(null)
const loading = ref(false)
const submitError = ref('')
const kkExists = ref(false)
const kkExistsData = ref(null)

const form = reactive({
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

// Computed dari config
const isPJLP = computed(() => form.kartu_pemanfaat === 'PJLP')

const validKartuList = computed(() => {
  return getValidKartu()
})

const rwOptions = computed(() => {
  return getRWOptions()
})

const jalanKhasList = computed(() => {
  return getJalanKhasList()
})

const jalanKhasExample = computed(() => {
  const list = jalanKhasList.value
  return list.length > 0 ? list[0].charAt(0).toUpperCase() + list[0].slice(1) : 'Unknown'
})

const rtRangeText = computed(() => {
  const rules = rptraConfig.value?.alamat_rules
  if (!rules?.rt_min && !rules?.rt_max) return ''
  return `${rules.rt_min || 1}-${rules.rt_max || 999}`
})

const rwRangeText = computed(() => {
  const rules = rptraConfig.value?.alamat_rules
  if (!rules?.rw_min && !rules?.rw_max) return ''
  return `${rules.rw_min || 1}-${rules.rw_max || 20}`
})

const sisaKuota = computed(() => {
  if (!kuota.value) return 0
  return kuota.value.kuota - (kuota.value.terdaftar || 0)
})

const formatMonthYear = (bulan, tahun) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  if (!bulan || !tahun) return '-'
  return `${months[bulan - 1]} ${tahun}`
}

const formatRWValue = (num) => {
  const rules = rptraConfig.value?.alamat_rules
  const maxRW = rules?.rw_max || 12
  const digits = maxRW.toString().length
  return num.toString().padStart(digits, '0')
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

const onKartuChange = () => {
  errors.alamat = ''
  if (form.alamat) {
    validateField('alamat')
  }
}

// Validators
const validators = {
  email: (val) => {
    if (!val) return '' // Opsional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val) ? '' : 'Format email tidak valid'
  },
  
  kelurahan: (val) => {
    if (!val) return 'Kelurahan wajib diisi'
    return ''
  },
  
  kartu_pemanfaat: (val) => {
    if (!val) return 'Pilih kartu pemanfaat'
    const validList = getValidKartu()
    if (!validList.includes(val)) return 'Kartu tidak tersedia untuk RPTRA ini'
    return ''
  },
  
  alamat: (val) => {
    if (!val.trim()) return 'Alamat wajib diisi'
    if (val.length < 10) return 'Alamat terlalu pendek (min 10 karakter)'
    
    const result = validateAlamat(val, form.kartu_pemanfaat)
    if (!result.valid) return result.error
    
    return ''
  },
  
  rt: (val) => {
    if (!val) return 'RT wajib diisi'
    if (!/^\d{1,3}$/.test(val)) return 'RT hanya angka, max 3 digit'
    
    const result = validateRT(val)
    if (!result.valid) return result.error
    
    return ''
  },
  
  rw: (val) => {
    if (!val) return 'RW wajib dipilih'
    
    const result = validateRW(val)
    if (!result.valid) return result.error
    
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
  
  if (sisaKuota.value <= 0) {
    submitError.value = 'Kuota sudah penuh'
    return
  }
  
  loading.value = true
  
  try {
    const checkData = await checkKKExists(form.nomor_kk, props.kuotaId)
    
    if (checkData) {
      kkExists.value = true
      kkExistsData.value = checkData
      submitError.value = `KK sudah terdaftar dengan nomor antrian #${checkData.nomor_antrian.toString().padStart(3, '0')}`
      loading.value = false
      return
    }
    
    const data = await generateNomorAntrianAdmin({
      email: form.email || null,
      kelurahan: form.kelurahan,
      kartu_pemanfaat: form.kartu_pemanfaat,
      alamat: form.alamat,
      rt: form.rt,
      rw: form.rw,
      nomor_kk: form.nomor_kk,
      nomor_atm: form.nomor_atm,
      nama_pemilik_atm: form.nama_pemilik_atm,
      whatsapp: form.whatsapp,
      kuota_id: props.kuotaId,
      rptra_id: kuota.value.rptra_id
    })
    
    // Redirect ke Dashboard setelah sukses
    router.push('/admin/dashboard')
  } catch (err) {
    submitError.value = err.message || 'Terjadi kesalahan, coba lagi'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    // Load kuota data
    const data = await getKuotaById(props.kuotaId)
    
    if (!data) {
      submitError.value = 'Kuota tidak ditemukan'
      return
    }
    
    kuota.value = data
    
    // Load RPTRA config untuk validasi alamat, RW, dll
    if (data.rptra_id) {
      await loadConfig(data.rptra_id)
      form.kelurahan = rptraConfig.value?.kelurahan || ''
    }
    
    // Hitung sisa kuota
    const { count } = await supabase
      .from('antrian')
      .select('*', { count: 'exact', head: true })
      .eq('kuota_id', props.kuotaId)
    
    kuota.value.terdaftar = count || 0
    
  } catch (err) {
    console.error('Init error:', err)
    submitError.value = 'Gagal memuat data'
  }
})
</script>