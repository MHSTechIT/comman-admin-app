import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { fetchFiAppUserName, fetchFoodLogs } from '../lib/fiAppData'

export default function FiAppFoodPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [foodLogs, setFoodLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const name = await fetchFiAppUserName(id)
        setUserName(name || 'User')
        const { data, error } = await fetchFoodLogs(id, filter)
        setFoodLogs(data || [])
        setFetchError(error || null)
      } catch (err) {
        setFetchError(err?.message || 'Failed to load food logs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, filter])

  const getTotalCalories = () => {
    return foodLogs.reduce(
      (sum, log) => sum + (Number(log.energy) || Number(log.calories) || Number(log.calorie) || 0),
      0
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
          <h1 className="text-3xl font-bold text-white">Food Logs - {userName}</h1>
          <p className="text-dark-muted">Food intake history and calorie tracking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 bg-dark-card border border-dark-border rounded-lg p-2">
        {['all', 'today', 'weekly', 'monthly'].map((filterType) => (
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

      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-amber-400 text-sm">
          <strong>Database info:</strong> {fetchError}
          <p className="mt-2 text-dark-muted">Ensure your Fi App Supabase has tables like <code>food_logs</code> or <code>meal_logs</code> with a <code>user_id</code> or <code>profile_id</code> column, and RLS allows reads.</p>
        </div>
      )}

      {/* Total Calories */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
        <p className="text-dark-muted text-sm uppercase">Total Calories ({filter})</p>
        <p className="text-4xl font-bold text-accent-purple mt-2">{getTotalCalories()}</p>
      </div>

      {/* Food Logs */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : foodLogs.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-lg flex items-center justify-center h-64 text-dark-muted">
            No food logs found
          </div>
        ) : (
          foodLogs.map((log) => {
            const name = log.product_name || log.name || log.food_name || log.description || 'Food Item'
            const kcal = Number(log.energy) || Number(log.calories) || Number(log.calorie) || 0
            const ts = log.created_at || log.date_key || log.date
            return (
            <div key={log.id || `${log.date_key}-${log.product_name}`} className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{name}</h3>
                  <p className="text-dark-muted text-sm">
                    {ts ? new Date(ts).toLocaleString() : '-'}
                  </p>
                </div>
                <span className="text-2xl font-bold text-accent-purple">{kcal} kcal</span>
              </div>

              {/* Nutrition Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {(log.proteins ?? log.protein) != null && <div className="bg-dark-bg rounded p-2"><p className="text-dark-muted text-xs">Protein</p><p className="text-white font-semibold">{log.proteins ?? log.protein}g</p></div>}
                {(log.carbohydrates ?? log.carbs ?? log.carbohydrate) != null && <div className="bg-dark-bg rounded p-2"><p className="text-dark-muted text-xs">Carbs</p><p className="text-white font-semibold">{log.carbohydrates ?? log.carbs ?? log.carbohydrate}g</p></div>}
                {(log.fat ?? log.fats) != null && <div className="bg-dark-bg rounded p-2"><p className="text-dark-muted text-xs">Fat</p><p className="text-white font-semibold">{log.fat ?? log.fats}g</p></div>}
                {(log.fiber ?? log.fibre) != null && <div className="bg-dark-bg rounded p-2"><p className="text-dark-muted text-xs">Fiber</p><p className="text-white font-semibold">{log.fiber ?? log.fibre}g</p></div>}
              </div>

              {log.insight && (
                <p className="text-white mb-4 text-sm">{log.insight}</p>
              )}

              {/* Images */}
              {(log.image_url || log.image) && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedImage(log.image_url || log.image)}
                    className="relative group cursor-pointer"
                  >
                    <img
                      src={log.image_url || log.image}
                      alt="Food"
                      className="h-24 w-24 object-cover rounded-lg hover:opacity-80 transition"
                    />
                    <ImageIcon className="absolute top-2 right-2 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                  </button>
                </div>
              )}
            </div>
          )})
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Food Image</h2>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-dark-muted hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <img src={selectedImage} alt="Food" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
