import { useParams } from 'react-router-dom'

export function UserDrinkPage() {
  const { id } = useParams<{ id: string }>()

  // Adapter layer TODO: query drink_logs and aggregate by day for charts

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>Drink logs</h1>
            <p className="muted">User {id}</p>
          </div>
        </div>
        <div className="table-placeholder">
          Implement data adapter for drink_logs with today/weekly/monthly views.
        </div>
      </div>
    </div>
  )
}

