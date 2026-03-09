import { supabase, getJakartaTime, toDateTimeLocal, fromDateTimeLocal, isNowInRange } from '../lib/supabase'
import { user, canViewAllRptra } from './useAuth'

// Re-export untuk kemudahan
export { toDateTimeLocal, fromDateTimeLocal }

// GET all kuota with count
export const getAllKuota = async (rptraId = null) => {
  let query = supabase
    .from('kuota_bulanan')
    .select('*, rptra(nama)')
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })

  if (rptraId && !canViewAllRptra()) {
    query = query.eq('rptra_id', rptraId)
  }

  const { data: kuotas, error } = await query
  if (error) throw error

  if (!kuotas || kuotas.length === 0) return []

  const kuotaWithCount = await Promise.all(
    kuotas.map(async (k) => {
      const { count } = await supabase
        .from('antrian')
        .select('*', { count: 'exact', head: true })
        .eq('kuota_id', k.id)
      
      return { ...k, terdaftar: count || 0 }
    })
  )

  return kuotaWithCount
}

// GET single kuota
export const getKuotaById = async (id) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*, rptra(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

// CEK SCHEDULE DAN AUTO OPEN
export const checkAndTriggerOpen = async (kuotaId) => {
  const { data: kuota, error } = await supabase
    .from('kuota_bulanan')
    .select('*')
    .eq('id', kuotaId)
    .single()
  
  if (error || !kuota) throw new Error('Kuota tidak ditemukan')
  
  if (kuota.dibuka) return { opened: true, kuota }
  
  if (!kuota.target_open_time || !kuota.target_close_time) {
    return { opened: false, kuota, reason: 'no_schedule' }
  }
  
  // ⭐ FIX: Database simpan UTC tanpa Z, kita tambahkan Z untuk parse sebagai UTC
  const openTimeStr = kuota.target_open_time.endsWith('Z') 
    ? kuota.target_open_time 
    : kuota.target_open_time + 'Z'
  const closeTimeStr = kuota.target_close_time.endsWith('Z')
    ? kuota.target_close_time
    : kuota.target_close_time + 'Z'
  
  const now = Date.now()
  const openTime = new Date(openTimeStr).getTime()
  const closeTime = new Date(closeTimeStr).getTime()
  
  if (now >= openTime && now <= closeTime) {
    const { data: updated, error: updateError } = await supabase
      .from('kuota_bulanan')
      .update({ dibuka: true })
      .eq('id', kuotaId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    return { opened: true, kuota: updated, triggered: true }
  }
  
  if (now < openTime) {
    return { opened: false, kuota, reason: 'not_yet_open', openTime: kuota.target_open_time }
  }
  
  if (now > closeTime) {
    return { opened: false, kuota, reason: 'already_closed', closeTime: kuota.target_close_time }
  }
  
  return { opened: false, kuota, reason: 'unknown' }
}

// CREATE kuota
export const createKuota = async (kuotaData) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .insert(kuotaData)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// UPDATE kuota
export const updateKuota = async (id, updateData) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// DELETE kuota
export const deleteKuota = async (id) => {
  await supabase.from('antrian').delete().eq('kuota_id', id)
  const { error } = await supabase.from('kuota_bulanan').delete().eq('id', id)
  if (error) throw error
  return true
}

// TOGGLE status manual
export const toggleKuotaStatus = async (id, currentStatus) => {
  return updateKuota(id, { dibuka: !currentStatus })
}

// CHECK exists
export const checkKuotaExists = async (rptraId, bulan, tahun) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('id')
    .eq('rptra_id', rptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .limit(1)

  if (error) throw error
  return data && data.length > 0
}

// GET current month kuota
export const getCurrentKuota = async (rptraId) => {
  const now = new Date()
  return getKuotaByQuery(rptraId, now.getMonth() + 1, now.getFullYear())
}

// GET by query
export const getKuotaByQuery = async (rptraId, bulan, tahun) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*, rptra(*)')
    .eq('rptra_id', rptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .maybeSingle()

  if (error) return null
  return data
}