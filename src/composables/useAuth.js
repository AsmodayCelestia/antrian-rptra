import { ref, nextTick, computed } from 'vue'
import { rptraConfig, rptraData, clearRPTRAConfig } from './useRPTRA'

const initSession = () => {
  try {
    const saved = localStorage.getItem('admin_session')
    if (!saved) return null
    
    const parsed = JSON.parse(saved)
    if (Date.now() > parsed.expires_at) {
      localStorage.removeItem('admin_session')
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const initialSession = initSession()

export const user = ref(initialSession?.user || null)
export const session = ref(initialSession || null)
export const loading = ref(false)
export const error = ref(null)

export const userRole = computed(() => user.value?.role || null)
export const isAdmin = computed(() => user.value?.role === 'admin')
export const isModerator = computed(() => user.value?.role === 'moderator')
export const isStaff = computed(() => user.value?.role === 'staff')

export const canManageKuota = computed(() => ['admin', 'moderator'].includes(user.value?.role))
export const canEditAntrian = computed(() => ['admin', 'moderator'].includes(user.value?.role))
export const canViewDashboard = computed(() => ['admin', 'moderator', 'staff'].includes(user.value?.role))
export const canAccessQRScanner = computed(() => ['admin', 'moderator', 'staff'].includes(user.value?.role))

export const currentRptraId = computed(() => user.value?.rptra_id || null)
export const currentRptra = computed(() => user.value?.rptra || null)

// GANTI FUNGSI LOGIN DI useAuth.js
export const login = async (email, password) => {
  loading.value = true
  error.value = null
  
  try {
    const { supabase } = await import('../lib/supabase')
    
    const { data: isValid, error: rpcError } = await supabase
      .rpc('verify_admin_password', { p_email: email, p_password: password })
    
    if (rpcError) throw rpcError
    if (!isValid) throw new Error('Email atau password salah')
    
    const { data: admin, error: adminError } = await supabase
      .from('admins').select('*').eq('email', email).single()
    
    if (adminError || !admin) throw new Error('Data admin tidak ditemukan')
    
    let fetchedRptra = null
    if (admin.rptra_id) {
      const { data: rptra } = await supabase
        .from('rptra')
        .select('id, nama, kelurahan, alamat, config')
        .eq('id', admin.rptra_id)
        .single()
      
      if (rptra) {
        fetchedRptra = rptra
        // Update rptraData & Config segera
        rptraData.value = { ...rptra }
        if (rptra.config) {
          rptraConfig.value = { kelurahan: rptra.kelurahan, ...rptra.config }
        }
      }
    }
    
    const newSession = {
      user: {
        id: admin.id,
        email: admin.email,
        nama: admin.nama,
        role: admin.role,
        rptra_id: admin.rptra_id,
        rptra: fetchedRptra // Pastikan ini terisi
      },
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    }
    
    localStorage.setItem('admin_session', JSON.stringify(newSession))
    session.value = newSession
    user.value = newSession.user
    
    return { success: true, role: admin.role }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    loading.value = false
  }
}

// GANTI FUNGSI CHECKSESSION DI useAuth.js
export const checkSession = () => {
  try {
    const saved = localStorage.getItem('admin_session')
    if (!saved) return false
    
    const parsed = JSON.parse(saved)
    if (Date.now() > parsed.expires_at) {
      logout()
      return false
    }

    // Pastikan rptraData sync dengan session
    if (parsed.user?.rptra) {
      rptraData.value = parsed.user.rptra
      if (parsed.user.rptra.config) {
        rptraConfig.value = { 
          kelurahan: parsed.user.rptra.kelurahan, 
          ...parsed.user.rptra.config 
        }
      }
    }

    user.value = parsed.user
    session.value = parsed
    return true
  } catch (err) {
    logout()
    return false
  }
}

const clearSession = () => {
  session.value = null
  user.value = null
  clearRPTRAConfig()
}

export const logout = () => {
  localStorage.removeItem('admin_session')
  clearSession()
}

export const canViewAllRptra = () => isModerator.value