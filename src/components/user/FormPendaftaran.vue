<template>
  <div class="bg-white rounded-xl shadow-lg p-8">
    <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">Formulir Pendaftaran</h2>
    
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
            errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
          @change="onKartuChange"
          @blur="validateField('kartu_pemanfaat')"
          :class="[
            'w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white',
            errors.kartu_pemanfaat ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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

      <!-- Alamat dengan Validasi Conditional -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Alamat Kartu Keluarga <span class="text-red-500">*</span>
          <span v-if="isPJLP" class="text-blue-600 font-normal text-xs ml-1"></span>
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
          :placeholder="isPJLP ? 'Contoh: Jalan Sudirman No 1, Jakarta Pusat' : 'Contoh: Jalan exampel Gang XX No XX'"
        ></textarea>
        <p v-if="errors.alamat" class="text-red-500 text-xs mt-1">{{ errors.alamat }}</p>
        <!-- <p v-else-if="!isPJLP" class="text-gray-400 text-xs mt-1">Harus berada di wilayah Pademangan Timur</p>
        <p v-else class="text-blue-600 text-xs mt-1">PJLP dapat mengisi alamat di luar Pademangan Timur</p> -->
      </div>

      <!-- RT/RW -->
      <div class="grid grid-cols-2 gap-5">
        <!-- RT Manual Input -->
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
              errors.rt ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
            ]"
            placeholder="018"
          >
          <p v-if="errors.rt" class="text-red-500 text-xs mt-1">{{ errors.rt }}</p>
        </div>

        <!-- RW Dropdown 001-012 -->
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
              errors.rw ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
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
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span v-if="loading" class="animate-spin">⏳</span>
        <span>{{ loading ? 'Memproses...' : 'Lanjutkan ➔' }}</span>
      </button>
    </form>

    <!-- ⭐ MODAL KONFIRMASI FINAL -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="bg-yellow-500 text-white p-4 rounded-t-xl">
          <h3 class="text-lg font-bold text-center">⚠️ Konfirmasi Data</h3>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Peringatan -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="font-semibold text-yellow-800 mb-2 text-sm">Pastikan data yang Anda isi sudah benar:</p>
            <ul class="space-y-1 text-xs text-yellow-700">
              <li class="flex items-start gap-2">
                <span class="text-yellow-600">•</span>
                <span>Nomor KK dan ATM harus sesuai dengan dokumen fisik</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-600">•</span>
                <span>Alamat sesuai dengan ketentuan wilayah</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-yellow-600">•</span>
                <span>Nomor WhatsApp aktif dan dapat dihubungi</span>
              </li>
            </ul>
            <div class="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs font-semibold text-center">
              ⚠️ Data yang tidak sesuai akan DITOLAK petugas saat verifikasi!
            </div>
          </div>

          <!-- Summary Data -->
          <div class="border rounded-lg p-4 space-y-3 text-sm bg-gray-50">
            <h4 class="font-bold text-gray-700 border-b pb-2">Data Pendaftaran</h4>
            
            <div class="space-y-2">
              <div class="flex justify-between items-start">
                <span class="text-gray-500 text-xs">Nama:</span>
                <span class="font-medium text-right max-w-[200px]">{{ form.nama_pemilik_atm }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">No. KK:</span>
                <span class="font-mono text-xs">{{ form.nomor_kk }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">No. ATM:</span>
                <span class="font-mono text-xs">{{ form.nomor_atm }}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-gray-500 text-xs">Alamat:</span>
                <span class="text-right text-xs max-w-[200px] leading-tight">{{ form.alamat }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">RT/RW:</span>
                <span class="text-xs">{{ form.rt }}/{{ form.rw }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">Kartu:</span>
                <span class="text-xs">{{ form.kartu_pemanfaat }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500 text-xs">WhatsApp:</span>
                <span class="text-xs">{{ form.whatsapp }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button 
              @click="showConfirmModal = false"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
            >
              ✏️ Periksa Ulang
            </button>
            <button 
              @click="confirmSubmit"
              :disabled="loading"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="animate-spin text-sm">⏳</span>
              <span>{{ loading ? 'Memproses...' : '✅ Ya, Data Sudah Benar' }}</span>
            </button>
          </div>
          
          <p class="text-center text-xs text-gray-400">
            Tekan "Periksa Ulang" untuk mengedit data
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { generateNomorAntrian, checkKKExists } from '../../composables/useAntrian'

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

const loading = ref(false)
const submitError = ref('')
const showConfirmModal = ref(false)

// KK Check states
const kkExists = ref(false)
const kkExistsData = ref(null)

// Jalan khas Pademangan Timur (hanya untuk non-PJLP)
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

// COMPUTED: Cek apakah PJLP
const isPJLP = computed(() => form.kartu_pemanfaat === 'PJLP')

// Format RW ke 001, 002, dst
const formatRW = (num) => {
  return num.toString().padStart(3, '0')
}

// Format RT (3 digit)
const formatRT = () => {
  let cleaned = form.rt.replace(/\D/g, '').slice(0, 3)
  form.rt = cleaned
}

// Sanitizers
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

// VALIDASI ALAMAT CONDITIONAL
const validateAlamatPademangan = (alamat) => {
  if (isPJLP.value) return true
  
  const lower = alamat.toLowerCase()
  return jalanKhasPademanganTimur.some(jalan => lower.includes(jalan))
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
      return 'Alamat tidak sesuai ketentuan'
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

// Handler: Saat kartu berubah, re-validate alamat kalo perlu
const onKartuChange = () => {
  errors.alamat = ''
  if (form.alamat) {
    validateField('alamat')
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
      submitError.value = `KK sudah terdaftar dengan nomor antrian #${checkData.nomor_antrian}`
      showConfirmModal.value = false
      loading.value = false
      return
    }
    
    const data = await generateNomorAntrian({
      ...form,
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

onMounted(() => {
  form.kelurahan = 'Pademangan Timur'
})
</script>