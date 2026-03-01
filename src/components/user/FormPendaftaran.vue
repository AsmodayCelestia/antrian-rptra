<template>
  <div class="bg-white rounded-xl shadow-lg p-8">
    <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">Formulir Pendaftaran</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-gray-400">(opsional)</span></label>
        <input 
          v-model="form.email" 
          type="email" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="email@example.com"
        >
      </div>

      <!-- Kelurahan -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kelurahan *</label>
        <input 
          v-model="form.kelurahan" 
          type="text" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Nama kelurahan"
        >
      </div>

      <!-- Kartu Pemanfaat -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kartu Pemanfaat *</label>
        <select 
          v-model="form.kartu_pemanfaat" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
      </div>

      <!-- Alamat -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Rumah *</label>
        <textarea 
          v-model="form.alamat" 
          rows="3" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Jl. xxx No. xx"
        ></textarea>
      </div>

      <!-- RT/RW -->
      <div class="grid grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">RT *</label>
          <input 
            v-model="form.rt" 
            type="text" 
            required
            maxlength="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="001"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">RW *</label>
          <input 
            v-model="form.rw" 
            type="text" 
            required
            maxlength="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="001"
          >
        </div>
      </div>

      <!-- Nomor KK -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Kartu Keluarga *</label>
        <input 
          v-model="form.nomor_kk" 
          type="text" 
          required
          minlength="16"
          maxlength="16"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="16 digit nomor KK"
        >
      </div>

      <!-- Nomor ATM -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Kartu ATM *</label>
        <input 
          v-model="form.nomor_atm" 
          type="text" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Nomor ATM sesuai kartu pemanfaat"
        >
      </div>

      <!-- Nama Pemilik ATM -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Kartu ATM *</label>
        <input 
          v-model="form.nama_pemilik_atm" 
          type="text" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Nama lengkap sesuai ATM"
        >
      </div>

      <!-- WhatsApp -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Whatsapp Aktif *</label>
        <input 
          v-model="form.whatsapp" 
          type="tel" 
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="08xxxxxxxxxx"
        >
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
        {{ error }}
      </div>

      <!-- Submit -->
      <button 
        type="submit" 
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {{ loading ? 'Memproses...' : 'Ambil Nomor Antrian' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { generateNomorAntrian } from '../../composables/useAntrian'

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
const error = ref('')

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

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await generateNomorAntrian({
      ...form,
      kuota_id: props.kuotaId,
      rptra_id: props.rptraId
    })
    
    emit('success', data.id)
  } catch (err) {
    error.value = err.message || 'Terjadi kesalahan'
  } finally {
    loading.value = false
  }
}
</script>