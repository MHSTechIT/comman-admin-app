import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { ImageGalleryModal } from '../components/ImageGalleryModal'

export function FoodPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly'>('today')
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string }[]>([])
  const [galleryOpen, setGalleryOpen] = useState(false)

  const { data: user } = useUser(userId)
  const { data: foodLogs = [], isLoading } = useFoodLogs({ userId, period })

  const totalCalories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0)

  const handleImageClick = () => {
    // In a real app, fetch images from Supabase Storage
    setSelectedImages([
      { id: '1', url: 'https://via.placeholder.com/400' },
      { id: '2', url: 'https://via.placeholder.com/400' },
    ])
    setGalleryOpen(true)
  }

  return (
    <div>
      <button
        onClick={() => navigate(`/users/${userId}`)}
        className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        ← Back to User
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.name} - Food Logs</h1>

      <DateRangeFilter period={period} onPeriodChange={setPeriod} />

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Total Calories</p>
            <p className="text-2xl font-bold">{totalCalories}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Meals</p>
            <p className="text-2xl font-bold">{foodLogs.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Average</p>
            <p className="text-2xl font-bold">
              {foodLogs.length > 0 ? Math.round(totalCalories / foodLogs.length) : 0}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Period</p>
            <p className="text-2xl font-bold capitalize">{period}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Description
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Calories
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Images
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : foodLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No food logs found for this period
                </td>
              </tr>
            ) : (
              foodLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{log.description}</td>
                  <td className="px-6 py-4 text-sm font-medium">{log.calories} kcal</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={handleImageClick}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Images
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ImageGalleryModal
        images={selectedImages}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  )
}
