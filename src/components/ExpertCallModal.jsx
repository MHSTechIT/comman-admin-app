export default function ExpertCallModal({ booking, onClose }) {
  if (!booking) return null

  const callDate = booking.call_date
    ? new Date(booking.call_date).toLocaleDateString()
    : '—'
  const createdAt = booking.created_at
    ? new Date(booking.created_at).toLocaleString()
    : '—'

  const statusColors = {
    pending: 'text-yellow-400',
    confirmed: 'text-emerald-400',
    completed: 'text-blue-400',
    cancelled: 'text-red-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Scheduled Call Details</h3>
          <button type="button" onClick={onClose} className="text-dark-muted hover:text-white p-1 rounded">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <Row label="Name" value={booking.name} />
          <Row label="Phone" value={booking.phone} />
          <Row label="Call Date" value={callDate} />
          <Row label="Time Slot" value={booking.time_slot} />
          <Row label="Risk Level" value={booking.risk_level} />
          <Row label="Status">
            <span className={statusColors[booking.status] || 'text-gray-200'}>
              {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : '—'}
            </span>
          </Row>
          <Row label="Booked At" value={createdAt} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, children }) {
  return (
    <div>
      <span className="text-dark-muted block text-xs mb-0.5">{label}</span>
      {children ?? <span className="text-gray-200">{value || '—'}</span>}
    </div>
  )
}
