import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { DrinkLog } from '../types/database'

interface UseDrinkLogsOptions {
  userId?: string
  period?: 'today' | 'weekly' | 'monthly'
}

export function useDrinkLogs(options: UseDrinkLogsOptions = {}) {
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

  return useQuery<DrinkLog[]>({
    queryKey: ['drinkLogs', userId, period],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('drink_logs')
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
