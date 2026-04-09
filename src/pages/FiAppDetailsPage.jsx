import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fiAppApiUrl } from '../lib/supabaseClientFiApp'
import { ArrowLeft, Utensils, Droplet } from 'lucide-react'

export default function FiAppDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [foodLogs, setFoodLogs] = useState([])
  const [dailyLogs, setDailyLogs] = useState([])

  useEffect(() => {
    fetchUserDetails()
  }, [id])

  useEffect(() => {
    if (activeTab === 'food') fetchFoodLogs()
    if (activeTab === 'daily') fetchDailyLogs()
  }, [activeTab])

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/profile`)
      if (res.ok) {
        const json = await res.json()
        setUser(json.data && Object.keys(json.data).length ? json.data : { name: json.name || 'User' })
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchFoodLogs = async () => {
    try {
      const res = await fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/food-logs`)
      if (res.ok) {
        const json = await res.json()
        setFoodLogs(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching food logs:', err)
    }
  }

  const fetchDailyLogs = async () => {
    try {
      const res = await fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/daily-logs`)
      if (res.ok) {
        const json = await res.json()
        setDailyLogs(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching daily logs:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-dark-muted">User not found</p>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-white">{user.name}</h1>
          <p className="text-dark-muted">{user.email}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-dark-card border border-dark-border rounded-lg p-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'profile'
              ? 'bg-accent-purple/20 text-accent-purpleLight'
              : 'text-dark-muted hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'food'
              ? 'bg-accent-purple/20 text-accent-purpleLight'
              : 'text-dark-muted hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Food
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'daily'
              ? 'bg-accent-purple/20 text-accent-purpleLight'
              : 'text-dark-muted hover:text-white'
          }`}
        >
          <Droplet className="w-4 h-4" />
          Daily (Water & Sleep)
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Email</p>
                <p className="text-white font-medium">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Phone</p>
                <p className="text-white font-medium">{user.phone || user.phone_number || user.mobile || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Age</p>
                <p className="text-white font-medium">{user.age || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Gender</p>
                <p className="text-white font-medium">{user.gender || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Height</p>
                <p className="text-white font-medium">
                  {(user.height || user.height_cm) ? `${user.height || user.height_cm} cm` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Weight</p>
                <p className="text-white font-medium">
                  {(user.weight || user.weight_kg) ? `${user.weight || user.weight_kg} kg` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                    (user.status || user.user_status || user.admin_status) === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {user.status || user.user_status || user.admin_status || 'unknown'}
                </span>
              </div>
              <div>
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-1">Role</p>
                <span className="px-3 py-1 rounded-full text-xs font-semibold inline-block bg-accent-purple/20 text-accent-purpleLight">
                  {user.role || 'user'}
                </span>
              </div>
            </div>
            {user.conditions && user.conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-dark-muted uppercase tracking-wide mb-3">Health Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {user.conditions.map((condition, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Food Tab */}
      {activeTab === 'food' && (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          {foodLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-dark-muted">
              No food logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Calories</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {foodLogs.map((log) => (
                    <tr key={log.id} className="border-b border-dark-border hover:bg-dark-bg/50">
                      <td className="px-6 py-4 text-sm text-dark-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{log.description || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{Number(log.calories || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-dark-muted">
                        {log.food_log_images?.length || 0} images
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Daily Logs Tab */}
      {activeTab === 'daily' && (
        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          {dailyLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-dark-muted">
              No daily logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Water Intake (ml)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Sleep Hours</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map((log) => (
                    <tr key={log.id} className="border-b border-dark-border hover:bg-dark-bg/50">
                      <td className="px-6 py-4 text-sm text-dark-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{log.water_intake || 0}</td>
                      <td className="px-6 py-4 text-sm text-white">{log.sleep_hours || '-'}</td>
                      <td className="px-6 py-4 text-sm text-dark-muted">{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
