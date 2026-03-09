import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// TIMEZONE JAKARTA HELPERS
// ============================================

// WIB = UTC+7
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000 // 7 jam dalam ms

// Get waktu sekarang di Jakarta sebagai Date object
export const getJakartaTime = () => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + JAKARTA_OFFSET_MS)
}

// Format Date ke datetime-local input (YYYY-MM-DDTHH:mm) dalam WIB
export const toDateTimeLocal = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Convert UTC ke WIB (tambah 7 jam)
  const wibTime = new Date(d.getTime() + JAKARTA_OFFSET_MS)
  
  const pad = (n) => n.toString().padStart(2, '0')
  const year = wibTime.getUTCFullYear()
  const month = pad(wibTime.getUTCMonth() + 1)
  const day = pad(wibTime.getUTCDate())
  const hours = pad(wibTime.getUTCHours())
  const minutes = pad(wibTime.getUTCMinutes())
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Parse datetime-local input (WIB) ke ISO string UTC untuk database
export const fromDateTimeLocal = (input) => {
  if (!input) return null
  
  // Input dari datetime-local adalah waktu lokal browser (WIB)
  // Kita parse sebagai UTC lalu kurangi offset untuk dapet UTC bener
  
  const [datePart, timePart] = input.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Buat date object UTC dengan nilai yang sama dengan input WIB
  // Lalu kurangi 7 jam untuk convert ke UTC
  const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes) - JAKARTA_OFFSET_MS
  
  return new Date(utcTimestamp).toISOString()
}

// Format ISO string UTC dari database ke tampilan WIB
export const formatWIB = (isoString) => {
  if (!isoString) return '-'
  
  // Parse ISO string (UTC) ke Date object
  const utcDate = new Date(isoString)
  
  // Convert ke WIB (tambah 7 jam)
  const wibTime = new Date(utcDate.getTime() + JAKARTA_OFFSET_MS)
  
  return wibTime.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB'
}

// Cek apakah waktu sekarang dalam range
export const isNowInRange = (startIso, endIso) => {
  const now = getJakartaTime().getTime()
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return now >= start && now <= end
}