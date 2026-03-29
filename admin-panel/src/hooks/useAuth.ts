import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

export function useAuth() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const profileQuery = useQuery<Profile | null>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!session?.user?.id,
  })

  return {
    session,
    profile: profileQuery.data,
    loading: loading || profileQuery.isLoading,
    isAdmin: profileQuery.data?.role === 'admin' || profileQuery.data?.role === 'super_admin',
  }
}
