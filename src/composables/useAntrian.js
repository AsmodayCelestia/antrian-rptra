import { supabase } from '../lib/supabase'
import { canViewAllRptra, user } from './useAuth'

export const generateNomorAntrian = async (formData) => {
  const { kuota_id, rptra_id } = formData

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
  return data
}

// ⭐ TAMBAHAN: Cek KK sudah terdaftar di kuota ini
export const checkKKExists = async (nomor_kk, kuota_id) => {
  const { data, error } = await supabase
    .from('antrian')
    .select('id, nomor_antrian, status')
    .eq('nomor_kk', nomor_kk)
    .eq('kuota_id', kuota_id)
    .maybeSingle()
  
  if (error) throw error
  return data // return data kalo ada, null kalo ga ada
}

export const getAllAntrian = async () => {
  let query = supabase
    .from('antrian')
    .select('*, rptra(nama)')
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

export const updateStatusAntrian = async (id, status) => {
  const updateData = { status }
  
  if (status === 'dipanggil') updateData.dipanggil_at = new Date().toISOString()
  if (status === 'selesai') updateData.selesai_at = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('antrian')
    .update(updateData)
    .eq('id', id)
    .select()
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
    dipanggil: data?.filter(a => a.status === 'dipanggil').length || 0,
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
  
  if (data.status === 'batal') {
    return { valid: false, message: 'Antrian dibatalkan', data }
  }
  
  return { 
    valid: true, 
    message: data.status === 'menunggu' ? 'Antrian valid - Belum dipanggil' : 'Antrian sedang dipanggil',
    data 
  }
}