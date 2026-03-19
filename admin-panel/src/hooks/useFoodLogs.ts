import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { FoodLog } from '../types/database'

interface UseFoodLogsOptions {
  userId?: string
  period?: 'today' | 'weekly' | 'monthly'
  startDate?: string
  endDate?: string
}

export function useFoodLogs(options: UseFoodLogsOptions = {}) {
  const { userId, period = 'today' } = options

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    const endDate = new Date(now)

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  }

  const dateRange = getDateRange()

  return useQuery<FoodLog[]>({
    queryKey: ['foodLogs', userId, period],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useFoodLogImages(foodLogId?: string) {
  return useQuery({
    queryKey: ['foodLogImages', foodLogId],
    queryFn: async () => {
      if (!foodLogId) return []
      const { data, error } = await supabase
        .from('food_log_images')
        .select('*')
        .eq('food_log_id', foodLogId)

      if (error) throw error
      return data || []
    },
    enabled: !!foodLogId,
  })
}
