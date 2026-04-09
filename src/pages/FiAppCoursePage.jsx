import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fiAppApiUrl } from '../lib/supabaseClientFiApp'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function FiAppCoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [profileRes, coursesRes] = await Promise.all([
        fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/profile`),
        fetch(`${fiAppApiUrl}/api/users/${encodeURIComponent(id)}/courses`),
      ])

      if (profileRes.ok) {
        const json = await profileRes.json()
        setUserName(json.name || 'User')
      }

      if (coursesRes.ok) {
        const json = await coursesRes.json()
        setCourses(json.data || [])
      } else {
        setCourses([])
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-white">Courses - {userName}</h1>
          <p className="text-dark-muted">Purchased and enrolled courses</p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full bg-dark-card border border-dark-border rounded-lg flex items-center justify-center h-64 text-dark-muted">
            No courses found
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-accent-purple/50 transition cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="h-32 bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 flex items-center justify-center border-b border-dark-border">
                <BookOpen className="w-16 h-16 text-accent-purple opacity-30" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{course.title || course.course_name || 'Untitled Course'}</h3>
                {course.description && (
                  <p className="text-dark-muted text-sm mt-2 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      course.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : course.status === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {course.status || 'enrolled'}
                  </span>
                  {course.progress && (
                    <span className="text-xs text-dark-muted">{course.progress}% done</span>
                  )}
                </div>
                {course.progress && (
                  <div className="mt-3 w-full bg-dark-bg rounded-full h-2">
                    <div
                      className="bg-accent-purple h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-border rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedCourse.title || selectedCourse.course_name || 'Untitled Course'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-dark-muted hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {selectedCourse.description && (
              <div className="mt-4 p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-2">Description</p>
                <p className="text-white">{selectedCourse.description}</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-2">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                    selectedCourse.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : selectedCourse.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {selectedCourse.status || 'enrolled'}
                </span>
              </div>
              <div className="p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-2">Progress</p>
                <p className="text-xl font-bold text-accent-purple">{selectedCourse.progress || 0}%</p>
              </div>
            </div>

            {selectedCourse.progress && (
              <div className="mt-4 p-4 bg-dark-bg rounded-lg">
                <p className="text-dark-muted text-xs uppercase mb-3">Progress Bar</p>
                <div className="w-full bg-dark-border rounded-full h-3">
                  <div
                    className="bg-accent-purple h-3 rounded-full transition-all"
                    style={{ width: `${selectedCourse.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {(selectedCourse.purchase_date || selectedCourse.expiry_date) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {selectedCourse.purchase_date && (
                  <div className="p-4 bg-dark-bg rounded-lg">
                    <p className="text-dark-muted text-xs uppercase mb-2">Purchase Date</p>
                    <p className="text-white font-medium">
                      {new Date(selectedCourse.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedCourse.expiry_date && (
                  <div className="p-4 bg-dark-bg rounded-lg">
                    <p className="text-dark-muted text-xs uppercase mb-2">Expiry Date</p>
                    <p className="text-white font-medium">
                      {new Date(selectedCourse.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedCourse(null)}
              className="w-full mt-6 px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 rounded-lg transition font-medium text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
