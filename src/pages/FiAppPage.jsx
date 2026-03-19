import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseFiApp } from '../lib/supabaseClientFiApp'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FiAppPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchUsers()
  }, [search, page])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const tablesToTry = ['profiles_public', 'profiles']
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let data = []
      let count = 0
      let lastError = null

      for (const tableName of tablesToTry) {
        let q = supabaseFiApp.from(tableName).select('*', { count: 'exact' })
        if (search.trim()) {
          q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        }
        const res = await q.order('created_at', { ascending: false }).range(from, to)
        if (res.error) {
          const fallback = await supabaseFiApp.from(tableName).select('*', { count: 'exact' }).range(from, to)
          if (!fallback.error) {
            data = fallback.data || []
            count = fallback.count ?? data.length
            lastError = null
            break
          }
          lastError = res.error
          continue
        }
        data = res.data || []
        count = res.count ?? data.length
        lastError = null
        break
      }

      if (lastError) throw lastError

      setUsers(data)
      setTotalPages(Math.max(1, Math.ceil((count || 0) / pageSize)))
    } catch (err) {
      setUsers([])
      setTotalPages(1)
      setError(err?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = (userId, cellType) => {
    const paths = {
      name: `/fi-app/${userId}`,
      food: `/fi-app/${userId}/food`,
      drink: `/fi-app/${userId}/drink`,
      sleep: `/fi-app/${userId}/sleep`,
      course: `/fi-app/${userId}/course`,
    }
    navigate(paths[cellType] || `/fi-app/${userId}`)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Fi App - Users Sheet</h2>
        <p className="text-dark-muted">Click any cell to view detailed information</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-dark-card rounded-lg border border-dark-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-dark-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:border-accent-purple"
          />
        </div>
      </div>

      {/* Sheet Table */}
      <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <p className="text-dark-muted mb-2">No users found</p>
            <p className="text-dark-muted/80 text-sm max-w-md">
              If you expect data here, check in Supabase: (1) Tables <code className="text-accent-purple">profiles</code> or <code className="text-accent-purple">profiles_public</code> have rows, and (2) Row Level Security allows <code className="text-accent-purple">SELECT</code> for the anon role.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Food</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Drink</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Sleep</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userId = user.id || user.user_id
                    return (
                    <tr key={userId} className="border-b border-dark-border hover:bg-dark-bg/50 transition">
                      {/* Name */}
                      <td
                        onClick={() => handleCellClick(userId, 'name')}
                        className="px-6 py-4 text-sm font-medium text-accent-purple cursor-pointer hover:text-accent-purpleLight hover:underline transition"
                      >
                        {user.name || '-'}
                      </td>

                      {/* Food */}
                      <td
                        onClick={() => handleCellClick(userId, 'food')}
                        className="px-6 py-4 text-sm text-accent-purple cursor-pointer hover:text-accent-purpleLight hover:underline transition"
                      >
                        View Food
                      </td>

                      {/* Drink */}
                      <td
                        onClick={() => handleCellClick(userId, 'drink')}
                        className="px-6 py-4 text-sm text-accent-purple cursor-pointer hover:text-accent-purpleLight hover:underline transition"
                      >
                        View Drink
                      </td>

                      {/* Sleep */}
                      <td
                        onClick={() => handleCellClick(userId, 'sleep')}
                        className="px-6 py-4 text-sm text-accent-purple cursor-pointer hover:text-accent-purpleLight hover:underline transition"
                      >
                        View Sleep
                      </td>

                      {/* Course */}
                      <td
                        onClick={() => handleCellClick(userId, 'course')}
                        className="px-6 py-4 text-sm text-accent-purple cursor-pointer hover:text-accent-purpleLight hover:underline transition"
                      >
                        View Course
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-dark-bg border-t border-dark-border px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-dark-muted">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-3 py-2 border border-dark-border rounded-lg disabled:opacity-50 hover:bg-dark-card/50 transition text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-3 py-2 border border-dark-border rounded-lg disabled:opacity-50 hover:bg-dark-card/50 transition text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
