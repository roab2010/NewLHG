import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  async function fetchProfile(userId) {
    // Chống gọi trùng lặp
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('[AuthContext] fetchProfile exception:', error)
      setProfile(null)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // Lấy session hiện tại khi mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Lắng nghe thay đổi auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        // Chỉ xử lý SIGNED_IN và SIGNED_OUT, bỏ qua TOKEN_REFRESHED và INITIAL_SESSION
        if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null)
          if (session?.user) fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, displayName, phone) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone: phone,
        },
      },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    // Xóa state ngay lập tức TRƯỚC khi gọi API
    setUser(null)
    setProfile(null)
    setSession(null)

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[AuthContext] signOut error (ignored):', err)
    }

    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    token: session?.access_token,
    isAdmin: profile?.role === 'admin',
    isMember: profile?.role === 'member' || profile?.role === 'admin',
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
