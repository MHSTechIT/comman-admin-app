import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { useDrinkLogs } from '../hooks/useDrinkLogs'
import { DateRangeFilter } from '../components/DateRangeFilter'

export function DrinkPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly'>('today')

  const { data: user } = useUser(userId)
  const { data: drinkLogs = [], isLoading } = useDrinkLogs({ userId, period })

  const totalAmount = drinkLogs.reduce((sum, log) => sum + log.amount, 0)
  const avgAmount = drinkLogs.length > 0 ? (totalAmount / drinkLogs.length).toFixed(1) : 0

  // Group by type
  const byType = drinkLogs.reduce(
    (acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + log.amount
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div>
      <button
        onClick={() => navigate(`/users/${userId}`)}
        className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
      >
        ← Back to User
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.name} - Drink Reports</h1>

      <DateRangeFilter period={period} onPeriodChange={setPeriod} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Amount</p>
          <p className="text-2xl font-bold">{totalAmount} ml</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Entries</p>
          <p className="text-2xl font-bold">{drinkLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Average</p>
          <p className="text-2xl font-bold">{avgAmount} ml</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Period</p>
          <p className="text-2xl font-bold capitalize">{period}</p>
        </div>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(byType).map(([type, amount]) => (
              <div key={type} className="border border-gray-200 rounded p-4">
                <p className="text-gray-600 text-sm capitalize">{type}</p>
                <p className="text-xl font-bold">{amount} ml</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Amount (ml)
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : drinkLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No drink logs found for this period
                </td>
              </tr>
            ) : (
              drinkLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{log.type}</td>
                  <td className="px-6 py-4 text-sm font-medium">{log.amount} ml</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
