import { canViewAllRptra, user } from './useAuth'
import { supabase, getJakartaTime } from '../lib/supabase'

// ⭐ GENERATE NOMOR ANTRIAN DENGAN AUTO CLOSE
export const generateNomorAntrian = async (formData) => {
  const { kuota_id, rptra_id } = formData

  // Ambil data kuota dan lock row untuk prevent race condition
  const { data: kuota, error: kuotaError } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuota_id)
    .single()
  
  if (kuotaError || !kuota) throw new Error('Kuota tidak ditemukan')
  
  // ⭐ CEK WAKTU TUTUP (AUTO CLOSE) - FIX: Database UTC tanpa Z, parse sebagai UTC lalu convert
  if (kuota.target_close_time) {
    // Database simpan UTC tanpa Z, kita append Z supaya parse sebagai UTC
    const closeTimeStr = kuota.target_close_time + 'Z'
    const closeTime = new Date(closeTimeStr).getTime()
    const now = Date.now()
    
    if (now > closeTime) {
      // Auto close kuota
      await supabase
        .from('kuota_bulanan')
        .update({ dibuka: false })
        .eq('id', kuota_id)
      throw new Error('Pendaftaran sudah ditutup (melewati jadwal)')
    }
  }
  
  // Cek apakah kuota masih open secara manual
  if (!kuota.dibuka) throw new Error('Pendaftaran sudah ditutup')

  // Cek apakah sudah penuh
  const { count, error: countError } = await supabase
    .from('antrian')
    .select('*', { count: 'exact', head: true })
    .eq('kuota_id', kuota_id)
  
  if (countError) throw countError
  
  const currentCount = count || 0
  
  if (currentCount >= kuota.kuota) {
    // Auto close kuota
    await supabase
      .from('kuota_bulanan')
      .update({ dibuka: false })
      .eq('id', kuota_id)
    
    throw new Error('Maaf, kuota sudah penuh')
  }

  // Ambil nomor antrian terakhir
  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

  // Insert antrian
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
  
  // ⭐ CEK USER TERAKHIR - AUTO CLOSE
  if (nextNomor >= kuota.kuota) {
    // Ini user terakhir, auto close kuota
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

// Update status dengan alasan
export const updateStatusAntrian = async (id, status, alasan = null) => {
  const updateData = { status }
  
  if (status === 'selesai') updateData.selesai_at = new Date().toISOString()
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

// ⭐ UPDATED: Include nomor_kk dan nomor_atm untuk search
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
    message: data.status === 'menunggu' ? 'Antrian valid - Menunggu verifikasi' : 'Antrian sedang diproses',
    data 
  }
}

// ⭐ FUNGSI BARU: Generate nomor untuk admin (bypass waktu, tetap cek kuota)
export const generateNomorAntrianAdmin = async (formData) => {
  const { kuota_id, rptra_id } = formData

  const { data: kuota, error: kuotaError } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuota_id)
    .single()
  
  if (kuotaError || !kuota) throw new Error('Kuota tidak ditemukan')
  
  // ⭐ BYPASS WAKTU: Admin bisa daftar kapanpun, tapi tetap cek kuota
  
  // Cek apakah sudah penuh
  const { count, error: countError } = await supabase
    .from('antrian')
    .select('*', { count: 'exact', head: true })
    .eq('kuota_id', kuota_id)
  
  if (countError) throw countError
  
  const currentCount = count || 0
  
  if (currentCount >= kuota.kuota) {
    throw new Error('Maaf, kuota sudah penuh. Silakan edit kuota terlebih dahulu.')
  }

  // Ambil nomor antrian terakhir
  const { data: last } = await supabase
    .from('antrian')
    .select('nomor_antrian')
    .eq('kuota_id', kuota_id)
    .order('nomor_antrian', { ascending: false })
    .limit(1)
    .single()

  const nextNomor = last ? last.nomor_antrian + 1 : 1

  // Insert antrian
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
  
  // Auto close kalau penuh
  if (nextNomor >= kuota.kuota) {
    await supabase
      .from('kuota_bulanan')
      .update({ dibuka: false })
      .eq('id', kuota_id)
  }
  
  return data
}