import { supabase } from '../lib/supabase'
import { user, canViewAllRptra } from './useAuth'

// GET all kuota with count - FIX: tanpa .group()
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

  if (!kuotas || kuotas.length === 0) {
    return []
  }

  // ⭐ FIX: Count manual per kuota pakai Promise.all (tanpa .group())
  const kuotaWithCount = await Promise.all(
    kuotas.map(async (k) => {
      const { count, error: countError } = await supabase
        .from('antrian')
        .select('*', { count: 'exact', head: true })
        .eq('kuota_id', k.id)
      
      return {
        ...k,
        terdaftar: countError ? 0 : (count || 0)
      }
    })
  )

  return kuotaWithCount
}

// GET single kuota - FIX: handle 0 or 1 row
export const getKuotaById = async (id) => {
  const { data, error } = await supabase
    .from('kuota_bulanan')
    .select('*, rptra(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
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

// DELETE kuota (with cascade)
export const deleteKuota = async (id) => {
  const { error: antrianError } = await supabase
    .from('antrian')
    .delete()
    .eq('kuota_id', id)
  
  if (antrianError) {
    console.error('Error deleting antrian:', antrianError)
  }
  
  const { error } = await supabase
    .from('kuota_bulanan')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// TOGGLE status
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