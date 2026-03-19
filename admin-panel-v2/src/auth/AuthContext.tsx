import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type Role = 'user' | 'admin' | 'super_admin'

export interface AuthProfile {
  id: string
  email: string | null
  role: Role
  status: 'active' | 'disabled' | string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  signInWithEmail: (opts: { email: string; password: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile', error)
        setProfile(null)
        return
      }
      if (!data) {
        setProfile(null)
        return
      }
      setProfile({
        id: data.id,
        email: data.email ?? null,
        role: (data.role ?? 'user') as Role,
        status: (data.status ?? 'active') as AuthProfile['status'],
      })
    },
    [],
  )

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      await loadProfile(data.session?.user ?? null)
      setLoading(false)
    }
    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      await loadProfile(newSession?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithEmail: AuthContextValue['signInWithEmail'] = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message }
    }
    setSession(data.session)
    setUser(data.user)
    await loadProfile(data.user)
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    signInWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

