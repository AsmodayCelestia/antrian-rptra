import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const user = ref(null)
export const session = ref(null)
export const isAdmin = ref(false)
export const isModerator = ref(false)
export const loading = ref(false)
export const error = ref(null)

export const login = async (email, password) => {
  loading.value = true
  error.value = null
  
  try {
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
        role: admin.role,
        rptra: admin.rptra,
        rptra_id: admin.rptra_id
      },
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    }
    
    localStorage.setItem('admin_session', JSON.stringify(newSession))
    
    session.value = newSession
    user.value = newSession.user
    isAdmin.value = admin.role === 'admin'
    isModerator.value = admin.role === 'moderator'
    
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
    
    session.value = parsed
    user.value = parsed.user
    isAdmin.value = parsed.user.role === 'admin'
    isModerator.value = parsed.user.role === 'moderator'
    
    return true
    
  } catch (err) {
    clearSession()
    return false
  }
}

const clearSession = () => {
  session.value = null
  user.value = null
  isAdmin.value = false
  isModerator.value = false
}

export const logout = () => {
  localStorage.removeItem('admin_session')
  clearSession()
}

export const canViewAllRptra = () => isModerator.value