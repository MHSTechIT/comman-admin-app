import { useState, useEffect, useMemo } from 'react'
import GcpCreditsWidget from '../components/GcpCreditsWidget'
import ElevenLabsWidget from '../components/ElevenLabsWidget'

const API_URL = (import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8003').trim()

const toLocalYmd = (d) => {
  if (!d) return ''
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export default function ChatbotPage() {
  const [leads, setLeads] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterBloodSugar, setFilterBloodSugar] = useState('')

  const fetchLeads = async () => {
    setDataLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/leads`)
      if (res.ok) {
        const json = await res.json()
        setLeads(
          (json.leads || []).map((e) => ({
            id: String(e.id),
            name: e.name,
            phone: e.phone,
            age: e.age ?? '',
            location: e.location || '',
            sugar_level: e.sugar_level || '',
            created_at: e.created_at,
          }))
        )
      } else {
        setLeads([])
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
      setLeads([])
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

  const hasActiveFilter = !!(dateFrom || dateTo || filterAge || filterLocation || filterBloodSugar)

  const filteredLeads = useMemo(() => {
    let list = leads
    if (dateFrom || dateTo) {
      list = list.filter((l) => {
        const d = toLocalYmd(l.created_at)
        if (!d) return false
        if (dateFrom && d < dateFrom) return false
        if (dateTo && d > dateTo) return false
        return true
      })
    }
    if (filterAge !== '') {
      const age = Number(filterAge)
      if (!isNaN(age)) list = list.filter((l) => Number(l.age) === age)
    }
    if (filterLocation.trim()) {
      const loc = filterLocation.trim().toLowerCase()
      list = list.filter((l) => (l.location || '').toLowerCase().includes(loc))
    }
    if (filterBloodSugar.trim()) {
      const bs = filterBloodSugar.trim().toLowerCase()
      list = list.filter((l) => (l.sugar_level || '').toLowerCase().includes(bs))
    }
    return list
  }, [leads, dateFrom, dateTo, filterAge, filterLocation, filterBloodSugar])

  const clearFilters = () => {
    setDateFrom(''); setDateTo('')
    setFilterAge(''); setFilterLocation(''); setFilterBloodSugar('')
  }

  const doExportLeads = (data) => {
    if (data.length === 0) { alert('No leads to export'); return }
    const headers = ['Name', 'Phone', 'Age', 'Location', 'Blood Sugar', 'Date']
    const rows = data.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.age ?? '')}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      `"${(l.sugar_level ?? '').toString().replace(/"/g, '""')}"`,
      `"${l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Chatbot Leads</h1>
          <p className="text-dark-muted">Enrollment leads submitted via the chatbot</p>
        </div>
        <div className="flex items-center gap-2">
          <GcpCreditsWidget />
          <ElevenLabsWidget />
        </div>
      </div>

      {/* Leads table */}
      <div className="bg-dark-card rounded-xl p-6 border border-dark-border overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">
            Enrollment Leads ({hasActiveFilter ? `${filteredLeads.length} of ${leads.length}` : leads.length})
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={dataLoading}
              className="px-4 py-2 bg-dark-bg border border-dark-border hover:bg-white/5 text-dark-muted hover:text-white rounded-lg text-sm transition"
            >
              {dataLoading ? '↻ Loading…' : '↻ Refresh'}
            </button>
            <button
              onClick={() => setFilterModalOpen(true)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm transition ${
                hasActiveFilter
                  ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purpleLight'
                  : 'bg-dark-bg border-dark-border text-gray-200 hover:bg-white/5'
              }`}
            >
              🔍 Filter {hasActiveFilter && '●'}
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={filteredLeads.length === 0}
              className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-dark-muted text-center py-12">No enrollment leads yet</p>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted">No leads match the current filters</p>
            <button onClick={clearFilters} className="mt-3 text-xs text-accent-purpleLight hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 font-semibold text-white">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Age</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Blood Sugar</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-dark-border hover:bg-dark-bg/50 transition">
                    <td className="py-3 px-4 text-white">{lead.name}</td>
                    <td className="py-3 px-4 text-white">{lead.phone}</td>
                    <td className="py-3 px-4 text-white">{lead.age || '—'}</td>
                    <td className="py-3 px-4 text-white">{lead.location || '—'}</td>
                    <td className="py-3 px-4 text-white">{lead.sugar_level || '—'}</td>
                    <td className="py-3 px-4 text-dark-muted">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setFilterModalOpen(false)}>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Filter Leads</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-1">From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple" />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">To Date</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple" />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Age (exact)</label>
                <input type="number" value={filterAge} onChange={(e) => setFilterAge(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple" />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Location (contains)</label>
                <input type="text" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple" />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Blood Sugar (contains)</label>
                <input type="text" value={filterBloodSugar} onChange={(e) => setFilterBloodSugar(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-dark-muted focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition">
                Apply
              </button>
              <button onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition">
                Close
              </button>
            </div>
            {hasActiveFilter && (
              <button onClick={() => { clearFilters(); setFilterModalOpen(false) }}
                className="w-full mt-3 px-4 py-2 text-sm text-dark-muted hover:text-white transition">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setExportModalOpen(false)}>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Export CSV</h3>
            <p className="text-dark-muted text-sm mb-4">
              {hasActiveFilter
                ? `Export filtered leads (${filteredLeads.length}) or all leads (${leads.length})?`
                : `Export all ${leads.length} leads?`}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setExportModalOpen(false); doExportLeads(filteredLeads) }}
                className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition">
                {hasActiveFilter ? `Export Filtered (${filteredLeads.length})` : 'Export All'}
              </button>
              {hasActiveFilter && (
                <button onClick={() => { setExportModalOpen(false); doExportLeads(leads) }}
                  className="px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition">
                  Export All ({leads.length})
                </button>
              )}
              <button onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-dark-muted hover:text-white rounded-lg font-medium transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
