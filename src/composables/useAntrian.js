import { canViewAllRptra, user } from './useAuth'
import { supabase, getJakartaTime } from '../lib/supabase'

// GENERATE NOMOR ANTRIAN (User)
export const generateNomorAntrian = async (formData) => {
  const { kuota_id, rptra_id } = formData

  const { data: kuota, error: kuotaError } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuota_id)
    .single()
  
  if (kuotaError || !kuota) throw new Error('Kuota tidak ditemukan')
  
  // Cek waktu tutup
  if (kuota.target_close_time) {
    const closeTimeStr = kuota.target_close_time + 'Z'
    const closeTime = new Date(closeTimeStr).getTime()
    const now = Date.now()
    
    if (now > closeTime) {
      await supabase
        .from('kuota_bulanan')
        .update({ dibuka: false })
        .eq('id', kuota_id)
      throw new Error('Pendaftaran sudah ditutup (melewati jadwal)')
    }
  }
  
  if (!kuota.dibuka) throw new Error('Pendaftaran sudah ditutup')

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

  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

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

// Cek KK sudah terdaftar
export const checkKKExists = async (nomor_kk, kuota_id) => {
  const { data, error } = await supabase
    .from('antrian')
    .select('id, nomor_antrian, status')
    .eq('nomor_kk', nomor_kk)
    .eq('kuota_id', kuota_id)
    .maybeSingle()
  
  if (error) throw error
  return data
}

// ⭐ UPDATE: Hapus 'sudah swipe', tambah 'terverifikasi'
export const updateStatusAntrian = async (id, status, alasan = null) => {
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

export const getAllAntrian = async () => {
  let query = supabase
    .from('antrian')
    .select('*, rptra(nama), kuota_bulanan(bulan, tahun), nomor_kk, nomor_atm')
    .order('created_at', { ascending: false })
  
  if (!canViewAllRptra()) {
    query = query.eq('rptra_id', user.value?.rptra_id)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getAntrianById = async (id) => {
  const { data, error } = await supabase
    .from('antrian')
    .select('*, kuota_bulanan(bulan, tahun), rptra(nama)')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const getKuotaAktif = async (rptraId) => {
  const now = new Date()
  const bulan = now.getMonth() + 1
  const tahun = now.getFullYear()
  
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('rptra_id', rptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .single()
  
  if (error) return null
  return data
}

// ⭐ UPDATE: Ganti 'sudah_swipe' jadi 'terverifikasi'
export const getStats = async () => {
  let query = supabase
    .from('antrian')
    .select('status')
  
  if (!canViewAllRptra()) {
    query = query.eq('rptra_id', user.value?.rptra_id)
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
  
  const { count, error: countError } = await supabase
    .from('antrian')
    .select('*', { count: 'exact', head: true })
    .eq('kuota_id', kuota_id)
  
  if (countError) throw countError
  
  const currentCount = count || 0
  
  if (currentCount >= kuota.kuota) {
    throw new Error('Maaf, kuota sudah penuh. Silakan edit kuota terlebih dahulu.')
  }

  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

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

// Update data antrian (untuk edit)
export const updateAntrian = async (id, updateData) => {
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