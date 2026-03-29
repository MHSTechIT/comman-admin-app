import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { useUserCourses } from '../hooks/useCourses'

export function CoursesPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const { data: user } = useUser(userId)
  const { data: userCourses = [], isLoading } = useUserCourses(userId)

  return (
    <div>
      <button
        onClick={() => navigate(`/users/${userId}`)}
        className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        ← Back to User
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.name} - Courses</h1>
      <p className="text-gray-600 mb-6">Total courses: {userCourses.length}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : userCourses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No courses purchased
          </div>
        ) : (
          userCourses.map((uc) => (
            <div
              key={uc.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl font-bold mb-1">
                    {uc.progress ? `${uc.progress}%` : '0%'}
                  </div>
                  <div className="text-sm opacity-90">Complete</div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{uc.course?.name}</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium px-2 py-1 rounded text-xs ${
                        uc.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {uc.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchased:</span>
                    <span className="text-gray-900">
                      {new Date(uc.purchase_date).toLocaleDateString()}
                    </span>
                  </div>

                  {uc.expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="text-gray-900">
                        {new Date(uc.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {uc.progress && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uc.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
