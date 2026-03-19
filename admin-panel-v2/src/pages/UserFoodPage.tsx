import { useParams } from 'react-router-dom'

export function UserFoodPage() {
  const { id } = useParams<{ id: string }>()

  // Adapter layer TODO: query food_logs + images by user id and range

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>Food logs</h1>
            <p className="muted">User {id}</p>
          </div>
        </div>
        <div className="table-placeholder">
          Implement data adapter for food_logs + food_log_images here.
        </div>
      </div>
    </div>
  )
}

