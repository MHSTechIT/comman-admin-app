const STYLES = {
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  LOW_MODERATE: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  MODERATE: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  MODERATE_HIGH: 'bg-red-500/20 text-red-400 border-red-500/40',
  HIGH: 'bg-red-600/30 text-red-300 border-red-500/50',
}

export default function RiskBadge({ level }) {
  const style = STYLES[level] ?? 'bg-gray-500/20 text-gray-400'
  const label = level ? level.replace(/_/g, ' ') : '—'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {label}
    </span>
  )
}
