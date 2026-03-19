import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface ProfileRow {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  status: 'active' | 'disabled' | string
  role: 'user' | 'admin' | 'super_admin' | string
  created_at: string
}

export interface UsersFilter {
  search?: string
  status?: 'all' | 'active' | 'disabled'
  page?: number
  pageSize?: number
}

export interface PaginatedUsers {
  rows: ProfileRow[]
  total: number
}

export function useUsersSheet(filter: UsersFilter) {
  const queryClient = useQueryClient()
  const pageSize = filter.pageSize ?? 20
  const page = filter.page ?? 0
  const search = filter.search?.trim() ?? ''
  const status = filter.status ?? 'all'

  const queryKey = useMemo(
    () => ['users-sheet', { page, pageSize, search, status }],
    [page, pageSize, search, status],
  )

  const query = useQuery<PaginatedUsers, Error>({
    queryKey,
    queryFn: async () => {
      let base = supabase
        .from('profiles')
        .select(
          'id, name, email, phone, status, role, created_at',
          { count: 'exact' },
        )

      if (search) {
        base = base.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        )
      }

      if (status === 'active') {
        base = base.eq('status', 'active')
      } else if (status === 'disabled') {
        base = base.eq('status', 'disabled')
      }

      base = base.order('created_at', { ascending: false })
      const from = page * pageSize
      const to = from + pageSize - 1
      const { data, error, count } = await base.range(from, to)
      if (error) {
        throw error
      }
      return {
        rows: (data ?? []) as ProfileRow[],
        total: count ?? 0,
      }
    },
  })

  const prefetchPage = (nextPage: number) => {
    if (nextPage < 0) return
    queryClient
      .prefetchQuery({
        queryKey: ['users-sheet', { page: nextPage, pageSize, search, status }],
        queryFn: async () => {
          // reuse same logic without reading from hook instance
          let base = supabase
            .from('profiles')
            .select(
              'id, name, email, phone, status, role, created_at',
              { count: 'exact' },
            )

          if (search) {
            base = base.or(
              `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
            )
          }

          if (status === 'active') {
            base = base.eq('status', 'active')
          } else if (status === 'disabled') {
            base = base.eq('status', 'disabled')
          }

          base = base.order('created_at', { ascending: false })
          const from = nextPage * pageSize
          const to = from + pageSize - 1
          const { data, error, count } = await base.range(from, to)
          if (error) {
            throw error
          }
          return {
            rows: (data ?? []) as ProfileRow[],
            total: count ?? 0,
          }
        },
      })
      .catch(() => {})
  }

  return { ...query, prefetchPage }
}

