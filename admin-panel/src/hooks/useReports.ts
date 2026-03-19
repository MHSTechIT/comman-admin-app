import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { UserReport } from '../types/database'

export function useUserReports(userId?: string) {
  return useQuery<UserReport[]>({
    queryKey: ['reports', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useReport(reportId?: string) {
  return useQuery<UserReport | null>({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!reportId,
  })
}
