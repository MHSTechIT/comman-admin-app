import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchUserName, fetchDrinkLogs } from '../lib/fiAppData'

export default function FiAppDrinkPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [drinkLogs, setDrinkLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [filter, setFilter] = useState('today')
  const [stats, setStats] = useState({ total: 0, average: '0' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const name = await fetchUserName(id)
        setUserName(name || 'User')
        const { data, error } = await fetchDrinkLogs(id, filter)
        setDrinkLogs(data || [])
        setFetchError(error || null)
        const total = (data || []).length
        const days = filter === 'today' ? 1 : filter === 'weekly' ? 7 : 30
        setStats({ total, average: (total / days).toFixed(1) })
      } catch (err) {
        setFetchError(err?.message || 'Failed to load drink logs')
        setDrinkLogs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, filter])

  const getTotalWater = () => {
    return drinkLogs.reduce((sum, log) => sum + (log.water_ml || log.water_intake || log.amount_ml || 0), 0)
  }

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
          <h1 className="text-3xl font-bold text-white">Drinking Report - {userName}</h1>
          <p className="text-dark-muted">Water intake tracking</p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-amber-400 text-sm">
          <strong>Could not load data:</strong> {fetchError}
          <p className="mt-2 text-xs opacity-80">
            Check that tables <code className="bg-dark-bg px-1 rounded">daily_logs</code>, <code className="bg-dark-bg px-1 rounded">water_logs</code>, or <code className="bg-dark-bg px-1 rounded">drink_logs</code> exist in your Fi App database and RLS allows reads.
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
          <p className="text-dark-muted text-sm uppercase">Total Water Intake</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{getTotalWater()} ml</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-dark-muted text-sm uppercase">Total Logs</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{stats.total}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <p className="text-dark-muted text-sm uppercase">Daily Average</p>
          <p className="text-3xl font-bold text-accent-purple mt-2">{stats.average} logs/day</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : drinkLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-dark-muted gap-2">
            <span>No drink logs found</span>
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Water (ml)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Notes</th>
                </tr>
              </thead>
              <tbody>
                {drinkLogs.map((log) => (
                  <tr key={log.id} className="border-b border-dark-border hover:bg-dark-bg/50">
                    <td className="px-6 py-4 text-sm text-dark-muted">
                      {new Date(log.date_key || log.created_at || log.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-accent-purple">
                      {log.water_ml || log.water_intake || log.amount_ml || 0}
                    </td>
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
