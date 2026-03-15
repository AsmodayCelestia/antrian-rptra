<template>
  <div class="bg-white rounded-xl shadow-lg p-8">
    <!-- Loading Config -->
    <div v-if="isLoadingConfig" class="text-center py-12">
      <div class="animate-spin text-4xl mb-4">⏳</div>
      <p class="text-gray-600">Memuat konfigurasi RPTRA...</p>
    </div>

    <!-- Config Error -->
    <div v-else-if="configError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-700 font-semibold">❌ Gagal memuat konfigurasi</p>
      <p class="text-red-600 text-sm mt-1">{{ configError }}</p>
      <button @click="reloadConfig" class="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
        Coba Lagi
      </button>
    </div>

    <!-- Form -->
    <template v-else-if="configReady">
      <div class="mb-6 text-center">
        <h2 class="text-xl font-bold text-gray-800">Formulir Pendaftaran</h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ rptraData?.nama || 'RPTRA' }} - {{ rptraConfig?.kelurahan || 'Loading...' }}
        </p>
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
              errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
          <p class="text-gray-400 text-xs mt-1">Otomatis terisi sesuai lokasi RPTRA</p>
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
              errors.kartu_pemanfaat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
            <span v-if="isPJLP" class="text-blue-600 font-normal text-xs ml-1">(PJLP: Bebas wilayah)</span>
          </label>
          <textarea 
            v-model="form.alamat" 
            rows="3" 
            required
            @blur="validateField('alamat')"
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all resize-none',
              errors.alamat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
            ]"
            :placeholder="isPJLP ? `Contoh: Jl. Sudirman No 1, Jakarta` : `Contoh: Jl. ${jalanKhasExample} No 01`"
          ></textarea>
          <p v-if="errors.alamat" class="text-red-500 text-xs mt-1">{{ errors.alamat }}</p>
          <p v-else-if="!isPJLP" class="text-gray-400 text-xs mt-1">
            Harus berada di wilayah {{ rptraConfig?.kelurahan }} 
            <span v-if="jalanKhasList.length">(mengandung: {{ jalanKhasList.join(', ') }})</span>
          </p>
          <p v-else class="text-blue-600 text-xs mt-1">
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
                errors.rt ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
                errors.rw ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
              errors.nomor_kk ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
              errors.nomor_atm ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
              errors.nama_pemilik_atm ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
              errors.whatsapp ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
          :disabled="loading || isLoadingConfig || !configReady"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin">⏳</span>
          <span>{{ loading ? 'Memproses...' : 'Lanjutkan ➔' }}</span>
        </button>
      </form>
    </template>

    <!-- Fallback -->
    <div v-else class="text-center py-12">
      <div class="text-4xl mb-4">⚠️</div>
      <p class="text-gray-600">Gagal memuat konfigurasi. Coba refresh halaman.</p>
      <button @click="reloadConfig" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
        Coba Lagi
      </button>
    </div>

    <!-- ⭐ MODAL KONFIRMASI DATA - VERSI RAPI -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <!-- Header -->
        <div class="bg-yellow-500 text-white p-4 rounded-t-xl">
          <h3 class="text-lg font-bold text-center">⚠️ Konfirmasi Data</h3>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Peringatan -->
          <div>
            <p class="font-semibold text-gray-800 mb-3 text-sm">Pastikan data yang Anda isi sudah benar:</p>
            <ul class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <span class="text-gray-500 mt-0.5">•</span>
                <span>Nomor KK dan ATM harus sesuai dengan dokumen fisik</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-gray-500 mt-0.5">•</span>
                <span>Alamat sesuai dengan ketentuan wilayah</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-gray-500 mt-0.5">•</span>
                <span>Nomor WhatsApp aktif dan dapat dihubungi</span>
              </li>
            </ul>
            <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700 text-sm font-semibold text-center">
                ⚠️ Data yang tidak sesuai akan DITOLAK petugas saat verifikasi!
              </p>
            </div>
          </div>

          <!-- Summary Data -->
          <div class="border rounded-lg p-4 bg-gray-50">
            <h4 class="font-bold text-gray-800 mb-3 pb-2 border-b text-sm">Data Pendaftaran</h4>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-start gap-2">
                <span class="text-gray-500 shrink-0">Nama:</span>
                <span class="font-medium text-right">{{ form.nama_pemilik_atm }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-gray-500 shrink-0">No. KK:</span>
                <span class="font-mono text-xs">{{ form.nomor_kk }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-gray-500 shrink-0">No. ATM:</span>
                <span class="font-mono text-xs">{{ form.nomor_atm }}</span>
              </div>
              <div class="flex justify-between items-start gap-2">
                <span class="text-gray-500 shrink-0">Alamat:</span>
                <span class="text-right text-xs leading-relaxed">{{ form.alamat }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-gray-500 shrink-0">RT/RW:</span>
                <span class="text-xs">{{ form.rt }}/{{ form.rw }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-gray-500 shrink-0">Kartu:</span>
                <span class="text-xs">{{ form.kartu_pemanfaat }}</span>
              </div>
              <div class="flex justify-between items-center gap-2">
                <span class="text-gray-500 shrink-0">WhatsApp:</span>
                <span class="text-xs">{{ form.whatsapp }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button 
              @click="showConfirmModal = false"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors text-sm"
            >
              ✏️ Periksa Ulang
            </button>
            <button 
              @click="confirmSubmit"
              :disabled="loading"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="animate-spin text-xs">⏳</span>
              <span>{{ loading ? 'Memproses...' : '✅ Ya, Data Sudah Benar' }}</span>
            </button>
          </div>
          
          <p class="text-center text-xs text-gray-400 pt-1">
            Tekan "Periksa Ulang" untuk mengedit data
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { generateNomorAntrian, checkKKExists } from '../../composables/useAntrian'
import { useRPTRA } from '../../composables/useRPTRA'

const props = defineProps({
  kuotaId: {
    type: String,
    required: true
  },
  rptraId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['success'])

// Instance-based useRPTRA
const { 
  config: rptraConfig, 
  data: rptraData, 
  isLoading: isLoadingConfig, 
  error: configError,
  loadConfig, 
  reloadConfig,
  validateAlamat,
  validateRT,
  validateRW,
  getValidKartu,
  getRWOptions,
  getJalanKhasList: getJalanKhas,
  isPJLPBebas
} = useRPTRA()

const loading = ref(false)
const submitError = ref('')
const showConfirmModal = ref(false)
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

// Config ready check
const configReady = computed(() => {
  return rptraConfig.value?.kelurahan && rptraConfig.value?.kelurahan !== 'Unknown'
})

// Watch rptraId dan load config
watch(() => props.rptraId, async (newRptraId) => {
  if (newRptraId) {
    console.log('Loading config for RPTRA:', newRptraId)
    await loadConfig(newRptraId)
    if (rptraConfig.value?.kelurahan) {
      form.kelurahan = rptraConfig.value.kelurahan
    }
    console.log('Config loaded:', rptraConfig.value)
  }
}, { immediate: true })

// Computed
const isPJLP = computed(() => form.kartu_pemanfaat === 'PJLP')

const validKartuList = computed(() => {
  return getValidKartu()
})

const rwOptions = computed(() => {
  return getRWOptions()
})

const jalanKhasList = computed(() => {
  return getJalanKhas()
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

// Methods
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
    if (!val) return ''
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

// ⭐ HANDLE SUBMIT: Tampilkan modal konfirmasi dulu
const handleSubmit = async () => {
  submitError.value = ''
  kkExists.value = false
  kkExistsData.value = null
  
  if (!validateAll()) {
    submitError.value = 'Mohon periksa kembali form'
    return
  }
  
  // Tampilkan modal konfirmasi
  showConfirmModal.value = true
}

// ⭐ CONFIRM SUBMIT: Execute ke database
const confirmSubmit = async () => {
  loading.value = true
  
  try {
    // Cek ulang KK exists (antisipasi race condition)
    const checkData = await checkKKExists(form.nomor_kk, props.kuotaId)
    
    if (checkData) {
      kkExists.value = true
      kkExistsData.value = checkData
      submitError.value = `KK sudah terdaftar dengan nomor antrian #${checkData.nomor_antrian.toString().padStart(3, '0')}`
      showConfirmModal.value = false
      loading.value = false
      return
    }
    
    const data = await generateNomorAntrian({
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
      rptra_id: props.rptraId
    })
    
    showConfirmModal.value = false
    emit('success', data.id)
  } catch (err) {
    submitError.value = err.message || 'Terjadi kesalahan, coba lagi'
    showConfirmModal.value = false
  } finally {
    loading.value = false
  }
}

// Init debug
onMounted(() => {
  console.log('FormPendaftaran mounted')
  console.log('Props:', props)
})
</script>