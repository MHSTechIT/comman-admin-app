import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { useUserReports } from '../hooks/useReports'

export function ReportsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const { data: user } = useUser(userId)
  const { data: reports = [], isLoading } = useUserReports(userId)

  const selectedReport = reports.find((r) => r.id === selectedReportId)

  return (
    <div>
      <button
        onClick={() => navigate(`/users/${userId}`)}
        className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        ← Back to User
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{user?.name} - Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Reports ({reports.length})</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No reports found</div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                    selectedReportId === report.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900 line-clamp-2">{report.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Report Detail */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedReport ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.title}</h2>
                <p className="text-sm text-gray-600">
                  Created: {new Date(selectedReport.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Updated: {new Date(selectedReport.updated_at).toLocaleString()}
                </p>
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-gray-700">
                  {selectedReport.content}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                  Print
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                  Export
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a report to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
