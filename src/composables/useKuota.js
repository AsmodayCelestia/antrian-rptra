import { supabase, toDateTimeLocal, fromDateTimeLocal, ensureTimeSynced, getTrustedTime } from '../lib/supabase'
import { user, canViewAllRptra } from './useAuth'

export { toDateTimeLocal, fromDateTimeLocal }

export const getAllKuota = async (rptraId = null, tipeKuota = null) => {
  let query = supabase
    .from('kuota_bulanan')
    .select('*, rptra(nama)')
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })
    .order('tipe_kuota', { ascending: true })

  if (!canViewAllRptra()) {
    const strictRptraId = rptraId || user.value?.rptra_id
    if (!strictRptraId) {
      throw new Error('RPTRA ID tidak ditemukan untuk user ini')
    }
    query = query.eq('rptra_id', strictRptraId)
  } else if (rptraId) {
    query = query.eq('rptra_id', rptraId)
  }

  if (tipeKuota) {
    query = query.eq('tipe_kuota', tipeKuota)
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
      
      return {
        ...k,
        terdaftar: count || 0
      }
    })
  )

  return kuotaWithCount
}

export const getKuotaById = async (id) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*, rptra(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

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
  
  await ensureTimeSynced()
  const now = getTrustedTime()
  
  const openTimeStr = kuota.target_open_time.endsWith('Z') 
    ? kuota.target_open_time 
    : kuota.target_open_time + 'Z'
  const closeTimeStr = kuota.target_close_time.endsWith('Z')
    ? kuota.target_close_time
    : kuota.target_close_time + 'Z'
  
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

export const createKuota = async (kuotaData) => {
  const insertData = { ...kuotaData }
  
  if (!canViewAllRptra()) {
    insertData.rptra_id = user.value?.rptra_id
  }
  
  if (!insertData.rptra_id) {
    throw new Error('RPTRA ID wajib diisi')
  }

  const { data, error } = await supabase
    .from('kuota_bulanan')
    .insert(insertData)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
    throw error
  }
  return data
}

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

export const deleteKuota = async (id) => {
  await supabase.from('antrian').delete().eq('kuota_id', id)
  const { error } = await supabase.from('kuota_bulanan').delete().eq('id', id)
  if (error) throw error
  return true
}

export const toggleKuotaStatus = async (id, currentStatus) => {
  return updateKuota(id, { dibuka: !currentStatus })
}

export const checkKuotaExists = async (rptraId, bulan, tahun, tipeKuota = 'umum') => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('id')
    .eq('rptra_id', rptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .eq('tipe_kuota', tipeKuota)
    .limit(1)

  if (error) throw error
  return data && data.length > 0
}

export const getCurrentKuota = async (rptraId, tipeKuota = 'umum') => {
  const now = new Date()
  return getKuotaByQuery(rptraId, now.getMonth() + 1, now.getFullYear(), tipeKuota)
}

export const getKuotaByQuery = async (rptraId, bulan, tahun, tipeKuota = 'umum') => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*, rptra(*)')
    .eq('rptra_id', rptraId)
    .eq('bulan', bulan)
    .eq('tahun', tahun)
    .eq('tipe_kuota', tipeKuota)
    .maybeSingle()

  if (error) return null
  return data
}