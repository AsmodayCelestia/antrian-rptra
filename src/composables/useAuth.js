import { ref, nextTick, computed } from 'vue'

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

// ⭐ COMPUTED ROLES (reaktif)
export const userRole = computed(() => user.value?.role || null)
export const isAdmin = computed(() => user.value?.role === 'admin')
export const isModerator = computed(() => user.value?.role === 'moderator')
export const isStaff = computed(() => user.value?.role === 'staff')

// ⭐ PERMISSION COMPUTED
export const canManageKuota = computed(() => ['admin', 'moderator'].includes(user.value?.role))
export const canEditAntrian = computed(() => ['admin', 'moderator'].includes(user.value?.role))
export const canViewDashboard = computed(() => ['admin', 'moderator', 'staff'].includes(user.value?.role))
export const canAccessQRScanner = computed(() => ['admin', 'moderator', 'staff'].includes(user.value?.role))

export const login = async (email, password) => {
  loading.value = true
  error.value = null
  
  try {
    const { supabase } = await import('../lib/supabase')
    
    const { data: isValid, error: rpcError } = await supabase
      .rpc('verify_admin_password', {
        p_email: email,
        p_password: password
      })
    
    if (rpcError) throw rpcError
    if (!isValid) throw new Error('Email atau password salah')
    
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*, rptra(*)')
      .eq('email', email)
      .single()
    
    if (adminError || !admin) throw new Error('Data admin tidak ditemukan')
    
    const newSession = {
      user: {
        id: admin.id,
        email: admin.email,
        nama: admin.nama,
        role: admin.role, // ⭐ Sekarang bisa 'admin', 'moderator', 'staff'
        rptra: admin.rptra,
        rptra_id: admin.rptra_id
      },
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    }
    
    localStorage.setItem('admin_session', JSON.stringify(newSession))
    
    session.value = newSession
    user.value = newSession.user
    
    await nextTick()
    
    return { success: true, role: admin.role }
    
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  } finally {
    loading.value = false
  }
}

export const checkSession = () => {
  try {
    const saved = localStorage.getItem('admin_session')
    if (!saved) {
      clearSession()
      return false
    }
    
    const parsed = JSON.parse(saved)
    if (Date.now() > parsed.expires_at) {
      localStorage.removeItem('admin_session')
      clearSession()
      return false
    }
    
    if (JSON.stringify(session.value) !== JSON.stringify(parsed)) {
      session.value = parsed
      user.value = parsed.user
    }
    
    return true
  } catch {
    clearSession()
    return false
  }
}

const clearSession = () => {
  session.value = null
  user.value = null
}

export const logout = () => {
  localStorage.removeItem('admin_session')
  clearSession()
}

// ⭐ Legacy support (biar ga break code lama)
export const canViewAllRptra = () => isModerator.value