import { useParams } from 'react-router-dom'

export function UserReportsPage() {
  const { id } = useParams<{ id: string }>()

  // Adapter layer TODO: query user_reports table

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>Reports</h1>
            <p className="muted">User {id}</p>
          </div>
        </div>
        <div className="table-placeholder">
          Implement data adapter for user_reports and report details here.
        </div>
      </div>
    </div>
  )
}

