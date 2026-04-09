import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fiAppApiUrl } from '../lib/supabaseClientFiApp'
import { ArrowLeft } from 'lucide-react'

export default function FiAppDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetails()
  }, [id])

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

      {/* Profile */}
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
  )
}
