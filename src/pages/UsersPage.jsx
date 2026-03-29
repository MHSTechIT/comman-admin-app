import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateRiskScore } from '../utils/riskScoring'
import RiskBadge from '../components/RiskBadge'
import HomeTestModal from '../components/HomeTestModal'
import ExpertCallModal from '../components/ExpertCallModal'
import UserDetailModal from '../components/UserDetailModal'

const PAGE_SIZE = 20
const REFRESH_INTERVAL_MS = 30_000

const RISK_ORDER = { LOW: 0, LOW_MODERATE: 1, MODERATE: 2, MODERATE_HIGH: 3, HIGH: 4 }

export default function UsersPage() {
  const [profiles, setProfiles] = useState([])
  const [bookingsByProfileId, setBookingsByProfileId] = useState({})
  const [callsByProfileId, setCallsByProfileId] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [homeTestModal, setHomeTestModal] = useState(null)
  const [expertCallModal, setExpertCallModal] = useState(null)
  const [detailProfile, setDetailProfile] = useState(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterOnlyScheduled, setFilterOnlyScheduled] = useState(false)
  const [filterOnlyHomeTest, setFilterOnlyHomeTest] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const [profRes, bookRes, callRes] = await Promise.all([
        supabase.from('user_profiles').select('*').not('name', 'is', null).order('created_at', { ascending: false }),
        supabase.from('home_test_bookings').select('*'),
        supabase.from('expert_call_bookings').select('*'),
      ])
      if (profRes.error) throw profRes.error
      if (bookRes.error) throw bookRes.error
      setProfiles(profRes.data || [])
      const map = {}
      for (const b of bookRes.data || []) {
        if (b.profile_id) map[b.profile_id] = b
      }
      setBookingsByProfileId(map)
      const callMap = {}
      for (const c of callRes.data || []) {
        if (c.profile_id) callMap[c.profile_id] = c
      }
      setCallsByProfileId(callMap)
    } catch (e) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const id = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  const rows = useMemo(() => {
    let list = profiles.map((p) => {
      const { score, level } = calculateRiskScore(p)
      return { ...p, score, risk_level: level }
    })
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    }
    if (dateFrom || dateTo) {
      const toLocalYmd = (d) => {
        if (!d) return ''
        const x = new Date(d)
        const y = x.getFullYear()
        const m = String(x.getMonth() + 1).padStart(2, '0')
        const day = String(x.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      list = list.filter((p) => {
        const recDate = toLocalYmd(p.created_at)
        if (!recDate) return false
        if (dateFrom && recDate < dateFrom) return false
        if (dateTo && recDate > dateTo) return false
        return true
      })
    }
    if (filterAge !== '') {
      const age = Number(filterAge)
      if (!isNaN(age)) list = list.filter((p) => Number(p.age) === age)
    }
    if (filterLocation.trim()) {
      const loc = filterLocation.trim().toLowerCase()
      list = list.filter((p) => (p.location || '').toLowerCase().includes(loc))
    }
    if (filterOnlyScheduled) {
      list = list.filter((p) => !!callsByProfileId[p.id])
    }
    if (filterOnlyHomeTest) {
      list = list.filter((p) => !!bookingsByProfileId[p.id])
    }
    list.sort((a, b) => {
      if (sortBy === 'name') {
        const na = (a.name || '').toLowerCase()
        const nb = (b.name || '').toLowerCase()
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      }
      if (sortBy === 'score') {
        return sortDir === 'asc' ? a.score - b.score : b.score - a.score
      }
      if (sortBy === 'risk_level') {
        const oa = RISK_ORDER[a.risk_level] ?? -1
        const ob = RISK_ORDER[b.risk_level] ?? -1
        return sortDir === 'asc' ? oa - ob : ob - oa
      }
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return sortDir === 'asc' ? da - db : db - da
    })
    return list
  }, [profiles, search, sortBy, sortDir, dateFrom, dateTo, filterAge, filterLocation, filterOnlyScheduled, filterOnlyHomeTest, callsByProfileId, bookingsByProfileId])

  const totalCount = rows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginatedRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  const hasDateFilter = !!(dateFrom || dateTo)
  const hasActiveFilter = !!(dateFrom || dateTo || filterAge || filterLocation || filterOnlyScheduled || filterOnlyHomeTest)

  const rowsAll = useMemo(() => {
    let list = profiles.map((p) => {
      const { score, level } = calculateRiskScore(p)
      return { ...p, score, risk_level: level }
    })
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'name') {
        const na = (a.name || '').toLowerCase()
        const nb = (b.name || '').toLowerCase()
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      }
      if (sortBy === 'score') return sortDir === 'asc' ? a.score - b.score : b.score - a.score
      if (sortBy === 'risk_level') {
        const oa = RISK_ORDER[a.risk_level] ?? -1
        const ob = RISK_ORDER[b.risk_level] ?? -1
        return sortDir === 'asc' ? oa - ob : ob - oa
      }
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return sortDir === 'asc' ? da - db : db - da
    })
    return list
  }, [profiles, search, sortBy, sortDir])

  const handleExportClick = () => setExportModalOpen(true)

  const handleExportFiltered = () => {
    setExportModalOpen(false)
    doExportCsv(rows)
  }

  const handleExportAll = () => {
    setExportModalOpen(false)
    doExportCsv(rowsAll)
  }

  const doExportCsv = (data) => {
    const headers = ['#', 'Name', 'Phone', 'Age', 'Location', 'Risk Level', 'Score', 'Home Test', 'Created At']
    const lines = [headers.join(',')]
    data.forEach((row, i) => {
      const booking = bookingsByProfileId[row.id]
      const homeTest = booking ? 'Yes' : 'No'
      const created = row.created_at ? new Date(row.created_at).toISOString() : ''
      lines.push(
        [
          i + 1,
          `"${(row.name || '').replace(/"/g, '""')}"`,
          `"${(row.phone || '').replace(/"/g, '""')}"`,
          row.age ?? '',
          `"${(row.location || '').replace(/"/g, '""')}"`,
          row.risk_level,
          row.score,
          homeTest,
          created,
        ].join(',')
      )
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diabetes-risk-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRowClick = (row, target) => {
    if (target.closest('.stop-row-click')) return
    setDetailProfile(row)
  }

  if (loading && profiles.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-dark-muted">Loading users…</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Users</h2>
          <p className="text-dark-muted text-sm mt-0.5">
            Total: <span className="text-white font-medium">{totalCount}</span> users
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`px-4 py-2 rounded-lg border text-gray-200 flex items-center gap-2 transition ${
              hasActiveFilter
                ? 'bg-accent-purple/20 border-accent-purple/50'
                : 'bg-dark-card border-dark-border hover:bg-white/5'
            }`}
          >
            🔍 Filter {hasActiveFilter && '●'}
          </button>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="px-3 py-2 rounded-lg bg-dark-card border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple w-56"
          />
          <button
            type="button"
            onClick={handleExportClick}
            className="px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-gray-200 hover:bg-white/5"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border bg-white/[0.02]">
                <Th>#</Th>
                <Th onClick={() => handleSort('name')} sort={sortBy === 'name'} dir={sortDir}>Name</Th>
                <Th onClick={() => {}}>Phone</Th>
                <Th onClick={() => {}}>Age</Th>
                <Th onClick={() => {}}>Location</Th>
                <Th onClick={() => handleSort('risk_level')} sort={sortBy === 'risk_level'} dir={sortDir}>Risk Level</Th>
                <Th onClick={() => handleSort('score')} sort={sortBy === 'score'} dir={sortDir}>Score</Th>
                <Th onClick={() => {}}>Home Test</Th>
                <Th onClick={() => {}}>Schedule Date</Th>
                <Th onClick={() => {}}>Schedule Time</Th>
                <Th onClick={() => handleSort('created_at')} sort={sortBy === 'created_at'} dir={sortDir}>Date</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, idx) => {
                const booking = bookingsByProfileId[row.id]
                const sn = currentPage * PAGE_SIZE + idx + 1
                return (
                  <tr
                    key={row.id}
                    onClick={(e) => handleRowClick(row, e.target)}
                    className="border-b border-dark-border/80 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <Td>{sn}</Td>
                    <Td>{row.name || '—'}</Td>
                    <Td>{row.phone || '—'}</Td>
                    <Td>{row.age ?? '—'}</Td>
                    <Td>{row.location || '—'}</Td>
                    <Td><RiskBadge level={row.risk_level} /></Td>
                    <Td>{row.score}/100</Td>
                    <Td className="stop-row-click">
                      {booking ? (
                        <button
                          type="button"
                          onClick={() => setHomeTestModal(booking)}
                          className="text-emerald-400 hover:underline"
                        >
                          Yes
                        </button>
                      ) : (
                        <span className="text-dark-muted">No</span>
                      )}
                    </Td>
                    <Td className="text-dark-muted">
                      {callsByProfileId[row.id]?.call_date
                        ? new Date(callsByProfileId[row.id].call_date).toLocaleDateString()
                        : '—'}
                    </Td>
                    <Td className="text-dark-muted">
                      {callsByProfileId[row.id]?.time_slot || '—'}
                    </Td>
                    <Td className="text-dark-muted">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {paginatedRows.length === 0 && (
          <div className="py-12 text-center text-dark-muted">No users found.</div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
            <span className="text-dark-muted text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded border border-dark-border text-sm disabled:opacity-50 hover:bg-white/5"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded border border-dark-border text-sm disabled:opacity-50 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {homeTestModal && (
        <HomeTestModal booking={homeTestModal} onClose={() => setHomeTestModal(null)} />
      )}
      {expertCallModal && (
        <ExpertCallModal booking={expertCallModal} onClose={() => setExpertCallModal(null)} />
      )}
      {detailProfile && (
        <UserDetailModal profile={detailProfile} onClose={() => setDetailProfile(null)} />
      )}

      {filterModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Filter</h3>
            <div className="space-y-4">
              {/* Date range */}
              <div>
                <label className="block text-sm text-dark-muted mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
                />
              </div>
              {/* Age */}
              <div>
                <label className="block text-sm text-dark-muted mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 35"
                  value={filterAge}
                  onChange={(e) => setFilterAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
                />
              </div>
              {/* Location */}
              <div>
                <label className="block text-sm text-dark-muted mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Chennai"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple"
                />
              </div>
              {/* Checkboxes */}
              <div className="pt-1 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filterOnlyScheduled}
                    onChange={(e) => setFilterOnlyScheduled(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-200 group-hover:text-white transition">Only Scheduled Calls</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filterOnlyHomeTest}
                    onChange={(e) => setFilterOnlyHomeTest(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-200 group-hover:text-white transition">Only Home Test</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setFilterModalOpen(false); setPage(0) }}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom(''); setDateTo('')
                  setFilterAge(''); setFilterLocation('')
                  setFilterOnlyScheduled(false); setFilterOnlyHomeTest(false)
                  setPage(0)
                }}
                className="w-full mt-3 px-4 py-2 text-sm text-dark-muted hover:text-white transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Export CSV</h3>
            <p className="text-dark-muted text-sm mb-4">
              {hasDateFilter
                ? `You have a date filter active. Export filtered leads (${rows.length}) or all leads (${rowsAll.length})?`
                : `Export all ${rows.length} leads?`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExportFiltered}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition"
              >
                {hasDateFilter ? `Export Filtered (${rows.length})` : 'Export All'}
              </button>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition"
                >
                  Export All ({rowsAll.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-dark-muted hover:text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, onClick, sort, dir }) {
  const isSortable = !!onClick
  return (
    <th
      className="text-left py-3 px-4 text-dark-muted font-medium whitespace-nowrap"
      onClick={isSortable ? onClick : undefined}
    >
      <span className={isSortable ? 'cursor-pointer hover:text-white flex items-center gap-1' : ''}>
        {children}
        {sort && (dir === 'asc' ? ' ↑' : ' ↓')}
      </span>
    </th>
  )
}

function Td({ children, className }) {
  return <td className={`py-3 px-4 ${className || ''}`}>{children}</td>
}
