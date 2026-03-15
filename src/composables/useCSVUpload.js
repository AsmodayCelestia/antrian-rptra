import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { generateNomorAntrianAdmin, checkKKExists } from './useAntrian'
import { rptraConfig } from './useRPTRA'
import { user, canViewAllRptra, isModerator } from './useAuth'

// Valid kartu pemanfaat enum - DYNAMIC DARI CONFIG
const getValidKartuFromConfig = () => {
  return rptraConfig.value?.kartu_valid || [
    'KJP', 'PJLP', 'Kartu Anak Jakarta', 'Kartu Lansia Jakarta',
    'Kartu Disabilitas', 'PKK', 'Daswisma', 'Kartu Pekerja Jakarta', 'Guru Non PNS'
  ]
}

// Jalan khas - DYNAMIC DARI CONFIG
const getJalanKhasFromConfig = () => {
  return rptraConfig.value?.alamat_rules?.jalan_khas || []
}

// Parse CSV text to array of objects
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV kosong atau tidak valid')
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const requiredHeaders = ['kartu_pemanfaat', 'alamat', 'rt', 'rw', 'nomor_kk', 'nomor_atm', 'nama_pemilik_atm', 'whatsapp']
  
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    throw new Error(`Header tidak lengkap. Missing: ${missingHeaders.join(', ')}`)
  }
  
  // Parse rows
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Handle quoted values with commas
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].replace(/"/g, '').trim() : ''
    })
    
    rows.push(row)
  }
  
  return rows
}

// Validate single row - DYNAMIC CONFIG
export const validateRow = (row, index) => {
  const errors = []
  const warnings = []
  
  // GET DYNAMIC VALUES
  const VALID_KARTU = getValidKartuFromConfig()
  const JALAN_KHAS = getJalanKhasFromConfig()
  const KELURAHAN = rptraConfig.value?.kelurahan || 'Unknown'
  const PJLP_BEBAS = rptraConfig.value?.alamat_rules?.pjlp_bebas !== false
  
  // Email (optional)
  let email = row.email || ''
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    warnings.push('Format email tidak valid, akan dikosongkan')
    email = ''
  }
  
  // Kartu Pemanfaat (required)
  const kartu = row.kartu_pemanfaat?.trim()
  if (!kartu) {
    errors.push('Kartu pemanfaat wajib diisi')
  } else if (!VALID_KARTU.includes(kartu)) {
    errors.push(`Kartu tidak valid. Pilihan: ${VALID_KARTU.join(', ')}`)
  }
  
  const isPJLP = kartu === 'PJLP'

  // Alamat (required)
  const alamat = row.alamat?.trim()
  if (!alamat) {
    errors.push('Alamat wajib diisi')
  } else if (alamat.length < 10) {
    errors.push('Alamat minimal 10 karakter')
  } else if (!isPJLP || !PJLP_BEBAS) {
    // Validasi jalan khas untuk non-PJLP (atau kalau PJLP tidak bebas)
    const lowerAlamat = alamat.toLowerCase()
    const hasJalanKhas = JALAN_KHAS.some(j => lowerAlamat.includes(j.toLowerCase()))
    if (!hasJalanKhas && JALAN_KHAS.length > 0) {
      errors.push(`Alamat harus mengandung salah satu: ${JALAN_KHAS.join(', ')} (wajib untuk wilayah ${KELURAHAN})`)
    }
  }
 
  // RT (required, 1-3 digit) - DYNAMIC RANGE
  const rt = row.rt?.trim().replace(/\D/g, '')
  const rtRules = rptraConfig.value?.alamat_rules || {}
  if (!rt) {
    errors.push('RT wajib diisi')
  } else if (!/^\d{1,3}$/.test(rt)) {
    errors.push('RT hanya angka 1-3 digit')
  } else if (rtRules.rt_min !== undefined) {
    const rtNum = parseInt(rt)
    if (rtNum < rtRules.rt_min || rtNum > rtRules.rt_max) {
      errors.push(`RT harus antara ${rtRules.rt_min}-${rtRules.rt_max}`)
    }
  }
  
  // RW (required) - DYNAMIC RANGE
  const rw = row.rw?.trim().replace(/\D/g, '')
  if (!rw) {
    errors.push('RW wajib diisi')
  } else {
    const rwNum = parseInt(rw)
    const rwMin = rtRules.rw_min || 1
    const rwMax = rtRules.rw_max || 12
    if (isNaN(rwNum) || rwNum < rwMin || rwNum > rwMax) {
      errors.push(`RW harus ${rwMin.toString().padStart(3, '0')}-${rwMax.toString().padStart(3, '0')}`)
    }
  }
  
  // Nomor KK (required, 16 digit)
  const nomor_kk = row.nomor_kk?.trim().replace(/\D/g, '')
  if (!nomor_kk) {
    errors.push('Nomor KK wajib diisi')
  } else if (nomor_kk.length !== 16) {
    errors.push('Nomor KK harus 16 digit')
  }
  
  // Nomor ATM (required, 16 digit)
  const nomor_atm = row.nomor_atm?.trim().replace(/\D/g, '')
  if (!nomor_atm) {
    errors.push('Nomor ATM wajib diisi')
  } else if (nomor_atm.length !== 16) {
    errors.push('Nomor ATM harus 16 digit')
  }
  
  // Nama Pemilik ATM (required, min 3 char, alphabet only)
  const nama_pemilik_atm = row.nama_pemilik_atm?.trim()
  if (!nama_pemilik_atm) {
    errors.push('Nama pemilik ATM wajib diisi')
  } else if (nama_pemilik_atm.length < 3) {
    errors.push('Nama minimal 3 karakter')
  } else if (!/^[a-zA-Z\s\.\']+$/.test(nama_pemilik_atm)) {
    errors.push('Nama hanya boleh huruf, spasi, titik, dan apostrof')
  }
  
  // WhatsApp (required, format 08xxxxxxxxxx)
  let whatsapp = row.whatsapp?.trim().replace(/\D/g, '')
  if (!whatsapp) {
    errors.push('WhatsApp wajib diisi')
  } else {
    // Auto-convert 62 to 08
    if (whatsapp.startsWith('62')) {
      whatsapp = '0' + whatsapp.slice(2)
    } else if (!whatsapp.startsWith('0')) {
      whatsapp = '0' + whatsapp
    }
    
    if (!/^08\d{8,13}$/.test(whatsapp)) {
      errors.push('Format WhatsApp tidak valid (harus 08xxxxxxxxxx, 10-15 digit)')
    }
  }
  
  return {
    row: index + 1,
    valid: errors.length === 0,
    errors,
    warnings,
    data: {
      email: email || null,
      kelurahan: KELURAHAN, // DYNAMIC DARI CONFIG
      kartu_pemanfaat: kartu,
      alamat,
      rt,
      rw: rw.padStart(3, '0'),
      nomor_kk,
      nomor_atm,
      nama_pemilik_atm,
      whatsapp
    }
  }
}

// Process CSV upload - VERIFY RPTRA ACCESS
export const useCSVUpload = () => {
  const loading = ref(false)
  const progress = ref(0)
  const currentRow = ref(0)
  const results = ref({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  })
  
  const resetResults = () => {
    results.value = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    }
    progress.value = 0
    currentRow.value = 0
  }
  
  const processCSV = async (file, kuotaId, rptraId) => {
    // ⭐ FIX: Verify kuota belongs to user's RPTRA
    if (!canViewAllRptra()) {
      const effectiveRptraId = user.value?.rptra_id
      if (!effectiveRptraId) {
        throw new Error('RPTRA ID tidak ditemukan untuk user ini')
      }
      
      // ⭐ FIX: Verify kuota belongs to this RPTRA
      const { data: kuota, error: kuotaError } = await supabase
        .from('kuota_bulanan')
        .select('rptra_id')
        .eq('id', kuotaId)
        .single()
      
      if (kuotaError || !kuota) {
        throw new Error('Kuota tidak ditemukan')
      }
      
      if (kuota.rptra_id !== effectiveRptraId) {
        throw new Error('Anda tidak memiliki akses ke kuota tersebut')
      }
      
      rptraId = effectiveRptraId
    }
    
    loading.value = true
    resetResults()
    
    try {
      // Read file
      const text = await file.text()
      const rows = parseCSV(text)
      
      if (rows.length > 100) {
        throw new Error(`Maksimal 100 row per upload. Anda mengupload ${rows.length} row.`)
      }
      
      results.value.total = rows.length
      
      // Validate all rows first
      const validatedRows = rows.map((row, index) => validateRow(row, index))
      
      // Check for duplicate KK within CSV itself
      const kkMap = new Map()
      validatedRows.forEach((result, index) => {
        if (result.valid) {
          const kk = result.data.nomor_kk
          if (kkMap.has(kk)) {
            result.valid = false
            result.errors.push(`Duplikat KK dengan row ${kkMap.get(kk) + 1}`)
            results.value.failed++
          } else {
            kkMap.set(kk, index)
          }
        } else {
          results.value.failed++
        }
      })
      
      // Process valid rows
      const validRows = validatedRows.filter(r => r.valid)
      
      for (let i = 0; i < validRows.length; i++) {
        const result = validRows[i]
        currentRow.value = i + 1
        progress.value = Math.round((i / validRows.length) * 100)
             try {
          // Check if KK already exists in database
          const existing = await checkKKExists(result.data.nomor_kk, kuotaId)
          
          if (existing) {
            results.value.skipped++
            results.value.details.push({
              row: result.row,
              status: 'skipped',
              message: `KK sudah terdaftar dengan nomor antrian #${existing.nomor_antrian.toString().padStart(3, '0')}`,
              data: result.data
            })
            continue
          }
          
          // Insert to database - PAKAI rptraId yang sudah diverifikasi
          await generateNomorAntrianAdmin({
            ...result.data,
            kuota_id: kuotaId,
            rptra_id: rptraId // PASTIKAN RPTRA_ID BENAR
          })
          
          results.value.success++
          results.value.details.push({
            row: result.row,
            status: 'success',
            message: 'Berhasil didaftarkan',
            data: result.data
          })
          
        } catch (err) {
          results.value.failed++
          results.value.details.push({
            row: result.row,
            status: 'error',
            message: err.message || 'Gagal insert ke database',
            data: result.data
          })
        }
      }
      
      progress.value = 100
      
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const downloadTemplate = () => {
    // DYNAMIC HEADER BERDASARKAN CONFIG
    const headers = ['email', 'kartu_pemanfaat', 'alamat', 'rt', 'rw', 'nomor_kk', 'nomor_atm', 'nama_pemilik_atm', 'whatsapp']
    const kelurahan = rptraConfig.value?.kelurahan || 'Pademangan Timur'
    const jalanKhas = getJalanKhasFromConfig()
    const exampleJalan = jalanKhas[0] || 'Pademangan'
    
    const sample = [
      `contoh@email.com,KJP,"Jl. ${exampleJalan} 2 Gang XX No 01",001,001,1234567890123456,1234567890123456,"Budi Santoso",081234567890`,
      `,PJLP,"Jl. Sudirman No 1, Jakarta Pusat",005,002,9876543210987654,9876543210987654,"Ani Wijaya",082345678901`
    ]
    
    const csvContent = [headers.join(','), ...sample].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `template_pendaftaran_${kelurahan.toLowerCase().replace(/\s+/g, '_')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return {
    loading,
    progress,
    currentRow,
    results,
    processCSV,
    downloadTemplate,
    resetResults,
    parseCSV,
    validateRow
  }
}

export default useCSVUpload