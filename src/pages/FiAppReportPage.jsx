import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { fetchUserName, fetchReports } from '../lib/fiAppData'

export default function FiAppReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        setUserName(await fetchUserName(id) || 'User')
        const { data, error } = await fetchReports(id)
        setReports(data || [])
        setFetchError(error || null)
      } catch (err) {
        setFetchError(err?.message || 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/fi-app')}
          className="p-2 hover:bg-dark-card rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Reports - {userName}</h1>
          <p className="text-dark-muted">Generated health reports</p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-amber-400 text-sm">
          Database: {fetchError}
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-lg flex flex-col items-center justify-center h-64 text-dark-muted px-6 text-center">
            <p className="font-medium">No reports found</p>
            <p className="text-sm mt-2 opacity-80">
              The app checks <code className="bg-dark-bg px-1 rounded">reports</code> and <code className="bg-dark-bg px-1 rounded">user_reports</code> tables. Add report data in your Fi App database to see them here.
            </p>
          </div>
        ) : (
          reports.map((report) => {
            const reportId = report.id || report.report_id || JSON.stringify(report).slice(0, 50)
            const title = report.title || report.report_type || report.name || 'Report'
            const date = report.created_at || report.report_date || report.date || report.generated_at
            const desc = report.description || report.summary || report.overview
            const type = report.type || report.report_type || report.category
            return (
              <div
                key={reportId}
                className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-accent-purple/50 transition cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-4">
                  <FileText className="w-8 h-8 text-accent-purple flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {date && (
                      <p className="text-dark-muted text-sm mt-1">
                        {new Date(date).toLocaleDateString()}
                      </p>
                    )}
                    {desc && (
                      <p className="text-white text-sm mt-2 line-clamp-2">{desc}</p>
                    )}
                  </div>
                  {type && (
                    <span className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-xs font-semibold whitespace-nowrap">
                      {type}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedReport.title || selectedReport.report_type || selectedReport.name || 'Report'}
                </h2>
                {(selectedReport.created_at || selectedReport.report_date || selectedReport.date) && (
                  <p className="text-dark-muted text-sm mt-1">
                    {new Date(selectedReport.created_at || selectedReport.report_date || selectedReport.date).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-dark-muted hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {(selectedReport.description || selectedReport.summary || selectedReport.overview) && (
              <div className="mt-4 p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-2">Description</p>
                <p className="text-white whitespace-pre-wrap">
                  {selectedReport.description || selectedReport.summary || selectedReport.overview}
                </p>
              </div>
            )}

            {(selectedReport.content || selectedReport.body || selectedReport.details || selectedReport.report_data) && (
              <div className="mt-4 p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-2">Report Details</p>
                <p className="text-white whitespace-pre-wrap">
                  {typeof (selectedReport.content || selectedReport.body || selectedReport.details) === 'object'
                    ? JSON.stringify(selectedReport.content || selectedReport.body || selectedReport.details, null, 2)
                    : (selectedReport.content || selectedReport.body || selectedReport.details || selectedReport.report_data)}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 rounded-lg transition font-medium"
              >
                Print
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 rounded-lg transition font-medium text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
