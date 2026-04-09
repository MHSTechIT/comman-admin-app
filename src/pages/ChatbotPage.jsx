import { useState, useEffect, useMemo } from 'react'

const API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8003'

const toLocalYmd = (d) => {
  if (!d) return ''
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export default function ChatbotPage() {
  const [leads, setLeads] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

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

  useEffect(() => {
    fetchLeads()
  }, [])

  const hasDateFilter = !!(dateFrom || dateTo)

  const filteredLeads = useMemo(() => {
    if (!dateFrom && !dateTo) return leads
    return leads.filter((l) => {
      const recDate = toLocalYmd(l.created_at)
      if (!recDate) return false
      if (dateFrom && recDate < dateFrom) return false
      if (dateTo && recDate > dateTo) return false
      return true
    })
  }, [leads, dateFrom, dateTo])

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
    a.download = `enrollment-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Chatbot Leads</h1>
        <p className="text-dark-muted">Enrollment leads submitted via the chatbot</p>
      </div>

      <div className="bg-dark-card rounded-xl p-6 border border-dark-border overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">
            Enrollment Leads ({hasDateFilter ? `${filteredLeads.length} of ${leads.length}` : leads.length})
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
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={`px-4 py-2 rounded-lg border text-gray-200 flex items-center gap-2 transition ${
                hasDateFilter
                  ? 'bg-accent-purple/20 border-accent-purple/50'
                  : 'bg-dark-bg border-dark-border hover:bg-white/5'
              }`}
            >
              🔍 Filter {hasDateFilter && '●'}
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={leads.length === 0}
              className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
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
          <p className="text-dark-muted text-center py-12">No leads match the current date filter</p>
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
            <h3 className="text-lg font-semibold text-white mb-4">Filter by Date</h3>
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
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition">
                OK
              </button>
              <button onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition">
                Cancel
              </button>
            </div>
            {hasDateFilter && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }}
                className="w-full mt-3 px-4 py-2 text-sm text-dark-muted hover:text-white transition">
                Clear filter
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
              {hasDateFilter
                ? `Export filtered leads (${filteredLeads.length}) or all leads (${leads.length})?`
                : `Export all ${leads.length} leads?`}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setExportModalOpen(false); doExportLeads(filteredLeads) }}
                className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition">
                {hasDateFilter ? `Export Filtered (${filteredLeads.length})` : 'Export All'}
              </button>
              {hasDateFilter && (
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
