interface SummaryCardsProps {
  stats: {
    label: string
    value: string | number
    change?: string
  }[]
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          {stat.change && <p className="text-green-600 text-xs mt-1">{stat.change}</p>}
        </div>
      ))}
    </div>
  )
}
