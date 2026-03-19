import { useParams } from 'react-router-dom'

export function UserCoursesPage() {
  const { id } = useParams<{ id: string }>()

  // Adapter layer TODO: query user_courses / purchases joined with courses table

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>Courses</h1>
            <p className="muted">User {id}</p>
          </div>
        </div>
        <div className="table-placeholder">
          Implement data adapter for courses purchased and details here.
        </div>
      </div>
    </div>
  )
}

