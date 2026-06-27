import { canViewAllRptra, user, isModerator } from './useAuth'
import { supabase, ensureTimeSynced, getTrustedTime } from '../lib/supabase'

// Helper: Cek akses RPTRA
const verifyRptraAccess = (antrianData) => {
  if (isModerator.value) return true
  return antrianData?.rptra_id === user.value?.rptra_id
}

// GENERATE NOMOR ANTRIAN (User Publik)
export const generateNomorAntrian = async (formData) => {
  const { kuota_id, rptra_id } = formData

  const { data: kuota, error: kuotaError } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuota_id)
    .single()
  
  if (kuotaError || !kuota) throw new Error('Kuota tidak ditemukan')
  
  if (kuota.rptra_id !== rptra_id) {
    throw new Error('Data kuota tidak valid')
  }
  
  await ensureTimeSynced()
  const now = getTrustedTime()
  
  // Validasi tipe kuota
  if (kuota.tipe_kuota === 'pjlp' && formData.kartu_pemanfaat !== 'PJLP') {
    throw new Error('Kuota ini khusus untuk PJLP. Silakan pilih kuota umum.')
  }
  
  if (kuota.tipe_kuota === 'umum' && formData.kartu_pemanfaat === 'PJLP') {
    throw new Error('PJLP wajib mendaftar melalui kuota PJLP.')
  }
  
  if (kuota.target_open_time) {
    const openTimeStr = kuota.target_open_time + 'Z'
    const openTime = new Date(openTimeStr).getTime()
    
    if (now < openTime) {
      throw new Error('Pendaftaran belum dibuka')
    }
  }
  
  if (kuota.target_close_time) {
    const closeTimeStr = kuota.target_close_time + 'Z'
    const closeTime = new Date(closeTimeStr).getTime()
    
    if (now > closeTime) {
      await supabase
        .from('kuota_bulanan')
        .update({ dibuka: false })
        .eq('id', kuota_id)
      throw new Error('Pendaftaran sudah ditutup (melewati jadwal)')
    }
  }
  
  if (!kuota.dibuka) throw new Error('Pendaftaran sudah ditutup')

  // ⭐ CROSS-KUOTA CHECK: KK sudah terdaftar di bulan/tahun yang sama?
  const { data: existingKK } = await supabase
    .from('antrian')
    .select('id, nomor_antrian, kuota_id, kuota_bulanan!inner(rptra_id, bulan, tahun)')
    .eq('nomor_kk', formData.nomor_kk)
    .neq('status', 'batal')
    .eq('kuota_bulanan.rptra_id', kuota.rptra_id)
    .eq('kuota_bulanan.bulan', kuota.bulan)
    .eq('kuota_bulanan.tahun', kuota.tahun)
    .maybeSingle()

  if (existingKK) {
    throw new Error(`KK sudah terdaftar di periode ini dengan nomor antrian #${existingKK.nomor_antrian.toString().padStart(3, '0')}`)
  }

  // Cek sisa kuota
  const { count, error: countError } = await supabase
    .from('antrian')
    .select('*', { count: 'exact', head: true })
    .eq('kuota_id', kuota_id)
  
  if (countError) throw countError
  
  const currentCount = count || 0
  
  if (currentCount >= kuota.kuota) {
    await supabase
      .from('kuota_bulanan')
      .update({ dibuka: false })
      .eq('id', kuota_id)
    throw new Error('Maaf, kuota sudah penuh')
  }

  // Get next nomor
  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

  // Insert
  const { data, error } = await supabase
    .from('antrian')
    .insert({
      nomor_antrian: nextNomor,
      kuota_id,
      rptra_id,
      email: formData.email,
      kelurahan: formData.kelurahan,
      kartu_pemanfaat: formData.kartu_pemanfaat,
      alamat: formData.alamat,
      rt: formData.rt,
      rw: formData.rw,
      nomor_kk: formData.nomor_kk,
      nomor_atm: formData.nomor_atm,
      nama_pemilik_atm: formData.nama_pemilik_atm,
      whatsapp: formData.whatsapp,
      status: 'menunggu'
    })
    .select()
    .single()

  if (error) throw error
  
  if (nextNomor >= kuota.kuota) {
    await supabase
      .from('kuota_bulanan')
      .update({ dibuka: false })
      .eq('id', kuota_id)
  }
  
  return data
}

// Cek KK sudah terdaftar — CROSS-KUOTA (per bulan/tahun/rptra)
export const checkKKExists = async (nomor_kk, kuota_id) => {
  // Get kuota info dulu
  const { data: kuota } = await supabase
    .from('kuota_bulanan')
    .select('rptra_id, bulan, tahun')
    .eq('id', kuota_id)
    .single()
  
  if (!kuota) return null

  // Cek KK di bulan/tahun yang sama di RPTRA ini (regardless tipe kuota)
  const { data, error } = await supabase
    .from('antrian')
    .select('id, nomor_antrian, status, kuota_id, kuota_bulanan!inner(rptra_id, bulan, tahun, tipe_kuota)')
    .eq('nomor_kk', nomor_kk)
    .neq('status', 'batal')
    .eq('kuota_bulanan.rptra_id', kuota.rptra_id)
    .eq('kuota_bulanan.bulan', kuota.bulan)
    .eq('kuota_bulanan.tahun', kuota.tahun)
    .maybeSingle()
  
  if (error) throw error
  return data
}

// Update status antrian - dengan ownership check
export const updateStatusAntrian = async (id, status, alasan = null) => {
  const { data: antrian, error: fetchError } = await supabase
    .from('antrian')
    .select('rptra_id')
    .eq('id', id)
    .single()
  
  if (fetchError || !antrian) throw new Error('Data antrian tidak ditemukan')
  
  if (!verifyRptraAccess(antrian)) {
    throw new Error('Data antrian tidak ditemukan')
  }
  
  const updateData = { status }
  
  if (status === 'selesai') updateData.selesai_at = new Date().toISOString()
  if (status === 'terverifikasi') updateData.verified_at = new Date().toISOString()
  if (status === 'ditolak' && alasan) updateData.alasan_ditolak = alasan
  
  const { data, error } = await supabase
    .from('antrian')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Get all antrian - dengan filter RPTRA untuk non-moderator
export const getAllAntrian = async () => {
  let query = supabase
    .from('antrian')
    .select('*, rptra(nama), kuota_bulanan(bulan, tahun, tipe_kuota), nomor_kk, nomor_atm')
    .order('created_at', { ascending: false })
  
  if (!canViewAllRptra()) {
    if (!user.value?.rptra_id) {
      throw new Error('Session tidak valid - RPTRA ID tidak ditemukan')
    }
    query = query.eq('rptra_id', user.value.rptra_id)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Get antrian by ID - dengan ownership check
export const getAntrianById = async (id, isPublic = false) => {
  const { data, error } = await supabase
    .from('antrian')
    .select('*, kuota_bulanan(bulan, tahun, tipe_kuota), rptra(nama)')
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  if (!isPublic && !verifyRptraAccess(data)) {
    return null
  }
  
  return data
}

// Get kuota aktif
export const getKuotaAktif = async (rptraId) => {
  const effectiveRptraId = canViewAllRptra() ? rptraId : (user.value?.rptra_id || rptraId)
  
  if (!effectiveRptraId) {
    throw new Error('RPTRA ID tidak ditemukan')
  }

  const now = new Date()
  const bulan = now.getMonth() + 1
  const tahun = now.getFullYear()
  
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('rptra_id', effectiveRptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .single()
  
  if (error) return null
  return data
}

// Get stats
export const getStats = async () => {
  let query = supabase
    .from('antrian')
    .select('status')
  
  if (!canViewAllRptra()) {
    if (!user.value?.rptra_id) {
      throw new Error('Session tidak valid')
    }
    query = query.eq('rptra_id', user.value.rptra_id)
  }

  const { data, error } = await query
  if (error) throw error
  
  return {
    total: data?.length || 0,
    menunggu: data?.filter(a => a.status === 'menunggu').length || 0,
    terverifikasi: data?.filter(a => a.status === 'terverifikasi').length || 0,
    ditolak: data?.filter(a => a.status === 'ditolak').length || 0,
    selesai: data?.filter(a => a.status === 'selesai').length || 0
  }
}

// Validate QR - dengan ownership check
export const validateQR = async (nomor, kuota_id) => {
  const { data, error } = await supabase
    .from('antrian')
    .select('*, rptra(nama)')
    .eq('nomor_antrian', nomor)
    .eq('kuota_id', kuota_id)
    .single()
  
  if (error || !data) {
    return { valid: false, message: 'Nomor antrian tidak ditemukan' }
  }
  
  if (!verifyRptraAccess(data)) {
    return { valid: false, message: 'Nomor antrian tidak ditemukan' }
  }
  
  if (data.status === 'selesai') {
    return { valid: false, message: 'Antrian sudah selesai', data }
  }
  
  if (data.status === 'ditolak') {
    return { valid: false, message: 'Pendaftaran ditolak', data }
  }
  
  if (data.status === 'batal') {
    return { valid: false, message: 'Antrian dibatalkan', data }
  }
  
  return { 
    valid: true, 
    message: data.status === 'menunggu' ? 'Antrian valid - Menunggu verifikasi' : 'Antrian terverifikasi - Siap swipe',
    data 
  }
}

// Generate nomor untuk admin (bypass waktu)
export const generateNomorAntrianAdmin = async (formData) => {
  const { kuota_id, rptra_id } = formData

  const { data: kuota, error: kuotaError } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuota_id)
    .single()
  
  if (kuotaError || !kuota) throw new Error('Kuota tidak ditemukan')
  
  if (!canViewAllRptra() && kuota.rptra_id !== user.value?.rptra_id) {
    throw new Error('Kuota tidak ditemukan')
  }
  
  // ⭐ CROSS-KUOTA CHECK: KK sudah terdaftar di bulan/tahun yang sama?
  const { data: existingKK } = await supabase
    .from('antrian')
    .select('id, nomor_antrian, kuota_id, kuota_bulanan!inner(rptra_id, bulan, tahun)')
    .eq('nomor_kk', formData.nomor_kk)
    .neq('status', 'batal')
    .eq('kuota_bulanan.rptra_id', kuota.rptra_id)
    .eq('kuota_bulanan.bulan', kuota.bulan)
    .eq('kuota_bulanan.tahun', kuota.tahun)
    .maybeSingle()

  if (existingKK) {
    throw new Error(`KK sudah terdaftar di periode ini dengan nomor antrian #${existingKK.nomor_antrian.toString().padStart(3, '0')}`)
  }
  
  // Cek sisa kuota
  const { count, error: countError } = await supabase
    .from('antrian')
    .select('*', { count: 'exact', head: true })
    .eq('kuota_id', kuota_id)
  
  if (countError) throw countError
  
  const currentCount = count || 0
  
  if (currentCount >= kuota.kuota) {
    throw new Error('Maaf, kuota sudah penuh. Silakan edit kuota terlebih dahulu.')
  }

  // Get next nomor
  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

  // Insert
  const { data, error } = await supabase
    .from('antrian')
    .insert({
      nomor_antrian: nextNomor,
      kuota_id,
      rptra_id: kuota.rptra_id,
      email: formData.email,
      kelurahan: formData.kelurahan,
      kartu_pemanfaat: formData.kartu_pemanfaat,
      alamat: formData.alamat,
      rt: formData.rt,
      rw: formData.rw,
      nomor_kk: formData.nomor_kk,
      nomor_atm: formData.nomor_atm,
      nama_pemilik_atm: formData.nama_pemilik_atm,
      whatsapp: formData.whatsapp,
      status: 'menunggu'
    })
    .select()
    .single()

  if (error) throw error
  
  if (nextNomor >= kuota.kuota) {
    await supabase
      .from('kuota_bulanan')
      .update({ dibuka: false })
      .eq('id', kuota_id)
  }
  
  return data
}

// Update data antrian (untuk edit) - dengan ownership check
export const updateAntrian = async (id, updateData) => {
  const { data: antrian, error: fetchError } = await supabase
    .from('antrian')
    .select('rptra_id')
    .eq('id', id)
    .single()
  
  if (fetchError || !antrian) throw new Error('Data antrian tidak ditemukan')
  
  if (!verifyRptraAccess(antrian)) {
    throw new Error('Data antrian tidak ditemukan')
  }
  
  const { data, error } = await supabase
    .from('antrian')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}