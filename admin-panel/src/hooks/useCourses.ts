import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Course, UserCourse } from '../types/database'

export function useUserCourses(userId?: string) {
  return useQuery<(UserCourse & { course?: Course })[]>({
    queryKey: ['userCourses', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('user_courses')
        .select('*, courses(*)')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    },
  })
}
