import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Profile } from '../types/database'

interface UsersSheetTableProps {
  users: Profile[]
  isLoading: boolean
  totalCount: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onStatusChange: (status: string) => void
  search: string
  status: string
}

export function UsersSheetTable({
  users,
  isLoading,
  totalCount,
  page,
  limit,
  onPageChange,
  onSearch,
  onStatusChange,
  search,
  status,
}: UsersSheetTableProps) {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search)
  const totalPages = Math.ceil(totalCount / limit)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    onSearch(value)
  }

  const cellClick = (userId: string, column: string) => {
    const routes: Record<string, string> = {
      name: `/users/${userId}`,
      food: `/users/${userId}/food`,
      drink: `/users/${userId}/drink`,
      report: `/users/${userId}/reports`,
      course: `/users/${userId}/courses`,
    }
    navigate(routes[column] || `/users/${userId}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchInput}
          onChange={handleSearch}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Food</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Drink</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Report</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Course</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td
                    onClick={() => cellClick(user.id, 'name')}
                    className="px-6 py-4 text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                  >
                    {user.name}
                  </td>
                  <td
                    onClick={() => cellClick(user.id, 'food')}
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                  >
                    View
                  </td>
                  <td
                    onClick={() => cellClick(user.id, 'drink')}
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                  >
                    View
                  </td>
                  <td
                    onClick={() => cellClick(user.id, 'report')}
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                  >
                    View
                  </td>
                  <td
                    onClick={() => cellClick(user.id, 'course')}
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                  >
                    View
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {Math.min((page - 1) * limit + 1, totalCount)} to{' '}
          {Math.min(page * limit, totalCount)} of {totalCount} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 border border-gray-300 rounded bg-gray-100">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
