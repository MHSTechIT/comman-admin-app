import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { useUserCourses } from '../hooks/useCourses'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { useDrinkLogs } from '../hooks/useDrinkLogs'
import { SummaryCards } from '../components/SummaryCards'

export function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(userId)
  const { data: courses = [] } = useUserCourses(userId)
  const { data: foodLogs = [] } = useFoodLogs({ userId, period: 'today' })
  const { data: drinkLogs = [] } = useDrinkLogs({ userId, period: 'today' })

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">User not found</div>
  }

  const totalCalories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0)
  const totalDrinks = drinkLogs.reduce((sum, log) => sum + log.amount, 0)

  const stats = [
    { label: 'Today Calories', value: totalCalories },
    { label: 'Today Drinks', value: totalDrinks },
    { label: 'Courses', value: courses.length },
    { label: 'Status', value: user.status },
    { label: 'Role', value: user.role },
  ]

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        ← Back to Users
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
      <p className="text-gray-600 mb-6">{user.email}</p>

      <SummaryCards stats={stats} />

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{user.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Age</p>
            <p className="font-medium">{user.age || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="font-medium">{user.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Height</p>
            <p className="font-medium">{user.height ? `${user.height} cm` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Weight</p>
            <p className="font-medium">{user.weight ? `${user.weight} kg` : 'N/A'}</p>
          </div>
        </div>

        {user.conditions && user.conditions.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Conditions</p>
            <div className="flex flex-wrap gap-2">
              {user.conditions.map((condition, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
