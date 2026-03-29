import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

interface UseUsersOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
}

export function useUsers(options: UseUsersOptions = {}) {
  const { page = 1, limit = 10, search = '', status, sortBy = 'created_at' } = options

  return useQuery<{ users: Profile[]; count: number; error?: string }>({
    queryKey: ['users', { page, limit, search, status, sortBy }],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*', { count: 'exact' })

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const offset = (page - 1) * limit
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortBy !== 'created_at' })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching users:', error)
        return { users: [], count: 0, error: error.message }
      }

      return { users: data || [], count: count || 0 }
    },
  })
}

export function useUser(userId?: string) {
  return useQuery<Profile | null>({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
