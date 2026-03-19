import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchUserName, fetchSleepLogs } from '../lib/fiAppData'

export default function FiAppSleepPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [sleepLogs, setSleepLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [filter, setFilter] = useState('today')
  const [stats, setStats] = useState({ totalHours: '0', averageHours: '0' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const name = await fetchUserName(id)
        setUserName(name || 'User')
        const { data, error } = await fetchSleepLogs(id, filter)
        setSleepLogs(data || [])
        setFetchError(error || null)
        const totalHours = (data || []).reduce((sum, log) => sum + (log.sleep_hours || log.hours || 0), 0)
        const days = filter === 'today' ? 1 : filter === 'weekly' ? 7 : 30
        setStats({
          totalHours: totalHours.toFixed(1),
          averageHours: (totalHours / days).toFixed(1),
        })
      } catch (err) {
        setFetchError(err?.message || 'Failed to load sleep logs')
        setSleepLogs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, filter])

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/fi-app')}
          className="p-2 hover:bg-dark-card rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Sleep Report - {userName}</h1>
          <p className="text-dark-muted">Sleep tracking and analysis</p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-amber-400 text-sm">
          <strong>Could not load data:</strong> {fetchError}
          <p className="mt-2 text-xs opacity-80">
            Check that tables <code className="bg-dark-bg px-1 rounded">daily_logs</code> or <code className="bg-dark-bg px-1 rounded">sleep_logs</code> exist with <code className="bg-dark-bg px-1 rounded">sleep_hours</code> / <code className="bg-dark-bg px-1 rounded">date_key</code> columns.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-6 bg-dark-card border border-dark-border rounded-lg p-2">
        {['today', 'weekly', 'monthly'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === filterType
                ? 'bg-accent-purple/20 text-accent-purpleLight'
                : 'text-dark-muted hover:text-white'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-dark-muted text-sm uppercase">Total Sleep Hours</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{stats.totalHours}h</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-dark-muted text-sm uppercase">Average Sleep Hours</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{stats.averageHours}h/day</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-dark-muted text-sm uppercase">Total Logs</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{sleepLogs.length}</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : sleepLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-dark-muted gap-2">
            <span>No sleep logs found</span>
            {!fetchError && (
              <span className="text-xs">The database may be empty, or tables use different names.</span>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Sleep Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Quality</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sleepLogs.map((log) => (
                  <tr key={log.id} className="border-b border-dark-border hover:bg-dark-bg/50">
                    <td className="px-6 py-4 text-sm text-dark-muted">
                      {log.date_key || new Date(log.created_at || log.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-accent-purple">
                      {log.sleep_hours ?? log.hours ?? 0}h
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{log.sleep_quality || '-'}</td>
                    <td className="px-6 py-4 text-sm text-white">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
