import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// ============================================
// DEFAULT CONFIG (static)
// ============================================

const DEFAULT_CONFIG = {
  kelurahan: 'Unknown',
  kecamatan: 'Unknown',
  kota: 'Jakarta',
  alamat_rules: {
    jalan_khas: [],
    pjlp_bebas: true,
    rt_min: 1,
    rt_max: 999,
    rw_min: 1,
    rw_max: 20
  },
  kartu_valid: [
    'KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta',
    'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS'
  ]
}

// ============================================
// COMPOSABLE HOOK (Instance-based)
// ============================================

export const useRPTRA = () => {
  // Instance state - tiap component punya state sendiri
  const rptraConfig = ref(null)
  const rptraData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const loadedRptraId = ref(null)

  /**
   * Fetch RPTRA config by ID
   */
  const loadConfig = async (rptraId) => {
    if (!rptraId) {
      error.value = 'RPTRA ID tidak valid'
      return null
    }

    // Return cached kalau sudah loaded untuk ID yang sama
    if (loadedRptraId.value === rptraId && rptraConfig.value) {
      return {
        ...rptraData.value,
        config: rptraConfig.value
      }
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: supaError } = await supabase
        .from('rptra')
        .select('id, nama, kelurahan, alamat, config')
        .eq('id', rptraId)
        .single()

      if (supaError) throw supaError
      if (!data) throw new Error('RPTRA tidak ditemukan')

      // Merge dengan default config
      const mergedConfig = {
        kelurahan: data.config?.kelurahan || data.kelurahan || DEFAULT_CONFIG.kelurahan,
        kecamatan: data.config?.kecamatan || DEFAULT_CONFIG.kecamatan,
        kota: data.config?.kota || DEFAULT_CONFIG.kota,
        alamat_rules: {
          ...DEFAULT_CONFIG.alamat_rules,
          ...(data.config?.alamat_rules || {})
        },
        kartu_valid: data.config?.kartu_valid || DEFAULT_CONFIG.kartu_valid
      }

      // Update state
      rptraData.value = {
        id: data.id,
        nama: data.nama,
        kelurahan: data.kelurahan,
        alamat: data.alamat
      }
      
      rptraConfig.value = mergedConfig
      loadedRptraId.value = rptraId
      
      return {
        ...rptraData.value,
        config: mergedConfig
      }
    } catch (err) {
      console.error('Error loading RPTRA config:', err)
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reload config
   */
  const reloadConfig = async () => {
    if (loadedRptraId.value) {
      return await loadConfig(loadedRptraId.value)
    }
    return null
  }

  /**
   * Clear config
   */
  const clearConfig = () => {
    rptraConfig.value = null
    rptraData.value = null
    error.value = null
    loadedRptraId.value = null
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  const validateAlamat = (alamat, kartuPemanfaat) => {
    const cfg = rptraConfig.value
    if (!cfg) return { valid: true, error: null, isPJLP: false }

    const rules = cfg.alamat_rules || {}
    const isPJLP = kartuPemanfaat === 'PJLP'
    
    if (isPJLP && rules.pjlp_bebas) {
      return { valid: true, error: null, isPJLP: true }
    }

    const lowerAlamat = alamat.toLowerCase().trim()
    const jalanKhas = rules.jalan_khas || []
    
    if (jalanKhas.length === 0) {
      return { valid: true, error: null, isPJLP: false }
    }

    const hasJalanKhas = jalanKhas.some(j => 
      lowerAlamat.includes(j.toLowerCase())
    )
    
    if (!hasJalanKhas) {
      return { 
        valid: false, 
        error: `Alamat tidak sesuai ketentuan`,
        isPJLP: false
      }
    }

    return { valid: true, error: null, isPJLP: false }
  }

  const validateRT = (rt) => {
    const cfg = rptraConfig.value
    if (!cfg) return { valid: true }

    const rules = cfg.alamat_rules || {}
    const rtNum = parseInt(rt)
    
    if (isNaN(rtNum)) return { valid: false, error: 'RT harus angka' }
    if (rules.rt_min !== undefined && (rtNum < rules.rt_min || rtNum > rules.rt_max)) {
      return { valid: false, error: `RT harus ${rules.rt_min}-${rules.rt_max}` }
    }

    return { valid: true }
  }

  const validateRW = (rw) => {
    const cfg = rptraConfig.value
    if (!cfg) return { valid: true }

    const rules = cfg.alamat_rules || {}
    const rwNum = parseInt(rw)
    
    if (isNaN(rwNum)) return { valid: false, error: 'RW harus angka' }
    if (rules.rw_min !== undefined && (rwNum < rules.rw_min || rwNum > rules.rw_max)) {
      return { valid: false, error: `RW harus ${rules.rw_min}-${rules.rw_max}` }
    }

    return { valid: true }
  }

  // ============================================
  // GETTER HELPERS
  // ============================================

  const getValidKartu = () => {
    return rptraConfig.value?.kartu_valid || DEFAULT_CONFIG.kartu_valid
  }

  const getRWOptions = () => {
    const rules = rptraConfig.value?.alamat_rules || {}
    const min = rules.rw_min || 1
    const max = rules.rw_max || 12
    
    const options = []
    for (let i = min; i <= max; i++) {
      options.push(i.toString().padStart(3, '0'))
    }
    return options
  }

  const getJalanKhasList = () => {
    return rptraConfig.value?.alamat_rules?.jalan_khas || []
  }

  const isPJLPBebas = () => {
    return rptraConfig.value?.alamat_rules?.pjlp_bebas !== false
  }

  const getKelurahan = () => {
    return rptraConfig.value?.kelurahan || rptraData.value?.kelurahan || 'Unknown'
  }

  // Return instance methods & state
  return {
    config: rptraConfig,
    data: rptraData,
    isLoading,
    error,
    loadedId: loadedRptraId,
    loadConfig,
    reloadConfig,
    clearConfig,
    validateAlamat,
    validateRT,
    validateRW,
    getValidKartu,
    getRWOptions,
    getJalanKhasList,
    isPJLPBebas,
    getKelurahan
  }
}

// ============================================
// BACKWARD COMPATIBILITY (singleton untuk code lama)
// ============================================

const globalInstance = useRPTRA()

export const rptraConfig = globalInstance.config
export const rptraData = globalInstance.data
export const isLoadingConfig = globalInstance.isLoading
export const configError = globalInstance.error
export const getRPTRAConfig = globalInstance.loadConfig
export const reloadRPTRAConfig = globalInstance.reloadConfig
export const clearRPTRAConfig = globalInstance.clearConfig
export const validateAlamatByConfig = globalInstance.validateAlamat
export const validateRTRange = globalInstance.validateRT
export const validateRWRange = globalInstance.validateRW
export const getValidKartuList = globalInstance.getValidKartu
export const getRWOptions = globalInstance.getRWOptions
export const getJalanKhasList = globalInstance.getJalanKhasList
export const isValidKartu = (kartu) => globalInstance.getValidKartu().includes(kartu)
export const formatRW = (num, config = null) => {
  const cfg = config || globalInstance.config.value
  const maxRW = cfg?.alamat_rules?.rw_max || 12
  const digits = maxRW.toString().length
  return num.toString().padStart(digits, '0')
}
export const getFullAddress = () => ({
  kelurahan: globalInstance.getKelurahan(),
  kecamatan: globalInstance.config.value?.kecamatan || 'Unknown',
  kota: globalInstance.config.value?.kota || 'Jakarta'
})

export default useRPTRA