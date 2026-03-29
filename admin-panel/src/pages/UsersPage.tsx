import { useState } from 'react'
import { useUsers } from '../hooks/useUsers'
import { UsersSheetTable } from '../components/UsersSheetTable'

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const limit = 10

  const { data, isLoading } = useUsers({
    page,
    limit,
    search,
    status: status || undefined,
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users</h1>
      <UsersSheetTable
        users={data?.users || []}
        isLoading={isLoading}
        totalCount={data?.count || 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onSearch={setSearch}
        onStatusChange={setStatus}
        search={search}
        status={status}
      />
    </div>
  )
}
