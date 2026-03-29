import { Link } from 'react-router-dom'
import type { ProfileRow } from '../data/users'

interface Props {
  rows: ProfileRow[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function UsersSheetTable({
  rows,
  loading,
  error,
  page,
  pageSize,
  total,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h1>Users</h1>
          <p className="muted">
            Total {total} users
          </p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Food</th>
              <th>Drink</th>
              <th>Report</th>
              <th>Course</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="table-placeholder">Loading users…</div>
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5}>
                  <div className="table-error">
                    {error}
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="table-placeholder">No users found.</div>
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <ClickableCell to={`/users/${row.id}`} label={row.name || row.email || '(no name)'} />
                </td>
                <td>
                  <ClickableCell to={`/users/${row.id}/food`} label="Food" />
                </td>
                <td>
                  <ClickableCell to={`/users/${row.id}/drink`} label="Drink" />
                </td>
                <td>
                  <ClickableCell to={`/users/${row.id}/reports`} label="Reports" />
                </td>
                <td>
                  <ClickableCell to={`/users/${row.id}/courses`} label="Courses" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span className="muted">
          Showing {rows.length === 0 ? 0 : from}-{to} of {total}
        </span>
        <div className="pagination">
          <button
            type="button"
            className="btn-ghost"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span className="muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

function ClickableCell({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="clickable-cell">
      {label}
    </Link>
  )
}

