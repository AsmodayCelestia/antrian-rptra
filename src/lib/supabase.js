import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// SERVER TIME SYNC (Anti Time Manipulation)
// ============================================

let serverTimeOffset = 0
let lastSyncTime = 0
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 menit

export const syncServerTime = async () => {
  try {
    const clientStart = Date.now()
    const { data, error } = await supabase.rpc('get_server_time')
    
    if (error) {
      console.error('[TIME SYNC] RPC error:', error)
      return false
    }
    
    const clientEnd = Date.now()
    const latency = (clientEnd - clientStart) / 2
    const serverTimestamp = new Date(data).getTime()
    
    serverTimeOffset = serverTimestamp - clientEnd + latency
    lastSyncTime = clientEnd
    
    console.log('[TIME SYNC] Success. Offset:', serverTimeOffset, 'ms')
    return true
  } catch (err) {
    console.error('[TIME SYNC] Failed:', err)
    return false
  }
}

export const getTrustedTime = () => {
  if (lastSyncTime === 0) {
    console.warn('[SECURITY] Server time not synced yet, using client time as fallback')
    return Date.now()
  }
  
  const timeSinceLastSync = Date.now() - lastSyncTime
  if (timeSinceLastSync > SYNC_INTERVAL_MS) {
    console.warn('[SECURITY] Server time sync stale (>5min), offset might be inaccurate')
  }
  
  return Date.now() + serverTimeOffset
}

export const ensureTimeSynced = async () => {
  if (lastSyncTime === 0) {
    return await syncServerTime()
  }
  if (Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
    return await syncServerTime()
  }
  return true
}

// Init: sync pas load (non-blocking)
syncServerTime().catch(() => {})

// ============================================
// TIMEZONE JAKARTA HELPERS
// ============================================

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

export const getJakartaTime = () => {
  const trustedNow = getTrustedTime()
  const utc = trustedNow + (new Date().getTimezoneOffset() * 60000)
  return new Date(utc + JAKARTA_OFFSET_MS)
}

export const toDateTimeLocal = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  
  const wibTime = new Date(d.getTime() + JAKARTA_OFFSET_MS)
  
  const pad = (n) => n.toString().padStart(2, '0')
  const year = wibTime.getUTCFullYear()
  const month = pad(wibTime.getUTCMonth() + 1)
  const day = pad(wibTime.getUTCDate())
  const hours = pad(wibTime.getUTCHours())
  const minutes = pad(wibTime.getUTCMinutes())
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const fromDateTimeLocal = (input) => {
  if (!input) return null
  
  const [datePart, timePart] = input.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes) - JAKARTA_OFFSET_MS
  return new Date(utcTimestamp).toISOString()
}

export const formatWIB = (isoString) => {
  if (!isoString) return '-'
  
  const utcDate = new Date(isoString)
  const wibTime = new Date(utcDate.getTime() + JAKARTA_OFFSET_MS)
  
  return wibTime.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB'
}

export const isNowInRange = (startIso, endIso) => {
  const now = getTrustedTime()
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return now >= start && now <= end
}