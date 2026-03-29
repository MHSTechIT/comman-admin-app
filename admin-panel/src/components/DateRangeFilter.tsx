interface DateRangeFilterProps {
  period: 'today' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'today' | 'weekly' | 'monthly') => void
}

export function DateRangeFilter({ period, onPeriodChange }: DateRangeFilterProps) {
  return (
    <div className="flex gap-2 mb-4">
      {(['today', 'weekly', 'monthly'] as const).map((p) => (
        <button
          key={p}
          onClick={() => onPeriodChange(p)}
          className={`px-4 py-2 rounded transition ${
            period === p
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  )
}
