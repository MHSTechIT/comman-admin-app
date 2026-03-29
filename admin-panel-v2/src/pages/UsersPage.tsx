import { useState } from 'react'
import { useUsersSheet } from '../data/users'
import { UsersSheetTable } from '../components/UsersSheetTable'
import { UsersFilters } from '../components/filters/UsersFilters'

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'disabled'>('all')
  const pageSize = 20

  const { data, isLoading, isError, error } = useUsersSheet({
    page,
    pageSize,
    search,
    status,
  })

  const total = (data && 'total' in data ? data.total : 0) as number
  const rows = (data && 'rows' in data ? data.rows : []) as typeof data extends { rows: infer R } ? R : never

  return (
    <div className="page">
      <UsersFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(0)
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v)
          setPage(0)
        }}
      />
      <UsersSheetTable
        rows={rows}
        loading={isLoading}
        error={isError ? (error as Error)?.message ?? 'Failed to load users' : null}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  )
}

