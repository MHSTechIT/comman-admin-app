import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseChatbot } from '../lib/supabaseClientChatbot'

const API_BASE = (import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8003').replace(/\/+$/, '')

const toLocalYmd = (d) => {
  if (!d) return ''
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export default function ChatbotPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const { data: leadsData, error: leadsError } = await supabaseChatbot
        .from('enrollments')
        .select('id, name, phone, sugar_level, created_at')
        .order('created_at', { ascending: false })
        .limit(500)

      if (leadsError) {
        console.warn('Chatbot leads error:', leadsError)
        setLeads([])
      } else {
        setLeads(
          (leadsData || []).map((e) => ({
            id: String(e.id),
            name: e.name,
            phone: e.phone,
            sugar_level: e.sugar_level || '',
            created_at: e.created_at,
          }))
        )
      }

      try {
        const docRes = await fetch(`${API_BASE}/admin/documents`)
        if (docRes.ok) {
          const docData = await docRes.json().catch(() => ({}))
          setDocuments(docData.documents || [])
        } else {
          setDocuments([])
        }
      } catch {
        setDocuments([])
      }
    } catch (err) {
      console.error('Error fetching Chatbot data:', err)
      setDocuments([])
      setLeads([])
    } finally {
      setDataLoading(false)
    }
  }

  const fetchDocuments = fetchData
  const fetchLeads = fetchData

  useEffect(() => {
    fetchData()
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

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file || !fileName.trim()) {
      alert('Please select file and enter title')
      return
    }
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', fileName)
    try {
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        alert('✅ Document uploaded successfully')
        setFile(null)
        setFileName('')
        fetchDocuments()
      } else {
        alert('❌ Upload failed')
      }
    } catch (err) {
      alert('Error uploading: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkSubmit = async (e) => {
    e.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim()) {
      alert('Please enter both title and URL')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/add-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: linkTitle, url: linkUrl }),
      })
      if (res.ok) {
        alert('✅ Link added successfully')
        setLinkTitle('')
        setLinkUrl('')
        fetchDocuments()
      } else {
        alert('❌ Failed to add link')
      }
    } catch (err) {
      alert('Error adding link: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const doExportLeads = (data) => {
    if (data.length === 0) {
      alert('No leads to export')
      return
    }
    const headers = ['Name', 'Phone', 'Blood Sugar', 'Date']
    const rows = data.map((l) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
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

  const handleExportClick = () => setExportModalOpen(true)

  const handleExportFiltered = () => {
    setExportModalOpen(false)
    doExportLeads(filteredLeads)
  }

  const handleExportAll = () => {
    setExportModalOpen(false)
    doExportLeads(leads)
  }

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      const res = await fetch(`${API_BASE}/admin/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('✅ Deleted')
        fetchDocuments()
      } else {
        alert('Delete failed')
      }
    } catch (err) {
      alert('Error deleting: ' + err.message)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Chatbot Admin</h1>
        <p className="text-dark-muted">
          Upload documents and links for AI training • View enrollment leads
        </p>
      </div>

      {dataLoading && (
        <p className="mb-4 text-dark-muted text-sm">Loading…</p>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            activeTab === 'upload'
              ? 'bg-accent-purple/20 text-accent-purpleLight'
              : 'text-dark-muted hover:text-white hover:bg-white/5'
          }`}
        >
          📤 Upload
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            activeTab === 'leads'
              ? 'bg-accent-purple/20 text-accent-purpleLight'
              : 'text-dark-muted hover:text-white hover:bg-white/5'
          }`}
        >
          👥 Leads ({hasDateFilter ? `${filteredLeads.length}/${leads.length}` : leads.length})
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <h2 className="text-xl font-bold text-white mb-4">📤 Upload Document</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Document Title</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., Diabetes Management Guide"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Select File (PDF, TXT, DOCX)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.txt,.docx"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-accent-purple file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent-purple/20 file:text-accent-purpleLight"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Uploading...' : '📤 Upload Document'}
              </button>
            </form>
          </div>

          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <h2 className="text-xl font-bold text-white mb-4">🔗 Add Reference Link</h2>
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">Link Title</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g., My Health School"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-muted mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:border-accent-purple"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : '🔗 Add Link'}
              </button>
            </form>
          </div>

          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <h2 className="text-xl font-bold text-white mb-4">📋 Uploaded Resources ({documents.length})</h2>
            {documents.length === 0 ? (
              <p className="text-dark-muted text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-dark-bg p-4 rounded-lg border border-dark-border hover:border-accent-purple/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">{doc.type === 'document' ? '📄' : '🔗'}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent-purpleLight truncate block hover:underline"
                            >
                              {doc.url}
                            </a>
                          )}
                          {doc.file_name && <p className="text-sm text-dark-muted">{doc.file_name}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-dark-muted">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="ml-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition shrink-0"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-dark-card rounded-xl p-6 border border-dark-border overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-white">
              👥 Enrollment Leads ({hasDateFilter ? `${filteredLeads.length} of ${leads.length}` : leads.length})
            </h2>
            <div className="flex items-center gap-3">
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
                onClick={handleExportClick}
                disabled={leads.length === 0}
                className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                📥 Export to CSV
              </button>
            </div>
          </div>
          {leads.length === 0 ? (
            <p className="text-dark-muted text-center py-8">No enrollment leads yet</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-dark-muted text-center py-8">No leads match the current date filter</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left py-3 px-4 font-semibold text-white">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Blood Sugar</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-dark-border hover:bg-dark-bg/50 transition">
                      <td className="py-3 px-4 text-white">{lead.name}</td>
                      <td className="py-3 px-4 text-white">{lead.phone}</td>
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
            <h3 className="text-lg font-semibold text-white mb-4">Filter by Date</h3>
            <div className="space-y-4">
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
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
            {hasDateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="w-full mt-3 px-4 py-2 text-sm text-dark-muted hover:text-white transition"
              >
                Clear filter
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
                ? `You have a date filter active. Export filtered leads (${filteredLeads.length}) or all leads (${leads.length})?`
                : `Export all ${leads.length} leads?`}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportFiltered}
                className="px-4 py-2 bg-accent-purple/20 text-accent-purpleLight hover:bg-accent-purple/30 rounded-lg font-medium transition"
              >
                {hasDateFilter ? `Export Filtered (${filteredLeads.length})` : 'Export All'}
              </button>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-white rounded-lg font-medium transition"
                >
                  Export All ({leads.length})
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
